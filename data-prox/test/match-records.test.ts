import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { matchRecords } from "../src/match-records.js";
import type {
  PrimaryRecord,
  ReferenceRecord,
} from "../src/types.js";

function makePrimary(
  id: string,
  referenceKey: string,
  overrides: Partial<Omit<PrimaryRecord, "id" | "referenceKey">> = {},
): PrimaryRecord {
  return {
    id,
    referenceKey,
    amountCents: 1_000,
    currency: "USD",
    occurredAt: "2026-01-15T12:00:00.000Z",
    ...overrides,
  };
}

function makeReference(
  key: string,
  label: string,
  overrides: Partial<Omit<ReferenceRecord, "key" | "label">> = {},
): ReferenceRecord {
  return {
    key,
    label,
    category: "card",
    riskScore: 10,
    ...overrides,
  };
}

function freezeRecords<T extends object>(records: readonly T[]): readonly T[] {
  for (const record of records) {
    Object.freeze(record);
  }

  return Object.freeze(records);
}

describe("matchRecords", () => {
  it("returns one result per primary record in primary input order", () => {
    const primaryRecords = [
      makePrimary("txn-1", "ref-b"),
      makePrimary("txn-2", "ref-missing"),
      makePrimary("txn-3", "ref-a"),
      makePrimary("txn-4", "ref-b"),
    ];
    const references = [
      makeReference("ref-a", "Reference A"),
      makeReference("ref-b", "Reference B"),
    ];

    const result = matchRecords(primaryRecords, references);

    assert.deepEqual(
      result.map((match) => match.primary.referenceKey),
      ["ref-b", "ref-missing", "ref-a", "ref-b"],
    );
    assert.deepEqual(
      result.map((match) => match.status),
      ["matched", "missing-reference", "matched", "matched"],
    );
    assert.deepEqual(
      result.map((match) => match.referenceIndex),
      [1, null, 0, 1],
    );
    assert.deepEqual(
      result.map((match) => match.reference?.label ?? null),
      ["Reference B", null, "Reference A", "Reference B"],
    );
  });

  it("matches on referenceKey rather than the primary id", () => {
    const primaryRecords = [makePrimary("ref-a", "not-a-reference-key")];
    const references = [makeReference("ref-a", "Reference A")];

    const [match] = matchRecords(primaryRecords, references);

    assert.ok(match);
    assert.equal(match.status, "missing-reference");
    assert.equal(match.reference, null);
    assert.equal(match.referenceIndex, null);
  });

  it("keeps a missing-reference entry instead of dropping the primary record", () => {
    const primaryRecords = [
      makePrimary("txn-1", "ref-a"),
      makePrimary("txn-2", "ref-missing"),
      makePrimary("txn-3", "ref-c"),
    ];
    const references = [
      makeReference("ref-a", "Reference A"),
      makeReference("ref-c", "Reference C"),
    ];

    const result = matchRecords(primaryRecords, references);

    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((match) => match.status),
      ["matched", "missing-reference", "matched"],
    );
    assert.equal(result[1]?.primary.id, "txn-2");
    assert.equal(result[1]?.reference, null);
    assert.equal(result[1]?.referenceIndex, null);
  });

  it("selects the first reference when several references share a key", () => {
    const primaryRecords = [
      makePrimary("txn-1", "shared-key"),
      makePrimary("txn-2", "shared-key"),
    ];
    const references = [
      makeReference("shared-key", "First occurrence", { riskScore: 1 }),
      makeReference("other-key", "Other reference", { riskScore: 50 }),
      makeReference("shared-key", "Later occurrence", { riskScore: 99 }),
    ];

    const result = matchRecords(primaryRecords, references);

    for (const match of result) {
      assert.equal(match.status, "matched");
      assert.equal(match.referenceIndex, 0);
      assert.equal(match.reference?.label, "First occurrence");
      assert.equal(match.reference?.riskScore, 1);
    }
  });

  it("treats duplicate primary identifiers as independent records", () => {
    const primaryRecords = [
      makePrimary("duplicate-id", "ref-a"),
      makePrimary("duplicate-id", "ref-missing"),
      makePrimary("duplicate-id", "ref-b"),
    ];
    const references = [
      makeReference("ref-a", "Reference A"),
      makeReference("ref-b", "Reference B"),
    ];

    const result = matchRecords(primaryRecords, references);

    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((match) => match.primary.id),
      ["duplicate-id", "duplicate-id", "duplicate-id"],
    );
    assert.deepEqual(
      result.map((match) => match.status),
      ["matched", "missing-reference", "matched"],
    );
    assert.deepEqual(
      result.map((match) => match.reference?.label ?? null),
      ["Reference A", null, "Reference B"],
    );
  });

  it("returns an empty result for an empty primary collection", () => {
    const references = [makeReference("ref-a", "Reference A")];

    assert.deepEqual(matchRecords([], references), []);
  });

  it("returns a missing-reference entry for every primary when references are empty", () => {
    const primaryRecords = [
      makePrimary("txn-1", "ref-a"),
      makePrimary("txn-2", "ref-b"),
      makePrimary("txn-3", "ref-a"),
    ];

    const result = matchRecords(primaryRecords, []);

    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((match) => match.primary.referenceKey),
      ["ref-a", "ref-b", "ref-a"],
    );
    assert.deepEqual(
      result.map((match) => match.status),
      ["missing-reference", "missing-reference", "missing-reference"],
    );
    assert.deepEqual(
      result.map((match) => match.referenceIndex),
      [null, null, null],
    );
    assert.deepEqual(
      result.map((match) => match.reference),
      [null, null, null],
    );
  });

  it("does not mutate either input collection or its records", () => {
    const primaryRecords = [
      makePrimary("txn-1", "ref-b"),
      makePrimary("txn-2", "ref-missing"),
      makePrimary("txn-3", "ref-a"),
    ];
    const references = [
      makeReference("ref-a", "Reference A"),
      makeReference("ref-b", "Reference B"),
      makeReference("ref-b", "Later Reference B"),
    ];
    const primarySnapshot = structuredClone(primaryRecords);
    const referenceSnapshot = structuredClone(references);

    const frozenPrimary = freezeRecords(primaryRecords);
    const frozenReferences = freezeRecords(references);

    const result = matchRecords(frozenPrimary, frozenReferences);

    assert.equal(result.length, primaryRecords.length);
    assert.deepEqual(primaryRecords, primarySnapshot);
    assert.deepEqual(references, referenceSnapshot);
  });

  it("preserves the contract for a larger collection with duplicates and gaps", () => {
    const referenceRecords: ReferenceRecord[] = [];

    for (let index = 0; index < 800; index += 1) {
      referenceRecords.push(
        makeReference(`ref-${index}`, `First ref-${index}`, {
          riskScore: index % 101,
        }),
      );

      if (index % 41 === 0) {
        referenceRecords.push(
          makeReference(`ref-${index}`, `Late duplicate ref-${index}`, {
            riskScore: 99,
          }),
        );
      }
    }

    const firstReferenceIndexByKey = new Map<string, number>();
    for (let index = 0; index < referenceRecords.length; index += 1) {
      const reference = referenceRecords[index] as ReferenceRecord;
      if (!firstReferenceIndexByKey.has(reference.key)) {
        firstReferenceIndexByKey.set(reference.key, index);
      }
    }

    const primaryRecords: PrimaryRecord[] = [];
    for (let index = 0; index < 2_500; index += 1) {
      const referenceKey =
        index % 13 === 0 ? `orphan-${index}` : `ref-${index % 800}`;

      primaryRecords.push(
        makePrimary(`txn-${index % 613}`, referenceKey, {
          amountCents: index,
        }),
      );
    }

    const result = matchRecords(primaryRecords, referenceRecords);

    assert.equal(result.length, primaryRecords.length);

    const actual = result.map((match) => ({
      id: match.primary.id,
      referenceKey: match.primary.referenceKey,
      status: match.status,
      referenceIndex: match.referenceIndex,
      referenceLabel: match.reference?.label ?? null,
    }));

    const expected = primaryRecords.map((record) => {
      const referenceIndex = firstReferenceIndexByKey.get(record.referenceKey);

      if (referenceIndex === undefined) {
        return {
          id: record.id,
          referenceKey: record.referenceKey,
          status: "missing-reference" as const,
          referenceIndex: null,
          referenceLabel: null,
        };
      }

      return {
        id: record.id,
        referenceKey: record.referenceKey,
        status: "matched" as const,
        referenceIndex,
        referenceLabel:
          (referenceRecords[referenceIndex] as ReferenceRecord).label,
      };
    });

    assert.deepEqual(actual, expected);
  });
});
