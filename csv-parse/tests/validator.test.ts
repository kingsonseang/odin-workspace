import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { parseCsv } from "../src/parser.js";
import { EXPECTED_HEADERS, validateRecords } from "../src/validator.js";

function readFixture(fileName: string): string {
  return readFileSync(resolve("tests", "fixtures", fileName), "utf8");
}

test("validates the exact header and maps fields without coercion", () => {
  const result = validateRecords(parseCsv(readFixture("valid-simple.csv")));

  if (!result.ok) {
    assert.fail(JSON.stringify(result.errors));
  }

  assert.deepEqual(result.records, [
    {
      name: "Alan Turing",
      email: "alan@example.com",
      role: "admin",
      notes: "",
    },
    {
      name: "Edsger Dijkstra",
      email: "edsger@example.com",
      role: "editor",
      notes: "Graphs",
    },
  ]);
  assert.deepEqual(result.errors, []);
});

test("rejects a wrong header at record 1", () => {
  const result = validateRecords(parseCsv(readFixture("invalid-header.csv")));

  if (result.ok) {
    assert.fail("Expected the header to be rejected.");
  }

  assert.deepEqual(result.records, []);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(
    {
      code: result.errors[0]?.code,
      recordNumber: result.errors[0]?.recordNumber,
    },
    {
      code: "HEADER_MISMATCH",
      recordNumber: 1,
    },
  );
});

test("reports missing headers at record 1", () => {
  const result = validateRecords([]);

  if (result.ok) {
    assert.fail("Expected an empty file to be rejected.");
  }

  assert.deepEqual(result.records, []);
  assert.equal(result.errors.length, 1);
  assert.deepEqual(
    {
      code: result.errors[0]?.code,
      recordNumber: result.errors[0]?.recordNumber,
    },
    {
      code: "MISSING_HEADER",
      recordNumber: 1,
    },
  );
});

test("reports every schema violation using header-inclusive record numbers", () => {
  const result = validateRecords(parseCsv(readFixture("invalid-fields.csv")));

  if (result.ok) {
    assert.fail("Expected invalid fields to be rejected.");
  }

  assert.deepEqual(result.records, []);
  assert.deepEqual(
    result.errors.map(({ code, recordNumber, field }) => ({
      code,
      recordNumber,
      field,
    })),
    [
      { code: "REQUIRED_FIELD", recordNumber: 3, field: "name" },
      { code: "INVALID_EMAIL", recordNumber: 4, field: "email" },
      { code: "INVALID_ROLE", recordNumber: 4, field: "role" },
    ],
  );
});

test("reports every short and long record without dropping either one", () => {
  const result = validateRecords(
    parseCsv(readFixture("invalid-column-count.csv")),
  );

  if (result.ok) {
    assert.fail("Expected invalid column counts to be rejected.");
  }

  assert.deepEqual(result.records, []);
  assert.deepEqual(
    result.errors.map(({ code, recordNumber }) => ({ code, recordNumber })),
    [
      { code: "COLUMN_COUNT", recordNumber: 2 },
      { code: "COLUMN_COUNT", recordNumber: 3 },
    ],
  );
});

test("accepts a header with no data records", () => {
  const result = validateRecords([
    {
      recordNumber: 1,
      fields: [...EXPECTED_HEADERS],
    },
  ]);

  assert.equal(result.ok, true);

  if (result.ok) {
    assert.deepEqual(result.records, []);
    assert.deepEqual(result.errors, []);
  }
});
