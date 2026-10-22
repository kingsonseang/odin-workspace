import { parse } from "csv-parse/sync";

import { DATE_SHAPE_PATTERN, REQUIRED_COLUMNS } from "./schema.js";
import type {
  ImportRecord,
  InvalidRowPolicy,
  InvalidRowResult,
  RawRow,
  RowResult,
  ValidationIssue,
  ValidationIssueCode,
  ValidationResult,
  ValidRowResult,
} from "./types.js";

/**
 * The starter's provisional policy. The exercise requires the engineer to
 * choose, implement, and document the final handling of invalid rows.
 */
export const PROVISIONAL_INVALID_ROW_POLICY: InvalidRowPolicy = "reject-file";

const CSV_PARSE_OPTIONS = {
  bom: true,
  columns: false,
  relax_column_count: true,
  skip_empty_lines: false,
  trim: false,
} as const;

function makeIssue(
  code: ValidationIssueCode,
  message: string,
  rowNumber: number | null = null,
  column: string | null = null,
  value: string | null = null,
): ValidationIssue {
  return { code, message, rowNumber, column, value };
}

function makeRawRow(
  fields: string[],
  rowNumber: number,
  columnIndexes: ReadonlyMap<string, number>,
): RawRow {
  const byColumn: Record<string, string> = {};

  for (const [column, index] of columnIndexes) {
    const value = fields[index];
    if (value !== undefined) {
      byColumn[column] = value;
    }
  }

  return {
    rowNumber,
    fields: [...fields],
    byColumn,
  };
}

function invalidRow(
  fields: string[],
  rowNumber: number,
  columnIndexes: ReadonlyMap<string, number>,
  errors: ValidationIssue[],
): InvalidRowResult {
  return {
    status: "invalid",
    rowNumber,
    raw: makeRawRow(fields, rowNumber, columnIndexes),
    record: null,
    errors,
  };
}

/**
 * Validation is intentionally incomplete in this starter. Known gaps include
 * trimming/normalization, strict calendar checks, the exact amount grammar,
 * duplicate detection, unexpected-column detection, and duplicate headers.
 */
function validateRow(
  fields: string[],
  rowNumber: number,
  headerColumnCount: number,
  columnIndexes: ReadonlyMap<string, number>,
): RowResult {
  if (fields.every((field) => field.trim() === "")) {
    return invalidRow(fields, rowNumber, columnIndexes, [
      makeIssue("EMPTY_ROW", "Row is empty.", rowNumber),
    ]);
  }

  if (fields.length !== headerColumnCount) {
    return invalidRow(fields, rowNumber, columnIndexes, [
      makeIssue(
        "MALFORMED_ROW",
        `Expected ${headerColumnCount} fields but found ${fields.length}.`,
        rowNumber,
      ),
    ]);
  }

  const byColumn = makeRawRow(fields, rowNumber, columnIndexes).byColumn;
  const errors: ValidationIssue[] = [];

  const recordId = byColumn["record_id"];
  if (recordId === undefined || recordId.length === 0) {
    errors.push(
      makeIssue(
        "MISSING_REQUIRED_VALUE",
        "record_id is required.",
        rowNumber,
        "record_id",
        recordId ?? "",
      ),
    );
  }

  const displayName = byColumn["display_name"];
  if (displayName === undefined || displayName.length === 0) {
    errors.push(
      makeIssue(
        "MISSING_REQUIRED_VALUE",
        "display_name: required value is blank",
        rowNumber,
        "display_name",
        displayName ?? "",
      ),
    );
  }

  const startDate = byColumn["start_date"];
  if (startDate === undefined || startDate.length === 0) {
    errors.push(
      makeIssue(
        "MISSING_REQUIRED_VALUE",
        "start_date is required",
        rowNumber,
        "start_date",
        startDate ?? "",
      ),
    );
  } else if (!DATE_SHAPE_PATTERN.test(startDate)) {
    errors.push(
      makeIssue(
        "INVALID_DATE",
        "start_date is not in YYYY-MM-DD form",
        rowNumber,
        "start_date",
        startDate,
      ),
    );
  }

  const rawAmount = byColumn["amount"];
  let parsedAmount: number | null = null;

  if (rawAmount === undefined || rawAmount.length === 0) {
    errors.push(
      makeIssue(
        "MISSING_REQUIRED_VALUE",
        "The amount field is required",
        rowNumber,
        "amount",
        rawAmount ?? "",
      ),
    );
  } else {
    const numberValue = Number(rawAmount);
    if (!Number.isFinite(numberValue)) {
      errors.push(
        makeIssue(
          "INVALID_AMOUNT",
          "amount is not a number",
          rowNumber,
          "amount",
          rawAmount,
        ),
      );
    } else {
      parsedAmount = numberValue;
    }
  }

  if (
    errors.length > 0 ||
    recordId === undefined ||
    displayName === undefined ||
    startDate === undefined ||
    parsedAmount === null
  ) {
    return invalidRow(fields, rowNumber, columnIndexes, errors);
  }

  const record: ImportRecord = {
    recordId,
    displayName,
    startDate,
    amount: parsedAmount,
  };

  const valid: ValidRowResult = {
    status: "valid",
    rowNumber,
    raw: makeRawRow(fields, rowNumber, columnIndexes),
    record,
    errors: [],
  };

  return valid;
}

