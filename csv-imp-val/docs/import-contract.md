# Import Contract — Synthetic Records

**Status:** target contract for the exercise. The starter validator does not yet
implement every rule. See “Baseline gaps” in the README and the skipped tests in
`test/csv-validator.test.ts`.

This document defines the accepted CSV format, normalization rules, validation
errors, and result semantics. All example values are fictional.

## File format

- UTF-8 text with an optional UTF-8 BOM.
- Comma-separated values following RFC 4180 quoting conventions.
- LF or CRLF line endings; a final trailing newline is optional.
- Exactly one header row followed by zero or more data rows.
- Quoted fields may contain commas, escaped quotes, or line breaks.
- No external files, live data, or network lookups.

### Row numbering

Row numbers are 1-based **CSV record numbers**, not 0-based indexes:

- Header: row `1`
- First data record: row `2`
- Second data record: row `3`

A quoted field containing a line break remains part of one CSV record. Therefore
reported row numbers follow parsed records, not physical source-file lines.

## Columns

Header names are case-sensitive and must appear exactly as shown.

| Header | Type | Required | Rules |
| --- | --- | --- | --- |
| `record_id` | string | yes | Non-empty after trimming; unique within the file after trimming; case-sensitive |
| `display_name` | string | yes | Non-empty after trimming; internal whitespace is preserved |
| `start_date` | date | yes | Exact `YYYY-MM-DD`, real Gregorian date |
| `amount` | decimal | yes | Exact decimal grammar and range below |

Header rules:

- Column order is flexible.
- Each required header must appear exactly once.
- Any header outside the four listed above is unexpected.
- Missing, duplicate, or unexpected headers are **file-level errors**.
- A file with a file-level error must not be accepted for import.

## Normalization

Before validation and before producing a normalized record:

1. Trim leading and trailing ASCII space (`U+0020`) and tab (`U+0009`) characters
   from each data field.
2. Do not collapse internal spaces.
3. Do not change letter case.
4. Do not apply Unicode normalization or locale-specific transformations.
5. An empty value and a whitespace-only value are both missing.

Quoted syntax belongs to CSV parsing, not to the stored value. For example,
`"  Aurora  "` normalizes to `Aurora`.

Header names are **not** trimmed or case-folded.

## Required values

For all four fields, a value is missing when it is empty or contains only
trimmed ASCII whitespace.

- Missing values produce `MISSING_REQUIRED_VALUE` for the affected column.
- A row may have more than one validation issue.
- Invalid rows are still returned with their original, untrimmed fields.

## Accepted date format

`start_date` must match exactly:

```regex
^\d{4}-\d{2}-\d{2}$
```

and must also represent a real Gregorian calendar date from **2000-01-01 through
2099-12-31**, inclusive.

Accepted examples:

```text
2026-04-01
2024-02-29
2000-01-01
2099-12-31
```

Rejected examples:

```text
2026-2-1          # month and day must be two digits
04/01/2026        # wrong separator/order
2026-02-30        # impossible calendar date
2025-02-29        # not a leap year
2026-13-01        # invalid month
2026-04-01T00:00  # timestamps are not accepted
```

Leading/trailing whitespace is removed before the format check. Do not use
locale-dependent date parsing.

## Accepted numeric format

`amount` must match exactly:

```regex
^-?\d+(?:\.\d{1,2})?$
```

and evaluate to a value in the inclusive range:

```text
-1000000.00 .. 1000000.00
```

This means:

- Optional leading minus sign; a leading plus sign is not accepted.
- At least one digit before an optional decimal point.
- At most two digits after the decimal point.
- Leading zeros are accepted (for example, `0007.50`).
- A decimal point with no following digits is not accepted.
- Decimal fractions shorter than two digits are accepted (`9.5`).
- Surrounding ASCII spaces/tabs are trimmed before parsing.
- No thousands separators, currency symbols, exponents, `NaN`, `Infinity`, or
  hexadecimal notation.

Accepted examples:

```text
0
12
12.3
12.34
-0.50
0007.50
1000000
-1000000.00
```

Rejected examples:

```text
+12.00
12.
.50
1e3
1,000.00
$12.00
12.345
1000000.01
-1000000.01
```

