import type { ImportColumn, ImportRecord } from "./types.js";

/**
 * Fictional import schema used by the exercise.
 *
 * This file records the target contract. The starter validator intentionally
 * implements only part of it; see README.md for the known gaps.
 */
export const REQUIRED_COLUMNS = [
  "record_id",
  "display_name",
  "start_date",
  "amount",
] as const satisfies readonly ImportColumn[];

export const COLUMN_TO_RECORD_KEY: Readonly<
  Record<ImportColumn, keyof ImportRecord>
> = {
  record_id: "recordId",
  display_name: "displayName",
  start_date: "startDate",
  amount: "amount",
};

/** Target date grammar. Calendar validity must also be checked. */
export const DATE_SHAPE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Target decimal grammar; range checking is a separate requirement. */
export const AMOUNT_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export const AMOUNT_MIN = -1_000_000;
export const AMOUNT_MAX = 1_000_000;

export const NORMALIZATION_POLICY =
  "Trim leading and trailing ASCII spaces and tabs before validation. " +
  "Do not collapse internal whitespace, change case, or Unicode-normalize values.";

export const DUPLICATE_ID_POLICY =
  "Compare trimmed record_id values case-sensitively. The first occurrence is " +
  "canonical; every later occurrence is a duplicate error.";