function buildResult(
  headerColumns: string[],
  fileIssues: ValidationIssue[],
  rows: RowResult[],
): ValidationResult {
  const validRows = rows.filter((row) => row.status === "valid");
  const invalidRows = rows.filter((row) => row.status === "invalid");
  const blockedBy: ValidationDecisionBlockers = [];

  if (fileIssues.length > 0) {
    blockedBy.push("file-errors");
  }
  if (invalidRows.length > 0) {
    blockedBy.push("row-errors");
  }

  const duplicateRows = rows.filter((row) =>
    row.errors.some((error) => error.code === "DUPLICATE_IDENTIFIER"),
  ).length;

  return {
    header: {
      present: headerColumns.length > 0,
      columns: [...headerColumns],
    },
    fileIssues,
    rows,
    summary: {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicateRows,
    },
    decision: {
      policy: PROVISIONAL_INVALID_ROW_POLICY,
      acceptedForImport: blockedBy.length === 0,
      validRowNumbers: validRows.map((row) => row.rowNumber),
      invalidRowNumbers: invalidRows.map((row) => row.rowNumber),
      blockedBy,
    },
  };
}

type ValidationDecisionBlockers = Array<"file-errors" | "row-errors">;

/**
 * Parse and validate a CSV string against the fictional import schema.
 *
 * The function has no side effects and performs no network access. It returns
 * every parsed data row, including rows that fail validation, together with a
 * provisional import decision.
 */
export function validateCsv(csvText: string): ValidationResult {
  let records: string[][];

  try {
    records = parse(csvText, CSV_PARSE_OPTIONS) as string[][];
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Unknown CSV parsing error.";
    return buildResult(
      [],
      [
        makeIssue(
          "CSV_PARSE_ERROR",
          `The CSV could not be parsed: ${detail}`,
        ),
      ],
      [],
    );
  }

  const headerFields = records[0];

  if (headerFields === undefined) {
    return buildResult(
      [],
      [
        makeIssue(
          "MISSING_HEADER",
          "The CSV must contain a header row.",
        ),
      ],
      [],
    );
  }

  const headerColumns = [...headerFields];
  const fileIssues: ValidationIssue[] = [];
  const columnIndexes = new Map<string, number>();

  headerColumns.forEach((column, index) => {
    if (!columnIndexes.has(column)) {
      columnIndexes.set(column, index);
    }
  });

  for (const requiredColumn of REQUIRED_COLUMNS) {
    if (!columnIndexes.has(requiredColumn)) {
      fileIssues.push(
        makeIssue(
          "MISSING_COLUMN",
          `Required column "${requiredColumn}" is missing.`,
          null,
          requiredColumn,
        ),
      );
    }
  }

  const dataRecords = records.slice(1);
  const rows = dataRecords.map((fields, index) =>
    validateRow(
      fields,
      index + 2,
      headerColumns.length,
      columnIndexes,
    ),
  );

  return buildResult(headerColumns, fileIssues, rows);
}
