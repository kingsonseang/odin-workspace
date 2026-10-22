# Tasklane — regression test-plan fixture

Tasklane is a small, synthetic project-management application built for the exercise **“Build a regression test plan from defect reports.”**

It is a React + TypeScript task board with a localStorage-backed service layer. The application mixes working behavior with intentionally preserved defects. **Do not fix the defects or alter the existing tests while preparing the regression analysis.**

All tasks, people, project details, and dates are fictional.

## Quick start

Requirements:

- Node.js 20 or newer
- npm 10 or newer

Install and run:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>.

For a clean install from the committed lockfile:

```bash
npm ci
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run the existing test suite once |
| `npm run test:watch` | Run tests in watch mode |

The existing suite uses Vitest, jsdom, and Testing Library. It covers happy paths and common single control interactions. A passing suite does **not** mean the specified behavior is fully covered.

## Demo data and storage

On first load, the app seeds eight fictional tasks and stores them under the localStorage key `tasklane.tasks.v1`. Changes persist across refreshes in the same browser profile.

- Use **Reset demo data** in the footer to restore the original seeded board.
- Clearing site data has the same effect.
- There is no server, account, or network request. The service layer is local to the browser.

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/FEATURE_SPEC.md`](docs/FEATURE_SPEC.md) | Intended product behavior and constraints |
| [`docs/ACCEPTANCE_CRITERIA.md`](docs/ACCEPTANCE_CRITERIA.md) | Separate testable acceptance criteria |
| [`docs/defect-reports/`](docs/defect-reports/README.md) | Six synthetic defect reports |
| [`VALIDATION_CHECKLIST.md`](VALIDATION_CHECKLIST.md) | Maintainer checks for setup and intended-defect reproduction |

`VALIDATION_CHECKLIST.md` contains fixture-maintainer spoilers. It confirms reproducibility only; it is not the regression test plan and does not include a test-case matrix.

## Scope

Included:

- Create, edit, complete/reopen, and delete tasks
- Search across titles and descriptions
- Status and priority filters
- Four sort orders
- Form validation and inline errors
- Task details panel
- Local persistence and demo-data reset

Not included:

- Authentication or user accounts
- Multiple projects or workspaces
- A remote API or database
- Real-time collaboration
- File attachments or notifications

## Project structure

```text
.
├── docs/
│   ├── ACCEPTANCE_CRITERIA.md
│   ├── FEATURE_SPEC.md
│   └── defect-reports/
├── src/
│   ├── components/
│   ├── data/seedTasks.ts
│   ├── lib/
│   ├── services/taskService.ts
│   ├── test/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Working notes for the regression exercise

1. Read the feature specification and acceptance criteria before attempting reproduction.
2. Treat the defect reports as observations, not diagnoses. Some may overlap; some may not describe separate problems.
3. Reproduce and characterize behavior before proposing test coverage.
4. Preserve the application and existing tests exactly as provided.
5. Do not use `VALIDATION_CHECKLIST.md` as the final regression matrix.
