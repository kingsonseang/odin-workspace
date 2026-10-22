import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { arch, cpus, platform, release, totalmem } from "node:os";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { matchRecords, matchRecordsBaseline } from "../src/match-records.js";
import type {
  MatchResult,
  PrimaryRecord,
  ReferenceRecord,
} from "../src/types.js";

const DATASET_NAMES = ["small", "medium", "large"] as const;
type DatasetName = (typeof DATASET_NAMES)[number];

const DEFAULT_WARMUP_ITERATIONS = 2;
const DEFAULT_MEASURED_ITERATIONS = 7;
const MEASUREMENT_PRECISION = 3;

const REFERENCE_CATEGORIES = new Set([
  "card",
  "bank-transfer",
  "wallet",
  "refund",
]);

const CURRENCIES = new Set(["USD", "EUR", "GBP"]);

interface FixtureFile {
  readonly name: string;
  readonly primary: PrimaryRecord[];
  readonly references: ReferenceRecord[];
}

interface TimingSummary {
  readonly samples: readonly number[];
  readonly median: number;
  readonly min: number;
  readonly max: number;
}

interface DatasetResult {
  readonly name: DatasetName;
  readonly primaryCount: number;
  readonly referenceCount: number;
  readonly baseline: TimingSummary;
  readonly candidate: TimingSummary;
}

type Matcher = (
  primary: readonly PrimaryRecord[],
  references: readonly ReferenceRecord[],
) => MatchResult;

let resultSink = 0;

function readIntegerEnv(
  name: string,
  fallback: number,
  minimum: number,
): number {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(
      `${name} must be an integer greater than or equal to ${minimum}; received "${rawValue}".`,
    );
  }

  return value;
}

function isPrimaryRecord(value: unknown): value is PrimaryRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.referenceKey === "string" &&
    typeof candidate.amountCents === "number" &&
    Number.isFinite(candidate.amountCents) &&
    typeof candidate.currency === "string" &&
    CURRENCIES.has(candidate.currency) &&
    typeof candidate.occurredAt === "string"
  );
}

function isReferenceRecord(value: unknown): value is ReferenceRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.key === "string" &&
    typeof candidate.category === "string" &&
    REFERENCE_CATEGORIES.has(candidate.category) &&
    typeof candidate.riskScore === "number" &&
    Number.isFinite(candidate.riskScore) &&
    typeof candidate.label === "string"
  );
}

function assertFixture(
  value: unknown,
  fixturePath: string,
): asserts value is FixtureFile {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Fixture ${fixturePath} must contain a JSON object.`);
  }

  const candidate = value as Partial<FixtureFile>;

  if (typeof candidate.name !== "string") {
    throw new Error(`Fixture ${fixturePath} must have a string "name" field.`);
  }

  if (!Array.isArray(candidate.primary)) {
    throw new Error(`Fixture ${fixturePath} must have a "primary" array.`);
  }

  if (!Array.isArray(candidate.references)) {
    throw new Error(`Fixture ${fixturePath} must have a "references" array.`);
  }

  const invalidPrimary = candidate.primary.find(
    (record: unknown) => !isPrimaryRecord(record),
  );
  if (invalidPrimary !== undefined) {
    throw new Error(`Fixture ${fixturePath} contains an invalid primary record.`);
  }

  const invalidReference = candidate.references.find(
    (record: unknown) => !isReferenceRecord(record),
  );
  if (invalidReference !== undefined) {
    throw new Error(
      `Fixture ${fixturePath} contains an invalid reference record.`,
    );
  }
}

function loadFixture(datasetName: DatasetName): FixtureFile {
  const fixturePath = resolve(
    process.cwd(),
    "fixtures",
    `${datasetName}-records.json`,
  );

  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(fixturePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not load fixture ${fixturePath}.`, { cause: error });
  }

  assertFixture(parsed, fixturePath);

  if (parsed.name !== datasetName) {
    throw new Error(
      `Fixture ${fixturePath} declares name "${parsed.name}" instead of "${datasetName}".`,
    );
  }

  return parsed;
}

