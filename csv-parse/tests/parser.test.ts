import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { CsvParseError, parseCsv } from "../src/parser.js";

function readFixture(fileName: string): string {
  return readFileSync(resolve("tests", "fixtures", fileName), "utf8");
}

test("parses unquoted rows and preserves empty fields", () => {
  const records = parseCsv(readFixture("valid-simple.csv"));

  assert.deepEqual(records, [
    {
      recordNumber: 1,
      fields: ["name", "email", "role", "notes"],
    },
    {
      recordNumber: 2,
      fields: ["Alan Turing", "alan@example.com", "admin", ""],
    },
    {
      recordNumber: 3,
      fields: ["Edsger Dijkstra", "edsger@example.com", "editor", "Graphs"],
    },
  ]);
});

// This test intentionally fails until the parser defect is fixed.
test("parses quoted commas, escaped quotes, empty values, and quoted newlines", () => {
  const records = parseCsv(readFixture("valid-quoted.csv"));

  assert.deepEqual(records, [
    {
      recordNumber: 1,
      fields: ["name", "email", "role", "notes"],
    },
    {
      recordNumber: 2,
      fields: [
        "Lovelace, Ada",
        "ada@example.com",
        "admin",
        "Pioneer, analyst",
      ],
    },
    {
      recordNumber: 3,
      fields: [
        'Grace "Amazing" Hopper',
        "grace@example.com",
        "editor",
        "",
      ],
    },
    {
      recordNumber: 4,
      fields: [
        "Katherine Johnson",
        "katherine@example.com",
        "viewer",
        "Line one\nLine two",
      ],
    },
    {
      recordNumber: 5,
      fields: [
        "Margaret Hamilton",
        "margaret@example.com",
        "admin",
        "Apollo, guidance",
      ],
    },
  ]);
});

// This test intentionally fails until the parser defect is fixed.
test("accepts a BOM and CRLF record separators while preserving quoted line endings", () => {
  const source =
    '\uFEFFname,email,role,notes\r\n' +
    '"Doe, Jane",jane@example.com,viewer,"First line\r\nSecond line"';

  assert.deepEqual(parseCsv(source), [
    {
      recordNumber: 1,
      fields: ["name", "email", "role", "notes"],
    },
    {
      recordNumber: 2,
      fields: [
        "Doe, Jane",
        "jane@example.com",
        "viewer",
        "First line\r\nSecond line",
      ],
    },
  ]);
});

// This test intentionally fails until the parser defect is fixed.
test("reports an unterminated quoted field at its logical record", () => {
  assert.throws(
    () => parseCsv(readFixture("malformed-unclosed-quote.csv")),
    (error: unknown): boolean =>
      error instanceof CsvParseError &&
      error.reason === "UNCLOSED_QUOTE" &&
      error.recordNumber === 3,
  );
});

// This test intentionally fails until the parser defect is fixed.
test("rejects a quote inside an unquoted field", () => {
  const source =
    "name,email,role,notes\n" +
    "Ada \"Ace\" Lovelace,ada@example.com,admin,";

  assert.throws(
    () => parseCsv(source),
    (error: unknown): boolean =>
      error instanceof CsvParseError &&
      error.reason === "UNEXPECTED_QUOTE" &&
      error.recordNumber === 2,
  );
});

// This test intentionally fails until the parser defect is fixed.
test("rejects characters between a closing quote and the next delimiter", () => {
  const source =
    "name,email,role,notes\n" + '"Ada"x,ada@example.com,admin,';

  assert.throws(
    () => parseCsv(source),
    (error: unknown): boolean =>
      error instanceof CsvParseError &&
      error.reason === "CHARACTER_AFTER_QUOTE" &&
      error.recordNumber === 2,
  );
});