The normalized record stores `amount` as a JavaScript `number`. The exact source
text remains available in the row's raw fields.

## Identifier uniqueness

- Trim the `record_id` value before comparing identifiers.
- Comparison is case-sensitive: `SYN-3001` and `syn-3001` are distinct.
- The first occurrence of a trimmed identifier is canonical and may remain valid
  if its other fields pass.
- Every later occurrence produces `DUPLICATE_IDENTIFIER` for `record_id`.
- Duplicate checking applies to identifiers even if another field makes the row
  invalid.
- Duplicates that differ only by surrounding whitespace must be detected. For
  example, these three values are the same identifier:
  - `SYN-3001`
  - `SYN-3001 `
  - ` SYN-3001`

The normalized `recordId` is the trimmed identifier.

## Row-level errors

| Code | Meaning |
| --- | --- |
| `EMPTY_ROW` | Every parsed field in the row is empty or whitespace-only |
| `MALFORMED_ROW` | Parsed field count differs from the header column count |
| `MISSING_REQUIRED_VALUE` | A required normalized value is missing |
| `INVALID_DATE` | The date does not meet the exact accepted format/calendar rules |
| `INVALID_AMOUNT` | The amount does not meet the exact grammar/range rules |
| `DUPLICATE_IDENTIFIER` | A trimmed identifier was already used by an earlier row |

Empty rows and malformed rows are reported, not skipped. Their raw fields must
remain available in the result.

A malformed field count row is invalid even if the fields that happen to be
present look valid.

## File-level errors

| Code | Meaning |
| --- | --- |
| `MISSING_HEADER` | No header record could be parsed |
| `MISSING_COLUMN` | A required header is absent |
| `UNEXPECTED_COLUMN` | A header is outside the contract |
| `DUPLICATE_COLUMN` | The same header appears more than once |
| `CSV_PARSE_ERROR` | The CSV text cannot be parsed |

File-level issues have `rowNumber: null`. Parsed data rows should still be
returned when possible.

## Result contract

```ts
type RowResult =
  | {
      status: "valid";
      rowNumber: number;
      raw: {
        rowNumber: number;
        fields: string[];
        byColumn: Record<string, string>;
      };
      record: {
        recordId: string;
        displayName: string;
        startDate: string;
        amount: number;
      };
      errors: [];
    }
  | {
      status: "invalid";
      rowNumber: number;
      raw: {
        rowNumber: number;
        fields: string[];
        byColumn: Record<string, string>;
      };
      record: null;
      errors: ValidationIssue[];
    };
```

`ValidationIssue` contains:

```ts
{
  code: ValidationIssueCode;
  message: string;
  rowNumber: number | null;
  column: string | null;
  value: string | null; // original source value when applicable
}
```

The result also includes:

- `header`: whether a header was present and its raw column names.
- `fileIssues`: file-level structured issues.
- `summary`: total, valid, invalid, and duplicate-row counts.
- `decision`: the selected invalid-row policy, the acceptance result, lists of
  valid/invalid row numbers, and whether file or row errors blocked import.

Callers must be able to:

1. Find all valid rows.
2. Find all invalid rows with their row numbers and raw data.
3. Inspect every structured validation error.
4. Tell whether the report permits import.
5. Tell which invalid-row policy the validator is applying.

## Invalid-row policy

**Starter/provisional behavior:** `reject-file`.

- `acceptedForImport` is `true` only when there are no file-level issues and no
  invalid data rows.
- Invalid rows are still returned; they are not silently discarded.
- The validator itself never imports or writes data.

**Exercise decision required:** the engineer must choose, implement, and
document the final policy. Valid options are:

1. **`reject-file`** — any problem blocks the entire import while all rows and
   issues remain inspectable.
2. **`import-valid-rows`** — only valid rows are eligible for a downstream
   import; every invalid row remains in the report with its errors and is never
   silently ignored.

The final decision must be consistent in code, tests, this contract, the README,
and the completed validation report. Do not silently accept, skip, or drop
invalid rows under either policy.

## Privacy and determinism

- Fixtures and tests must use fictional data only.
- Tests must not make network calls or depend on the local timezone.
- No credentials or external services belong in this project.