function freezeFixture(fixture: FixtureFile): void {
  for (const record of fixture.primary) {
    Object.freeze(record);
  }

  for (const record of fixture.references) {
    Object.freeze(record);
  }

  Object.freeze(fixture.primary);
  Object.freeze(fixture.references);
  Object.freeze(fixture);
}

function verifyEquivalentResults(
  datasetName: DatasetName,
  baselineResult: MatchResult,
  candidateResult: MatchResult,
): void {
  try {
    assert.deepStrictEqual(candidateResult, baselineResult);
  } catch (error) {
    throw new Error(
      `Candidate output is not equivalent to baseline output for dataset "${datasetName}". ` +
        "Correctness must be fixed before benchmark results are meaningful.",
      { cause: error },
    );
  }
}

function measure(
  matcher: Matcher,
  primary: readonly PrimaryRecord[],
  references: readonly ReferenceRecord[],
): number {
  const startedAt = performance.now();
  const result = matcher(primary, references);
  const elapsedMs = performance.now() - startedAt;

  // Keep the result observable so the call cannot be optimized away.
  resultSink += result.length;

  return elapsedMs;
}

function summarize(samples: readonly number[]): TimingSummary {
  if (samples.length === 0) {
    throw new Error("Cannot summarize an empty set of measurements.");
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const middleIndex = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? (sorted[middleIndex] as number)
      : ((sorted[middleIndex - 1] as number) +
          (sorted[middleIndex] as number)) /
        2;

  return {
    samples: [...samples],
    median,
    min: sorted[0] as number,
    max: sorted[sorted.length - 1] as number,
  };
}

function formatMilliseconds(value: number): string {
  return value.toFixed(MEASUREMENT_PRECISION);
}

function formatSamples(samples: readonly number[]): string {
  return samples.map(formatMilliseconds).join(", ");
}

function printTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): void {
  const widths = headers.map((header, columnIndex) =>
    Math.max(
      header.length,
      ...rows.map((row) => row[columnIndex]?.length ?? 0),
    ),
  );

  const formatRow = (row: readonly string[]): string =>
    row
      .map((cell, columnIndex) =>
        cell.padEnd(widths[columnIndex] as number),
      )
      .join("  ")
      .trimEnd();

  console.log(formatRow(headers));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of rows) {
    console.log(formatRow(row));
  }
}

function printEnvironment(
  warmupIterations: number,
  measuredIterations: number,
): void {
  const cpu = cpus()[0]?.model ?? "Unknown CPU";
  const memoryGiB = (totalmem() / 1024 ** 3).toFixed(1);

  console.log("Record matcher benchmark");
  console.log("========================");
  console.log(`Recorded at:        ${new Date().toISOString()}`);
  console.log(`Node:               ${process.version}`);
  console.log(`V8:                 ${process.versions.v8}`);
  console.log(`Platform:           ${platform()} ${release()} ${arch()}`);
  console.log(`CPU:                ${cpu}`);
  console.log(`Memory:             ${memoryGiB} GiB`);
  console.log(`Warm-up iterations: ${warmupIterations}`);
  console.log(`Timed iterations:   ${measuredIterations}`);
  console.log("Execution order:    alternating per dataset and iteration");
  console.log("");
}

