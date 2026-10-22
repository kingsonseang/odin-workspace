import type { CsvRecord } from "./parser.js";

export const EXPECTED_HEADERS = ["name", "email", "role", "notes"] as const;

export const ROLES = ["admin", "editor", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export interface ImportedRecord {
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly notes: string;
}

export type ImportErrorCode =
  | "MISSING_HEADER"
  | "HEADER_MISMATCH"
  | "COLUMN_COUNT"
  | "REQUIRED_FIELD"
  | "INVALID_EMAIL"
  | "INVALID_ROLE"
  | "PARSE_ERROR";

export interface ImportError {
  readonly code: ImportErrorCode;
  readonly recordNumber: number;
  readonly field?: string;
  readonly message: string;
}

export type ImportResult =
  | {
      readonly ok: true;
      readonly records: readonly ImportedRecord[];
      readonly errors: readonly [];
    }
  | {
      readonly ok: false;
      readonly records: readonly [];
      readonly errors: readonly ImportError[];
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

function hasExpectedHeader(fields: readonly string[]): boolean {
  return (
    fields.length === EXPECTED_HEADERS.length &&
    EXPECTED_HEADERS.every((header, index) => fields[index] === header)
  );
}

function failure(errors: readonly ImportError[]): ImportResult {
  return { ok: false, records: [], errors };
}

/**
 * Validates the header and every data record.
 *
 * The input includes the header as record 1. That record is consumed as the
 * header, while data records retain their original logical record numbers.
 * All data-row validation errors are collected. If any error is found, the
 * import is all-or-nothing and no records are returned.
 */
export function validateRecords(records: readonly CsvRecord[]): ImportResult {
  if (records.length === 0) {
    return failure([
      {
        code: "MISSING_HEADER",
        recordNumber: 1,
        message: "The CSV is empty; expected a header row.",
      },
    ]);
  }

  const header = records[0];

  if (header === undefined || !hasExpectedHeader(header.fields)) {
    const actual = header?.fields.join(",") ?? "";
    return failure([
      {
        code: "HEADER_MISMATCH",
        recordNumber: 1,
        message:
          `Expected header "${EXPECTED_HEADERS.join(",")}" in record 1, ` +
          `received "${actual}".`,
      },
    ]);
  }

  const errors: ImportError[] = [];
  const imported: ImportedRecord[] = [];

  for (const record of records.slice(1)) {
    if (record.fields.length !== EXPECTED_HEADERS.length) {
      errors.push({
        code: "COLUMN_COUNT",
        recordNumber: record.recordNumber,
        message:
          `Record ${record.recordNumber} has ${record.fields.length} field(s); ` +
          `expected ${EXPECTED_HEADERS.length}.`,
      });
      continue;
    }

    const name = record.fields[0] ?? "";
    const email = record.fields[1] ?? "";
    const role = record.fields[2] ?? "";
    const notes = record.fields[3] ?? "";
    let validatedRole: Role | undefined;
    let rowIsValid = true;

    if (name.length === 0) {
      rowIsValid = false;
      errors.push({
        code: "REQUIRED_FIELD",
        recordNumber: record.recordNumber,
        field: "name",
        message: `Record ${record.recordNumber}, field "name": value is required.`,
      });
    }

    if (email.length === 0) {
      rowIsValid = false;
      errors.push({
        code: "REQUIRED_FIELD",
        recordNumber: record.recordNumber,
        field: "email",
        message: `Record ${record.recordNumber}, field "email": value is required.`,
      });
    } else if (!EMAIL_PATTERN.test(email)) {
      rowIsValid = false;
      errors.push({
        code: "INVALID_EMAIL",
        recordNumber: record.recordNumber,
        field: "email",
        message:
          `Record ${record.recordNumber}, field "email": ` +
          `"${email}" is not a valid email address.`,
      });
    }

    if (role.length === 0) {
      rowIsValid = false;
      errors.push({
        code: "REQUIRED_FIELD",
        recordNumber: record.recordNumber,
        field: "role",
        message: `Record ${record.recordNumber}, field "role": value is required.`,
      });
    } else if (!isRole(role)) {
      rowIsValid = false;
      errors.push({
        code: "INVALID_ROLE",
        recordNumber: record.recordNumber,
        field: "role",
        message:
          `Record ${record.recordNumber}, field "role": ` +
          `"${role}" is not one of ${ROLES.join(", ")}.`,
      });
    } else {
      validatedRole = role;
    }

    if (rowIsValid && validatedRole !== undefined) {
      imported.push({ name, email, role: validatedRole, notes });
    }
  }

  if (errors.length > 0) {
    return failure(errors);
  }

  return { ok: true, records: imported, errors: [] };
}
