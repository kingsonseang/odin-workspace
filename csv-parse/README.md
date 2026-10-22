# Strict CSV Import Starter

A small strict TypeScript CSV import project using npm, a hand-written CSV
parser, and Node's built-in test runner. It validates imported records against a
fixed schema and returns structured, record-numbered errors.

> **Status: the starter parser is intentionally defective.** The test suite is
> expected to fail until the defect in `src/parser.ts` is fixed. The defect and
> acceptance criteria are documented below. Tests, fixtures, the schema, and the
> record-numbering convention are intended to remain unchanged.

## Requirements

- Node.js 20.11 or newer (developed with Node 20.11.1)
- npm

## Setup

```bash
npm install
npm run typecheck
npm run build
npm test
```

At the initial commit, `npm test` builds successfully but reports **10 passing
and 7 failing tests**. The failures are the quoted-field and malformed-input
tests. That failure is the reproducible defect, not a setup problem. The
simple, unquoted import tests pass.

Run the importer against a CSV file:

```bash
npm run import -- tests/fixtures/valid-quoted.csv
```

The command prints the full import result as JSON. It exits `0` for a
successful import, `1` for a rejected import, and `2` for a usage or read error.
The `import` script compiles the project before running the CLI.

## Project layout

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── parser.ts       # Intentionally defective line/comma splitter
│   ├── validator.ts    # Header and schema validation; error types
│   ├── importer.ts     # Parse + validate with all-or-nothing behavior
│   └── cli.ts          # Small JSON CLI
└── tests/
    ├── parser.test.ts
    ├── validator.test.ts
    ├── importer.test.ts
    └── fixtures/
        ├── valid-simple.csv
        ├── valid-quoted.csv
        ├── invalid-fields.csv
        ├── invalid-column-count.csv
        ├── invalid-header.csv
        └── malformed-unclosed-quote.csv
```

## CSV contract

### Header

The first logical CSV record must be exactly this header, in this order and with
case-sensitive names:

```csv
name,email,role,notes
```

A missing or different header is a validation error at record 1. Data fields are
mapped to the schema by position. A header-only file is a valid empty import.

### CSV syntax

- Comma is the delimiter.
- Double quote is the quote character.
- A quoted field may contain commas, escaped quotes (`""`), and record
  separators.
- Bare fields may not contain quotes.
- After a closing quote, the next character must be a comma, a record separator,
  or end of input.
- LF, CRLF, and CR are accepted as record separators. Record separators inside
  quoted fields are preserved exactly as supplied.
- A single trailing record terminator does not create an empty record.
- An optional UTF-8 BOM at the beginning of the source is ignored.
- No values are trimmed, case-normalized, or otherwise coerced. Whitespace is
  significant.

### Schema

The record shape is fixed. A parser fix must not change these fields or the
expected header.

| Field | Validation |
| --- | --- |
| `name` | Required; must not be an empty string |
| `email` | Required; basic `local@domain.tld` syntax |
| `role` | Required; exactly `admin`, `editor`, or `viewer` |
| `notes` | May be empty; otherwise accepted as-is |

Both a bare empty field and a quoted empty field (`""`) parse to the same empty
string. Only `notes` permits an empty value. Empty required fields produce
`REQUIRED_FIELD` errors; malformed non-empty emails and roles produce
`INVALID_EMAIL` and `INVALID_ROLE`.

### Ordering and duplicates

Imported records retain source order. No sorting, deduplication, or dropping of
valid records occurs. If the import succeeds, every data record is returned.

### Record numbering

Record numbers are 1-based **logical CSV records and include the header**:

- Header row: record 1
- First data row: record 2
- A data record spanning multiple physical lines because of a quoted newline is
  still one logical record.
- Physical line numbers are not used for error locations.

Every error has this shape:

```json
{
  "code": "INVALID_EMAIL",
  "recordNumber": 4,
  "field": "email",
  "message": "Record 4, field \"email\": \"not-an-email\" is not a valid email address."
}
```

`field` is present for field-specific validation errors. Header errors point to
record 1; missing headers also use record 1.

### Result and error behavior

The importer is all-or-nothing. If parsing or validation produces any error,
`records` is empty and `errors` is returned. A malformed CSV record is never
silently ignored and valid rows are never partially imported around it.

```ts
type ImportResult =
  | { ok: true; records: ImportedRecord[]; errors: [] }
  | { ok: false; records: []; errors: ImportError[] };
```

- Syntax errors stop at the first malformed record. The returned error has code
  `PARSE_ERROR` and the record where the malformed field starts.
- Semantic validation checks all data records and reports every violation it
  finds. If a row has the wrong number of columns, it receives `COLUMN_COUNT`
  and is not schema-validated further.
- A header mismatch reports one `HEADER_MISMATCH` error at record 1 without
  validating the body.

Error codes:

| Code | Meaning |
| --- | --- |
| `PARSE_ERROR` | Malformed CSV quoting syntax |
| `MISSING_HEADER` | Empty input |
| `HEADER_MISMATCH` | Header missing, reordered, or different |
| `COLUMN_COUNT` | Data row does not have four fields |
| `REQUIRED_FIELD` | A required field is empty |
| `INVALID_EMAIL` | Email syntax check failed |
| `INVALID_ROLE` | Role is not an allowed value |

Malformed quoting includes an unterminated quoted field, a quote inside an
unquoted field, and non-delimiter characters after a closing quote.

## The intentional defect

`src/parser.ts` currently converts the source to physical lines, splits each
line on commas, and leaves quote characters in the resulting values. It does not
implement a quote state, so it cannot handle quoted commas, escaped quotes, or
quoted newlines, and it cannot detect malformed quoting.

Reproduction:

```bash
npm test
```

The failing tests include:

- exact parsing of quoted commas, escaped quotes, empty values, and a quoted
  newline
- logical record numbering after a multiline record
- BOM/CRLF handling with a quoted line ending
- malformed quoting detection and record location
- end-to-end import of the quoted fixture
- rejection of malformed input without returning earlier valid rows

Tests for unquoted input, schema validation, headers, column counts, ordering,
and empty fields should continue to pass before and after the fix.

## Fix requirements

Fix the CSV parser without changing the intended schema or weakening the
acceptance tests:

- Parse quoted fields correctly, including escaped quotes, commas, and newlines.
- Preserve field values exactly, including internal quotes, commas, and line
  endings.
- Detect malformed quoting and report the correct logical record.
- Keep header-inclusive, 1-based logical record numbering.
- Preserve all existing valid-input behavior.
- Keep imports all-or-nothing; do not silently skip malformed records.
- Do not change `EXPECTED_HEADERS`, the schema in `src/validator.ts`, the
  fixtures, or expected test values to make the suite pass.

When the defect is fixed, `npm test` should pass without modifying the tests,
and `npm run import -- tests/fixtures/valid-quoted.csv` should return the exact
values shown in the fixtures.

## Test runner

Tests use `node:test` and `node:assert/strict`. `npm test` runs `tsc` and then
executes the compiled tests from `dist/tests/`. No other test framework or
runtime dependency is required.
