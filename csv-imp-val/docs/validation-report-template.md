# Validation Report — CSV Import Exercise

> **Template only.** Replace every placeholder with evidence from an actual run.
> Do not publish this file with invented counts, invented errors, or an invented
> policy decision.

## 1. Run identification

| Field | Value |
| --- | --- |
| Report prepared by | `<name or handle>` |
| Date/time (UTC) | `<YYYY-MM-DDTHH:mm:ssZ>` |
| Repository revision | `<commit or archive identifier>` |
| Validator entry point | `src/csv-validator.ts` |
| Source file label | `<synthetic file label>` |
| Source SHA-256 | `<hash>` |
| Node.js version | `<version>` |
| Command used | `<e.g. npm run check and/or validation invocation>` |

## 2. Selected invalid-row policy

Current code policy: `<reject-file | import-valid-rows>`

Final policy decision: `<record the chosen policy and rationale>`

- [ ] The policy is documented in `README.md`.
- [ ] The policy is documented in `docs/import-contract.md`.
- [ ] Code and tests implement the documented policy.
- [ ] Invalid rows remain available in the report under the chosen policy.
- [ ] No invalid data is silently accepted, skipped, or discarded.

## 3. Result summary

| Metric | Count |
| --- | ---: |
| Parsed data rows | `<count>` |
| Valid rows | `<count>` |
| Invalid rows | `<count>` |
| Rows with duplicate identifiers | `<count>` |
| File-level issues | `<count>` |
| Import accepted? | `<yes | no>` |

Blocked by: `<none | file-errors | row-errors | both>`

## 4. File-level issues

| # | Code | Column | Message |
| ---: | --- | --- | --- |
| `<n>` | `<code>` | `<column or —>` | `<verbatim message>` |

If there are none, write “None observed” rather than leaving the table ambiguous.

## 5. Row-level issues

| Row | Identifier (if available) | Column | Code | Observed value | Message |
| ---: | --- | --- | --- | --- | --- |
| `<n>` | `<synthetic id>` | `<column>` | `<code>` | `<raw/repr value>` | `<verbatim message>` |

- Total rows with at least one issue: `<count>`
- Rows with multiple issues: `<count>`
- Empty rows: `<count>`
- Malformed rows: `<count>`

## 6. Duplicate review

Document the normalization used: `<e.g. trim surrounding ASCII spaces/tabs; compare case-sensitively>`.

| First row | Duplicate row | Trimmed identifier | Result |
| ---: | ---: | --- | --- |
| `<n>` | `<n>` | `<synthetic id>` | `<kept / rejected>` |

## 7. Row-number verification

| Check | Evidence |
| --- | --- |
| Header is row 1 | `<test name or observed detail>` |
| First data row is row 2 | `<test name or observed detail>` |
| First reported invalid row | `<row number and test name>` |
| Row numbering remains stable with empty/malformed rows | `<test name or observed detail>` |

## 8. Verification evidence

Paste or link only real command output.

```text
$ npm run typecheck
<actual output>

$ npm test
<actual output>

$ npm run check
<actual output>
```

Additional manual verification (if any):

```text
<command and actual output>
```

## 9. Acceptance criteria review

| Criterion | Result | Evidence |
| --- | --- | --- |
| Missing required columns are reported | `<met / not met / partial>` | `<test or report reference>` |
| Missing and whitespace-only required values are rejected | `<...>` | `<...>` |
| Malformed dates are rejected exactly per contract | `<...>` | `<...>` |
| Malformed numeric values are rejected exactly per contract | `<...>` | `<...>` |
| Duplicate identifiers are detected after documented trimming | `<...>` | `<...>` |
| Empty rows are reported and preserved | `<...>` | `<...>` |
| Unexpected columns are reported as specified | `<...>` | `<...>` |
| Header-aware row numbers are correct | `<...>` | `<...>` |
| Invalid rows remain inspectable | `<...>` | `<...>` |
| Final invalid-row policy is explicit and implemented | `<...>` | `<...>` |
| Tests are deterministic, offline, and use synthetic data | `<...>` | `<...>` |

## 10. Residual risks and follow-up

- `<risk or follow-up>`
- `<risk or follow-up>`

## 11. Sign-off

| Role | Name/handle | Decision | Date |
| --- | --- | --- | --- |
| Implementer / reviewer | `<name>` | `<approved / changes requested>` | `<YYYY-MM-DD>` |
