# Task inputs — regression test plan

This folder contains the starting materials for the exercise **“Build a regression test plan from defect reports.”** The application under test is Tasklane, the synthetic React + TypeScript task board in the repository root.

The inputs describe expected behavior and six observations to investigate. They deliberately do **not** contain root causes, severity rankings, fixes, regression test code, or completed investigation records. Those are the engineer’s work during the task.

All people, tasks, dates, and project details are synthetic. Do not introduce real personal data.

## Defect set

| Defect ID | Summary | Type of observation |
| --- | --- | --- |
| BUG-1042 | Title of exactly 80 characters is rejected | Validation boundary |
| BUG-1047 | Status and priority filters return too many tasks | Filtering |
| BUG-1051 | Tasks without due dates appear first in due-date sort | Sorting boundary |
| BUG-1056 | Details panel shows an outdated status after completing from the list | Frontend state consistency |
| BUG-1061 | Editing from the details panel can reverse a completion | Frontend state / persisted data |
| BUG-1067 | An existing task can be saved with a blank title | Validation parity |

BUG-1056 and BUG-1061 are related observations. They may or may not turn out to share a cause; the inputs do not decide that for the engineer.

The same IDs are used in every file in this folder, in `docs/defect-reports/`, and in the application’s maintainer materials.

## Files

| File | What it is | What is intentionally blank |
| --- | --- | --- |
| `defect-reports.md` | Six user-visible reports with reproduction steps, observed and expected behavior, impact, and related-issue notes. | Root cause, code location, severity, and proposed fix. |
| `acceptance-criteria.md` | Observable expectations for the application plus the minimum verification required for each supplied defect. | Test implementation, test priority, and final pass/fail decisions. |
| `defect-register.ods` | Editable LibreOffice Calc register with columns for defect ID, summary, impact, priority, reproduction status, assigned test, and resolution status. | Impact, priority, reproduction status, assigned test, and resolution status. Only IDs and summaries are prepopulated. |
| `defect-test-matrix.ods` | Editable Calc matrix with columns for defect ID, reproduction steps, expected result, regression test reference, test result, and notes. | Reproduction steps, expected result, test reference, result, and notes. Only defect IDs are prepopulated. |
| `verification-report-template.odt` | Editable Writer report with sections for test strategy, defects reproduced, tests added, fixes verified, unresolved defects, and residual risks. | Every substantive section. Only the title, short purpose statement, and the report-detail fields (engineer, date, build, environment) are provided. |

The spreadsheets and report template are native OpenDocument files (`.ods` and `.odt`) written by LibreOffice itself. They were opened and re-rendered with LibreOffice 26.8.1 on macOS: both spreadsheets load in Calc with their column layout, wrapped headers, and blank investigation cells, and the report template loads in Writer with all six sections empty. Saving them from LibreOffice keeps the ODS/ODT formats, and the documents contain no macros or external links.

## Relationship to the codebase

The Tasklane application is at the repository root:

- `src/` contains the React + TypeScript application.
- `src/services/taskService.ts` and the browser’s `localStorage` provide persistence.
- `src/data/seedTasks.ts` defines the eight fictional tasks restored by **Reset demo data**.
- `src/test/setup.ts` holds the Vitest setup, and the existing suite lives next to the code it covers: `src/components/TaskBoard.test.tsx`, `src/lib/taskRules.test.ts`, and `src/services/taskService.test.ts`.

Useful commands:

```bash
npm install
npm run dev       # Vite dev server, normally http://localhost:5173
npm test          # existing Vitest suite
npm run build     # TypeScript check and production build
```

The product behavior is also documented in `docs/FEATURE_SPEC.md` and `docs/ACCEPTANCE_CRITERIA.md`. The six canonical source reports are in `docs/defect-reports/`. The files in `task-inputs/` restate the same defect set in the form expected for this exercise, so keep IDs and expectations consistent with those sources.

The application is intentionally preserved with defects. Do not fix the application, change the existing tests, or edit the source reports while preparing the regression plan.

## Suggested working sequence

1. Read `defect-reports.md` and `acceptance-criteria.md`.
2. Start Tasklane, reset the demo data, and reproduce each observation in the browser.
3. Record your investigation in `defect-register.ods`. Set impact and priority based on your own analysis, then track reproduction and resolution status.
4. Build `defect-test-matrix.ods` into the working test plan. Add the reproduction steps, expected result, a reference to the regression test you create, its result, and any notes.
5. Add the regression tests to the existing test suite, following the project’s current Vitest and Testing Library patterns. Do not modify the existing tests to make the suite pass.
6. Verify fixes against both the new regression coverage and the surrounding behavior in the acceptance criteria.
7. Use `verification-report-template.odt` to record the final test strategy, reproduced defects, added tests, verified fixes, unresolved defects, and residual risks.

The register and matrix are starting documents, not answer keys. Blank fields are intentional. Priorities must not be assigned in advance, and no pass/fail result should be recorded before the corresponding work is performed.