function runDataset(
  datasetName: DatasetName,
  warmupIterations: number,
  measuredIterations: number,
): DatasetResult {
  const fixture = loadFixture(datasetName);
  freezeFixture(fixture);

  const primary = fixture.primary;
  const references = fixture.references;

  console.log(
    `[${datasetName}] ${primary.length.toLocaleString("en-US")} primary / ` +
      `${references.length.toLocaleString("en-US")} references`,
  );

  const baselineResult = matchRecordsBaseline(primary, references);
  const candidateResult = matchRecords(primary, references);

  verifyEquivalentResults(datasetName, baselineResult, candidateResult);
  console.log("[ok] candidate output is equivalent to baseline output");

  for (let iteration = 0; iteration < warmupIterations; iteration += 1) {
    matchRecordsBaseline(primary, references);
    matchRecords(primary, references);
  }

  const baselineSamples: number[] = [];
  const candidateSamples: number[] = [];

  for (let iteration = 0; iteration < measuredIterations; iteration += 1) {
    const baselineFirst = iteration % 2 === 0;

    if (baselineFirst) {
      baselineSamples.push(measure(matchRecordsBaseline, primary, references));
      candidateSamples.push(measure(matchRecords, primary, references));
    } else {
      candidateSamples.push(measure(matchRecords, primary, references));
      baselineSamples.push(measure(matchRecordsBaseline, primary, references));
    }
  }

  return {
    name: datasetName,
    primaryCount: primary.length,
    referenceCount: references.length,
    baseline: summarize(baselineSamples),
    candidate: summarize(candidateSamples),
  };
}

function main(): void {
  const warmupIterations = readIntegerEnv(
    "BENCH_WARMUP",
    DEFAULT_WARMUP_ITERATIONS,
    0,
  );
  const measuredIterations = readIntegerEnv(
    "BENCH_ITERATIONS",
    DEFAULT_MEASURED_ITERATIONS,
    1,
  );

  printEnvironment(warmupIterations, measuredIterations);

  const results = DATASET_NAMES.map((datasetName) =>
    runDataset(datasetName, warmupIterations, measuredIterations),
  );

  console.log("");
  console.log("Raw measurements and per-implementation summaries");
  console.log("-------------------------------------------------");

  const timingRows: string[][] = [];

  for (const result of results) {
    timingRows.push([
      result.name,
      result.primaryCount.toLocaleString("en-US"),
      result.referenceCount.toLocaleString("en-US"),
      "baseline",
      formatMilliseconds(result.baseline.median),
      formatMilliseconds(result.baseline.min),
      formatMilliseconds(result.baseline.max),
      formatSamples(result.baseline.samples),
    ]);

    timingRows.push([
      result.name,
      result.primaryCount.toLocaleString("en-US"),
      result.referenceCount.toLocaleString("en-US"),
      "candidate",
      formatMilliseconds(result.candidate.median),
      formatMilliseconds(result.candidate.min),
      formatMilliseconds(result.candidate.max),
      formatSamples(result.candidate.samples),
    ]);
  }

  printTable(
    [
      "Dataset",
      "Primary",
      "Refs",
      "Implementation",
      "Median (ms)",
      "Min (ms)",
      "Max (ms)",
      "Raw samples (ms)",
    ],
    timingRows,
  );

  console.log("");
  console.log("Measured comparison (derived from this run only)");
  console.log("-------------------------------------------------");

  const comparisonRows = results.map((result) => {
    const ratio =
      result.baseline.median > 0
        ? result.candidate.median / result.baseline.median
        : Number.NaN;

    return [
      result.name,
      formatMilliseconds(result.baseline.median),
      formatMilliseconds(result.candidate.median),
      Number.isFinite(ratio) ? `${ratio.toFixed(3)}x` : "n/a",
    ];
  });

  printTable(
    [
      "Dataset",
      "Baseline median (ms)",
      "Candidate median (ms)",
      "Candidate / baseline",
    ],
    comparisonRows,
  );

  console.log("");
  console.log(`Result rows observed during timing: ${resultSink.toLocaleString("en-US")}`);
  console.log("");
  console.log("Notes");
  console.log("-----");
  console.log(
    "- Every number above was measured during this execution on this machine.",
  );
  console.log(
    "- A single timing is not conclusive. Repeat the benchmark and record the raw samples.",
  );
  console.log(
    "- Times depend on hardware, OS, Node version, process state, and run-to-run noise.",
  );
  console.log(
    "- The ratio is descriptive, not a guaranteed or expected speedup. No performance target is encoded.",
  );
  console.log(
    "- If matchRecords still delegates to the baseline, similar values are expected.",
  );
}

main();
