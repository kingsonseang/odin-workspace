import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateCsv } from "../src/csv-validator.js";
import type {
  InvalidRowResult,
  RowResult,
  ValidationIssue,
  ValidationResult,
  ValidRowResult,
} from "../src/types.js";

function readFixture(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
}

function rowAt(result: ValidationResult, rowNumber: number): RowResult {
  const row = result.rows.find(
    (candidate) => candidate.rowNumber === rowNumber,
  );
  assert.ok(row, `Expected row ${rowNumber} in the validation result.`);
  return row;
}

function validRowAt(
  result: ValidationResult,
  rowNumber: number,
): ValidRowResult {
  const row = rowAt(result, rowNumber);
  assert.equal(row.status, "valid", `Expected row ${rowNumber} to be valid.`);
  if (row.status !== "valid") {
    throw new Error(`Expected row ${rowNumber} to be valid.`);
  }
  return row;
}

function invalidRowAt(
  result: ValidationResult,
  rowNumber: number,
): InvalidRowResult {
  const row = rowAt(result, rowNumber);
  assert.equal(
    row.status,
    "invalid",
    `Expected row ${rowNumber} to be invalid.`,
  );
  if (row.status !== "invalid") {
    throw new Error(`Expected row ${rowNumber} to be invalid.`);
  }
  return row;
}

function issueCodes(issues: ValidationIssue[]): string[] {
  return issues.map((issue) => issue.code);
}

describe("baseline behavior", () => {
  it("validates the all-valid fixture and reports data row numbers", () => {
    const result = validateCsv(readFixture("valid-records.csv"));

    assert.equal(result.header.present, true);
    assert.deepEqual(result.header.columns, [
      "record_id",
      "display_name",
      "start_date",
      "amount",
    ]);
    assert.equal(result.fileIssues.length, 0);
    assert.equal(result.rows.length, 3);
    assert.deepEqual(result.summary, {
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      duplicateRows: 0,
    });
    assert.deepEqual(result.decision.validRowNumbers, [2, 3, 4]);
    assert.deepEqual(result.decision.invalidRowNumbers, []);
    assert.deepEqual(result.decision.blockedBy, []);
    assert.equal(result.decision.acceptedForImport, true);
    assert.equal(result.decision.policy, "reject-file");

    const first = validRowAt(result, 2);
    assert.deepEqual(first.record, {
      recordId: "SYN-1001",
      displayName: "Aurora Field Kit, Mk II",
      startDate: "2026-04-01",
      amount: 1250,
    });
    assert.deepEqual(first.raw.fields, [
      "SYN-1001",
      "Aurora Field Kit, Mk II",
      "2026-04-01",
      "1250.00",
    ]);
  });

  it("returns row-specific structured errors and keeps invalid rows", () => {
    const result = validateCsv(readFixture("mixed-valid-invalid.csv"));

    assert.equal(result.fileIssues.length, 0);
    assert.equal(result.rows.length, 5);
    assert.deepEqual(result.summary, {
      totalRows: 5,
      validRows: 2,
      invalidRows: 3,
      duplicateRows: 0,
    });
    assert.deepEqual(result.decision.validRowNumbers, [2, 6]);
    assert.deepEqual(result.decision.invalidRowNumbers, [3, 4, 5]);
    assert.deepEqual(result.decision.blockedBy, ["row-errors"]);
    assert.equal(result.decision.acceptedForImport, false);

    const missingNameRow = invalidRowAt(result, 3);
    const missingNameIssue = missingNameRow.errors.find(
      (issue) => issue.code === "MISSING_REQUIRED_VALUE",
    );
    assert.ok(missingNameIssue);
    assert.deepEqual(
      {
        code: missingNameIssue.code,
        rowNumber: missingNameIssue.rowNumber,
        column: missingNameIssue.column,
        value: missingNameIssue.value,
      },
      {
        code: "MISSING_REQUIRED_VALUE",
        rowNumber: 3,
        column: "display_name",
        value: "",
      },
    );

    assert.deepEqual(issueCodes(invalidRowAt(result, 4).errors), [
      "INVALID_DATE",
    ]);
    assert.deepEqual(issueCodes(invalidRowAt(result, 5).errors), [
      "INVALID_AMOUNT",
    ]);
    assert.deepEqual(invalidRowAt(result, 5).raw.fields, [
      "SYN-2004",
      "Fjord Atlas",
      "2026-06-04",
      "not-a-number",
    ]);
  });

  it("reports a missing required column without dropping data rows", () => {
    const csv = [
      "record_id,display_name,amount",
      "SYN-6001,Missing Date,10.00",
    ].join("\n");

    const result = validateCsv(csv);

    assert.deepEqual(issueCodes(result.fileIssues), ["MISSING_COLUMN"]);
    assert.equal(result.fileIssues[0]?.column, "start_date");
    assert.equal(result.rows.length, 1);
    assert.equal(result.decision.acceptedForImport, false);
    assert.deepEqual(result.decision.blockedBy, ["file-errors", "row-errors"]);

    const row = invalidRowAt(result, 2);
    assert.equal(row.raw.rowNumber, 2);
    assert.deepEqual(row.raw.fields, ["SYN-6001", "Missing Date", "10.00"]);
    assert.deepEqual(issueCodes(row.errors), ["MISSING_REQUIRED_VALUE"]);
  });

  it("reports empty rows and retains their original fields", () => {
    const csv = [
      "record_id,display_name,start_date,amount",
      "SYN-7001,First Light,2026-09-01,10.00",
      "",
      "SYN-7002,Second Light,2026-09-02,20.00",
    ].join("\n");

    const result = validateCsv(csv);

    assert.equal(result.rows.length, 3);
    assert.deepEqual(result.summary, {
      totalRows: 3,
      validRows: 2,
      invalidRows: 1,
      duplicateRows: 0,
    });
    assert.equal(result.decision.acceptedForImport, false);

    const emptyRow = invalidRowAt(result, 3);
    assert.deepEqual(issueCodes(emptyRow.errors), ["EMPTY_ROW"]);
    assert.deepEqual(emptyRow.raw.fields, [""]);
    assert.equal(result.decision.invalidRowNumbers[0], 3);
  });

  it("reports malformed field counts with the correct row numbers", () => {
    const result = validateCsv(readFixture("malformed-records.csv"));

    assert.equal(result.fileIssues.length, 0);
    assert.equal(result.rows.length, 4);
    assert.deepEqual(result.summary, {
      totalRows: 4,
      validRows: 2,
      invalidRows: 2,
      duplicateRows: 0,
    });
    assert.deepEqual(result.decision.invalidRowNumbers, [3, 4]);
    assert.equal(result.decision.acceptedForImport, false);

    const tooFew = invalidRowAt(result, 3);
    assert.deepEqual(issueCodes(tooFew.errors), ["MALFORMED_ROW"]);
    assert.equal(tooFew.raw.fields.length, 3);

    const tooMany = invalidRowAt(result, 4);
    assert.deepEqual(issueCodes(tooMany.errors), ["MALFORMED_ROW"]);
    assert.equal(tooMany.raw.fields.length, 5);
    assert.equal(tooMany.raw.fields[4], "unexpected-extra-field");
  });

  it("retains duplicate fixture rows even before duplicate checks exist", () => {
    const result = validateCsv(readFixture("duplicate-identifiers.csv"));

    assert.equal(result.rows.length, 3);
    assert.equal(result.summary.totalRows, 3);
    assert.deepEqual(rowAt(result, 2).raw.fields, [
      "SYN-3001",
      "Iris Junction",
      "2026-07-01",
      "101.00",
    ]);
    assert.deepEqual(rowAt(result, 3).raw.fields, [
      "SYN-3001",
      "Iris Junction Copy",
      "2026-07-02",
      "102.00",
    ]);
    assert.deepEqual(rowAt(result, 4).raw.fields, [
      " SYN-3001 ",
      "Spaced Iris",
      "2026-07-03",
      "103.00",
    ]);
  });
});

