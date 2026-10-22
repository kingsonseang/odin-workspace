# Record Matcher Performance Lab

A small, self-contained TypeScript exercise about joining two collections of
transaction-like records.

The repository starts with a **correct but intentionally inefficient** matching
implementation. The task is to investigate it, replace the public implementation
with a better one, and demonstrate that the result is still correct across normal
and edge-case inputs.

> **All benchmark results must be collected on the actual recording machine.**
> Do not copy timings from this README, another computer, CI, or a previous run.
> No expected speedup is encoded anywhere in this repository.

## Requirements

- Node.js 20.11 or newer (Node.js 22/24 LTS is recommended for ongoing work)
- npm
- No network services, APIs, databases, or external data are used at runtime

The checked-in commands are compatible with the Node.js version used to create
the starter repository (`v20.11.1`, npm `10.2.4`).

## Setup

```sh
npm install
npm run typecheck
npm test
npm run build
npm run bench
```

`npm run build` type-checks and compiles the project to `dist/`.

## Public API

```ts
import { matchRecords } from "./src/match-records.js";
import type {
  MatchResult,
  PrimaryRecord,
  ReferenceRecord,
} from "./src/types.js";

const result: MatchResult = matchRecords(primaryRecords, referenceRecords);
```

The public signature is:

```ts
function matchRecords(
  primary: readonly PrimaryRecord[],
  references: readonly ReferenceRecord[],
): MatchResult;
```

`src/match-records.ts` also exports `matchRecordsBaseline`. That function is the
stable reference implementation used by the benchmark. Leave it unchanged.

## Behavior contract

Matching is a left join from the primary collection to the reference collection.

| Case | Behavior |
| --- | --- |
| Output shape | Exactly one `MatchRecord` per primary record, in the same order as the primary input array |
| Match key | `primary.referenceKey` is compared with `reference.key`; `primary.id` is not a matching key |
| Missing reference | The primary record is retained with `reference: null`, `status: "missing-reference"`, and `referenceIndex: null` |
| Duplicate reference keys | The **first** reference record in input-array order wins; `referenceIndex` identifies it |
| Duplicate primary identifiers | Every primary record is processed independently. Duplicate `id` values are not merged, deduplicated, or rejected |
| Empty primary collection | Returns an empty result |
| Empty reference collection | Returns one missing-reference result per primary record |
| Input mutation | Input arrays and records are never mutated. Result entries reference the original records and must be treated as read-only |

The corresponding types are documented in `src/types.ts`:

```ts
interface MatchRecord {
  readonly primary: PrimaryRecord;
  readonly reference: ReferenceRecord | null;
  readonly status: "matched" | "missing-reference";
  readonly referenceIndex: number | null;
}
```

For example, a duplicate reference key is resolved like this:

```text
references: [ { key: "acct-7", label: "first" },
              { key: "acct-7", label: "later" } ]

result for primary.referenceKey === "acct-7":
  { reference: { key: "acct-7", label: "first" },
    referenceIndex: 0,
    status: "matched" }
```

## Repository layout

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts
│   └── match-records.ts
├── test/
│   └── match-records.test.ts
├── bench/
│   └── run-benchmark.ts
├── fixtures/
│   ├── small-records.json
│   ├── medium-records.json
│   └── large-records.json
└── docs/
    └── performance-report-template.md
```

## Starting implementation and task

`matchRecordsBaseline` searches the reference collection from the start for every
primary record. It is deliberately simple and correct, but it repeats work as the
collections grow. `matchRecords` currently delegates to it.

Complete the task in this order:

1. Run the tests to establish correctness.
2. Run the benchmark on the actual recording machine and retain the raw output.
3. Investigate the baseline implementation and collect evidence for the main
   bottleneck.
4. Implement a replacement behind `matchRecords` without changing its signature,
   result shape, or documented behavior. New helper files are allowed.
5. Run the behavior tests and add coverage for any newly discovered edge case.
6. Run the benchmark again. It verifies baseline/candidate equivalence before
   collecting timings.
7. Fill in `docs/performance-report-template.md` with results and limitations
   from the recording machine.

Do not:

- Change `matchRecordsBaseline` to make the comparison look better.
- Weaken or rewrite tests to make an implementation pass.
- Edit fixtures to favor a particular implementation.
- Hard-code a speedup percentage or claim an expected improvement.
- Treat one timing sample as conclusive.

## Tests

Tests use Node.js's built-in, maintained `node:test` runner with
`node:assert/strict`. No external test-runner package is required.

```sh
npm test
```

The suite covers order preservation, missing references, duplicate reference
keys, duplicate primary identifiers, empty collections, non-mutation, and a
larger mixed case. The tests define observable behavior only: they do not assert
timing, implementation strategy, or internal data structures.

## Benchmark

```sh
npm run bench
```

The benchmark:

- Loads the three checked-in fixtures.
- Runs `matchRecordsBaseline` and `matchRecords` against the same frozen inputs.
- Verifies deep equivalence of both outputs **before** collecting timing data.
- Performs warm-up iterations for both implementations.
- Interleaves the order of baseline and candidate runs across measured iterations.
- Prints raw samples, plus median, minimum, and maximum for each implementation.
- Prints a runtime-derived candidate/baseline ratio with no predefined target.
- Prints the machine and runtime details used for the measurements.

Optional configuration:

```sh
BENCH_WARMUP=3 BENCH_ITERATIONS=9 npm run bench
```

Defaults are 2 warm-up iterations and 7 measured iterations. These are
measurement controls only; they do not imply a performance target.

Because the starter's `matchRecords` delegates to the baseline, similar timings
are expected before a replacement is implemented. That is not a benchmark
result to report as an optimization.

A single measurement is affected by hardware, OS, Node.js version, CPU state,
garbage collection, thermal conditions, and ordinary run-to-run variance.
Repeat measurements and report raw samples rather than a single number.

## Fixtures

Each fixture is a local JSON object:

```json
{
  "name": "small",
  "primary": [],
  "references": []
}
```

| Fixture | Primary records | Reference records | Notes |
| --- | ---: | ---: | --- |
| `small-records.json` | 24 | 12 | Curated gaps, duplicate primary IDs, and repeated reference keys |
| `medium-records.json` | 1,000 | 400 | Mixed matches, missing keys, duplicate primary IDs, and late duplicate reference keys |
| `large-records.json` | 8,000 | 3,000 | Larger version of the same deterministic synthetic shape |

The fixtures are synthetic, checked in, and loaded as-is. They contain no real
data. The benchmark performs no random generation, network access, or external
lookup, so repeated runs use the same records.

## Dependencies

There are **no runtime dependencies**. All direct dependencies are development
tools:

| Package | Scope | Why it is present |
| --- | --- | --- |
| `typescript` | dev | Strict type checking and compilation to `dist/` |
| `tsx` | dev | Executes TypeScript tests and the benchmark directly without a separate build step |
| `@types/node` | dev | TypeScript declarations for Node.js built-ins such as `node:test`, `node:fs`, and `node:perf_hooks` |

The test runner itself is `node:test`, built into Node.js and maintained with
Node.js. No Jest, Vitest, Mocha, or assertion library is installed.

## Recording performance

Use `docs/performance-report-template.md`. Record:

- The actual machine, OS, CPU, memory, Node.js version, and npm version.
- The exact fixture sizes and benchmark configuration.
- Raw measurements and the median for each implementation.
- Correctness evidence, including the benchmark's equivalence check.
- Limitations and run-to-run variation.

Do not fabricate, estimate, or copy performance numbers. The report must state
that timings were collected on the recording machine and that one run is not
conclusive.
