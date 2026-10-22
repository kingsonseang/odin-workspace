# CSV Import Validator — TypeScript Exercise Starter

An intentionally incomplete, offline TypeScript project for a recorded
CSV import-validation exercise. The validator checks synthetic records against a
fictional schema, reports row-specific issues, and returns every parsed row.
It does **not** import or persist anything.

> **Starter status:** the project installs, type-checks, and exercises its
> baseline behavior through tests, but it does not yet meet the full import
> contract. Completing the gaps is the exercise. Do not treat this validator as
> production-ready.

## Requirements

- Node.js `>=20.11.0` (developed and verified with Node.js 20.11.1)
- npm
- No credentials, services, live datasets, or network access are used at
  runtime or by the tests.

## Setup

```bash
npm install
```

## Commands

```bash
npm run typecheck   # TypeScript strict-mode check
npm test            # Node.js built-in test runner via tsx
npm run check       # typecheck + tests
```

`npm test` runs one deterministic suite:
`test/csv-validator.test.ts`.

## Project layout

```text
.
├── .gitignore
├── README.md
├── docs/
│   ├── import-contract.md
│   └── validation-report-template.md
├── fixtures/
│   ├── duplicate-identifiers.csv
│   ├── malformed-records.csv
│   ├── mixed-valid-invalid.csv
│   └── valid-records.csv
├── package.json
├── src/
│   ├── csv-validator.ts
│   ├── schema.ts
│   └── types.ts
├── test/
│   └── csv-validator.test.ts
└── tsconfig.json
```

## Usage

```ts
import { validateCsv } from "./src/csv-validator.js";

const result = validateCsv(csvText);

for (const row of result.rows) {
  if (row.status === "invalid") {
    console.log(row.rowNumber, row.errors);
  }
}

if (!result.decision.acceptedForImport) {
  console.log("Import blocked by:", result.decision.blockedBy);
}
```

`validateCsv` is pure: it takes a string and returns a report. It never writes
data. Invalid rows are returned alongside valid rows; none are silently dropped.

The target schemas, date grammar, number grammar, duplicate normalization, and
result rules are in [`docs/import-contract.md`](docs/import-contract.md).

## Baseline gaps

The starter implementation deliberately has the following shortcomings. The
skipped tests at the bottom of `test/csv-validator.test.ts` describe the target
behavior for several of them.

- Duplicate `record_id` values are not detected, including duplicates that
  differ only by surrounding whitespace.
- Required values are checked for raw emptiness only; whitespace-only values can
  pass for some fields.
- Dates are checked for the `YYYY-MM-DD` shape but not for real calendar
  validity (`2026-02-30` passes).
- Amounts use JavaScript `Number()` and do not enforce the exact decimal
  grammar, precision limit, or range (`1e3` and `12.345` pass).
- Field values are not normalized consistently before validation or in the
  normalized record.
- Unexpected columns and duplicate header names are not reported.
- Human-readable messages are inconsistent, although stable structured codes are
  available.
- The invalid-row policy in the result is provisional (`reject-file`) and has
  not been finalized in the documentation.

## Result shape

```ts
interface ValidationResult {
  header: { present: boolean; columns: string[] };
  fileIssues: ValidationIssue[];
  rows: RowResult[]; // valid or invalid; each row includes its raw fields
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
  };
  decision: {
    policy: "reject-file" | "import-valid-rows";
    acceptedForImport: boolean;
    validRowNumbers: number[];
    invalidRowNumbers: number[];
    blockedBy: ("file-errors" | "row-errors")[];
  };
}
```

Every issue includes a stable `code`, a message, and `rowNumber`, `column`, and
`value` when applicable. File-level issues use `rowNumber: null`.

Row numbers are 1-based CSV record numbers. The header is row 1, so the first
data record is row 2.

### Provisional invalid-row policy

The starter uses `reject-file`: if any file or row error exists,
`acceptedForImport` is `false`. All rows are still returned for inspection.

The exercise requires the engineer to choose and document the final policy:
either keep strict rejection or explicitly partition valid rows for import while
retaining invalid rows and errors. If the policy changes, update
`src/types.ts`, `src/csv-validator.ts`, this README, the import contract, the
report template, and the tests. The decision must never result in silently
accepting or discarding malformed data.

## Fixtures

All names, identifiers, dates, and amounts are synthetic.

| Fixture | Purpose |
| --- | --- |
| `valid-records.csv` | Three valid records, including a quoted name with a comma and a negative amount |
| `mixed-valid-invalid.csv` | Valid rows mixed with missing-name, malformed-date, and malformed-amount rows |
| `duplicate-identifiers.csv` | Repeated identifiers, including one with surrounding spaces |
| `malformed-records.csv` | Rows with too few and too many fields |

Additional header, empty-row, whitespace, and strict-format cases are written as
inline CSV strings in the test file so each edge is visible next to its
assertions.

## Tests

The active tests describe current baseline behavior. The `it.skip(...)` tests in
`describe("contract gaps to implement")` encode the remaining target behavior.
When a gap is fixed, remove `.skip` and keep it as a regression test.

Suggested workflow:

1. Add or update a fixture/test that demonstrates the desired behavior.
2. Implement the smallest change in `src/`.
3. Run `npm run check`.
4. Update the contract/report documentation for any policy or format change.

The report template is intentionally blank and is not a completed validation
report.

## Dependencies and licenses

| Dependency | Version | Use | License |
| --- | --- | --- | --- |
| [`csv-parse`](https://csv.js.org/parse/) | 7.0.3 | CSV parsing (runtime) | MIT |
| [`typescript`](https://www.typescriptlang.org/) | 5.9.3 | Type checking (development) | Apache-2.0 |
| [`tsx`](https://tsx.is/) | 4.23.15 | Run TypeScript tests (development) | MIT |
| [`@types/node`](https://www.npmjs.com/package/@types/node) | 20.19.43 | Node.js type definitions (development) | MIT |
| Node.js `node:test` | Built in to Node.js | Test runner | Node.js is MIT-licensed |

The project itself has no declared license; add one before redistribution.

## Safety and data notes

- Do not add real personal, customer, financial, or otherwise sensitive data to
  fixtures.
- Tests must remain deterministic and offline.
- Validation messages may include source field values. Treat validation reports
  with the same handling requirements as the source CSV.