describe("contract gaps to implement", () => {
  it.skip("rejects duplicate identifiers after trimming", () => {
    const result = validateCsv(readFixture("duplicate-identifiers.csv"));

    assert.equal(validRowAt(result, 2).status, "valid");
    assert.deepEqual(issueCodes(invalidRowAt(result, 3).errors), [
      "DUPLICATE_IDENTIFIER",
    ]);
    assert.deepEqual(issueCodes(invalidRowAt(result, 4).errors), [
      "DUPLICATE_IDENTIFIER",
    ]);
    assert.equal(result.summary.duplicateRows, 2);
    assert.equal(result.decision.acceptedForImport, false);
  });

  it.skip("rejects whitespace-only required values", () => {
    const csv = [
      "record_id,display_name,start_date,amount",
      "SYN-7101,   ,2026-09-01,10.00",
    ].join("\n");

    const result = validateCsv(csv);
    const row = invalidRowAt(result, 2);

    assert.deepEqual(issueCodes(row.errors), ["MISSING_REQUIRED_VALUE"]);
    assert.equal(row.errors[0]?.column, "display_name");
  });

  it.skip("rejects impossible calendar dates", () => {
    const csv = [
      "record_id,display_name,start_date,amount",
      "SYN-7102,Calendar Trap,2026-02-30,10.00",
    ].join("\n");

    const result = validateCsv(csv);
    const row = invalidRowAt(result, 2);

    assert.deepEqual(issueCodes(row.errors), ["INVALID_DATE"]);
  });

  it.skip("enforces the exact amount grammar and range", () => {
    const csv = [
      "record_id,display_name,start_date,amount",
      "SYN-7201,Exponent Form,2026-09-01,1e3",
      "SYN-7202,Too Precise,2026-09-02,12.345",
      "SYN-7203,Out Of Range,2026-09-03,1000000.01",
    ].join("\n");

    const result = validateCsv(csv);

    for (const rowNumber of [2, 3, 4]) {
      assert.deepEqual(issueCodes(invalidRowAt(result, rowNumber).errors), [
        "INVALID_AMOUNT",
      ]);
    }
  });

  it.skip("reports unexpected header columns as a file-level error", () => {
    const csv = [
      "record_id,display_name,start_date,amount,notes",
      "SYN-7301,Extra Column,2026-09-01,10.00,synthetic-note",
    ].join("\n");

    const result = validateCsv(csv);

    assert.deepEqual(issueCodes(result.fileIssues), ["UNEXPECTED_COLUMN"]);
    assert.equal(result.decision.acceptedForImport, false);
  });
});
