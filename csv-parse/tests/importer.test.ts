import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { importCsv } from "../src/importer.js";

function readFixture(fileName: string): string {
  return readFileSync(resolve("tests", "fixtures", fileName), "utf8");
}

test("imports existing unquoted input in source order", () => {
  const result = importCsv(readFixture("valid-simple.csv"));

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

// This test intentionally fails until the parser defect is fixed.
test("imports quoted values without altering commas, quotes, or newlines", () => {
  const result = importCsv(readFixture("valid-quoted.csv"));

  if (!result.ok) {
    assert.fail(JSON.stringify(result.errors));
  }

  assert.deepEqual(result.records, [
    {
      name: "Lovelace, Ada",
      email: "ada@example.com",
      role: "admin",
      notes: "Pioneer, analyst",
    },
    {
      name: 'Grace "Amazing" Hopper',
      email: "grace@example.com",
      role: "editor",
      notes: "",
    },
    {
      name: "Katherine Johnson",
      email: "katherine@example.com",
      role: "viewer",
      notes: "Line one\nLine two",
    },
    {
      name: "Margaret Hamilton",
      email: "margaret@example.com",
      role: "admin",
      notes: "Apollo, guidance",
    },
  ]);
  assert.deepEqual(result.errors, []);
});

test("returns every schema error and no partial import", () => {
  const result = importCsv(readFixture("invalid-fields.csv"));

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

// This test intentionally fails until the parser defect is fixed.
test("reports malformed quoting and does not return earlier valid records", () => {
  const result = importCsv(readFixture("malformed-unclosed-quote.csv"));

  if (result.ok) {
    assert.fail("Expected malformed quoting to be rejected.");
  }

  assert.deepEqual(result.records, []);
  assert.deepEqual(
    result.errors.map(({ code, recordNumber }) => ({ code, recordNumber })),
    [{ code: "PARSE_ERROR", recordNumber: 3 }],
  );
});

test("reports invalid column counts without importing valid-looking rows", () => {
  const result = importCsv(readFixture("invalid-column-count.csv"));

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
