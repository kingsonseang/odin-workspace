/**
 * Public result types for the CSV import validator.
 *
 * The validator is deliberately report-only: it never writes or imports data.
 * Every parsed data row is returned, including invalid rows and their original
 * fields. Callers decide what to do with the report.
 */

export type ImportColumn =
  | "record_id"
  | "display_name"
  | "start_date"
  | "amount";

export type ValidationIssueCode =
  | "MISSING_HEADER"
  | "MISSING_COLUMN"
  | "UNEXPECTED_COLUMN"
  | "DUPLICATE_COLUMN"
  | "CSV_PARSE_ERROR"
  | "EMPTY_ROW"
  | "MALFORMED_ROW"
  | "MISSING_REQUIRED_VALUE"
  | "INVALID_DATE"
  | "INVALID_AMOUNT"
  | "DUPLICATE_IDENTIFIER";

/**
 * One structured validation problem.
 *
 * File-level issues have `rowNumber: null`. Row-level issues always identify
 * the 1-based CSV record number, where the header is record 1.
 */
export interface ValidationIssue {
  code: ValidationIssueCode;
  message: string;
  rowNumber: number | null;
  column: string | null;
  /** The untrimmed source value when the issue relates to a field. */
  value: string | null;
}

/** Original data retained for every parsed row. */
export interface RawRow {
  /** 1-based CSV record number. The header is row 1, so data starts at row 2. */
  rowNumber: number;
  /** All parsed fields, including fields beyond the declared header. */
  fields: string[];
  /** Values addressable by header name; missing fields are absent. */
  byColumn: Record<string, string>;
}

export interface ImportRecord {
  recordId: string;
  displayName: string;
  startDate: string;
  amount: number;
}

export interface ValidRowResult {
  status: "valid";
  rowNumber: number;
  raw: RawRow;
  record: ImportRecord;
  errors: [];
}

export interface InvalidRowResult {
  status: "invalid";
  rowNumber: number;
  raw: RawRow;
  record: null;
  errors: ValidationIssue[];
}

export type RowResult = ValidRowResult | InvalidRowResult;

export interface HeaderInfo {
  present: boolean;
  columns: string[];
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
}

/**
 * The starter uses `reject-file` as a provisional policy. A completed exercise
 * must make and document the final choice; `import-valid-rows` is reserved for
 * the alternative partitioning policy.
 */
export type InvalidRowPolicy = "reject-file" | "import-valid-rows";

export interface ValidationDecision {
  policy: InvalidRowPolicy;
  acceptedForImport: boolean;
  validRowNumbers: number[];
  invalidRowNumbers: number[];
  blockedBy: Array<"file-errors" | "row-errors">;
}

export interface ValidationResult {
  header: HeaderInfo;
  fileIssues: ValidationIssue[];
  rows: RowResult[];
  summary: ValidationSummary;
  decision: ValidationDecision;
}
