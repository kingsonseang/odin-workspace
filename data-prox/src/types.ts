export type Currency = "USD" | "EUR" | "GBP";

export type ReferenceCategory = "card" | "bank-transfer" | "wallet" | "refund";

/**
 * A record from the primary (transaction-like) collection.
 *
 * `id` is an identifier for the record itself. It is not assumed to be unique,
 * and it is not used to find a matching reference. Matching uses
 * `referenceKey`, which is compared with `ReferenceRecord.key`.
 */
export interface PrimaryRecord {
  readonly id: string;
  readonly referenceKey: string;
  readonly amountCents: number;
  readonly currency: Currency;
  readonly occurredAt: string;
}

/**
 * A record from the reference collection.
 *
 * Keys are not assumed to be unique. When several reference records share the
 * same key, the one that appears first in the reference input array is used.
 */
export interface ReferenceRecord {
  readonly key: string;
  readonly category: ReferenceCategory;
  readonly riskScore: number;
  readonly label: string;
}

export type MatchStatus = "matched" | "missing-reference";

/**
 * The result of matching one primary record.
 *
 * Every primary record produces exactly one MatchRecord. A missing reference is
 * represented explicitly rather than being omitted from the result.
 */
export interface MatchRecord {
  /** The original primary record, unchanged. */
  readonly primary: PrimaryRecord;

  /** The selected reference record, unchanged, or null when no key matched. */
  readonly reference: ReferenceRecord | null;

  readonly status: MatchStatus;

  /**
   * Index of the selected reference in the original reference array.
   * Null when no reference key matched.
   */
  readonly referenceIndex: number | null;
}

/**
 * One result per primary record, in the same order as the primary input array.
 */
export type MatchResult = readonly MatchRecord[];
