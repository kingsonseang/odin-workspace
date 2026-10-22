import type {
  MatchRecord,
  MatchResult,
  PrimaryRecord,
  ReferenceRecord,
} from "./types.js";

/**
 * Reference implementation of the matching contract.
 *
 * This implementation intentionally searches the reference collection from the
 * beginning for every primary record. It is correct, but its repeated linear
 * searches become expensive as both collections grow.
 *
 * Keep this function unchanged so the benchmark can use it as a stable
 * comparison point.
 */
export function matchRecordsBaseline(
  primary: readonly PrimaryRecord[],
  references: readonly ReferenceRecord[],
): MatchResult {
  const matches: MatchRecord[] = [];

  for (const record of primary) {
    const referenceIndex = references.findIndex(
      (reference) => reference.key === record.referenceKey,
    );

    if (referenceIndex === -1) {
      matches.push({
        primary: record,
        reference: null,
        status: "missing-reference",
        referenceIndex: null,
      });
      continue;
    }

    const reference = references[referenceIndex] as ReferenceRecord;

    matches.push({
      primary: record,
      reference,
      status: "matched",
      referenceIndex,
    });
  }

  return matches;
}

/**
 * Public matching entry point.
 *
 * Contract:
 * - Returns one result per primary record, in primary input order.
 * - Matches `primary.referenceKey` against `reference.key`.
 * - Uses the first reference record when several references share a key.
 * - Emits a `missing-reference` result when no reference key matches.
 * - Never mutates the input arrays or records.
 * - Treats duplicate primary identifiers as independent records.
 *
 * Starter state: this delegates to the baseline. Replace the implementation
 * while preserving this function's signature and the result contract above.
 */
export function matchRecords(
  primary: readonly PrimaryRecord[],
  references: readonly ReferenceRecord[],
): MatchResult {
  return matchRecordsBaseline(primary, references);
}
