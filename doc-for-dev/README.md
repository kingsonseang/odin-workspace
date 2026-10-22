# Forgeboard

Forgeboard is the team's internal project tracker. It keeps project health, task
ownership, and a running activity log in one workspace.

This README is a work in progress. The setup instructions below are current and
verified; the **Architecture**, **Request flow**, **Dependencies**, and
**Troubleshooting** sections are still stubs and are part of a documentation
exercise — see [`task-inputs/`](./task-inputs/) for the brief, the
requirements, and the templates to fill in.

## Requirements

- Node.js 20.11 or newer (see `.nvmrc`)
- npm 10 or newer

## Install

```bash
nvm use
npm ci
```

Optionally copy the local configuration and adjust it before starting:

```bash
cp .env.example .env
```

## Run

```bash
npm run dev
```

This starts the API and the web app together. Each process prints the local URL
it is serving on, so open the web app's URL in your browser. The web app proxies
its API calls to the API process, so you only need the one URL.

The workspace ships with seeded demo data and an identity switcher in the
header, so you can look at the same workspace from different team members' point
of view. The demo data is disposable: it is recreated whenever the API process
starts.

To run one side at a time:

```bash
npm run dev:api
npm run dev:web
```

## Checks

```bash
npm run typecheck   # type check every workspace
npm test            # unit and API tests
npm run build       # production build of the web app
npm run verify      # typecheck + tests + build
```

## Architecture

_TODO — not written yet._

Document the processes that run, the units of the repository and what each one
owns, the boundaries between them, and the direction of the dependencies between
them. Add the diagram you produce (`task-inputs/architecture-template.odg`) and
link to it from this section.

## Request flow

_TODO — not written yet._

Document at least one read path and one write path, from the interface through
to the stored state and back, plus one rejected path and the error the caller
receives. Say which layer is authoritative for permissions, state changes, and
calculated values.

## Dependencies

_TODO — not written yet._

List the third-party packages that matter and why each one is used, the
internal dependency direction between the units of the repository, and the
runtime or version constraints a new engineer has to respect.

## Troubleshooting

_TODO — not written yet._

Record the symptoms you hit while setting the project up, what caused them, and
the fix that worked. Real symptoms only — do not invent generic advice.

## Further reading

- [`task-inputs/product-brief.md`](./task-inputs/product-brief.md) — what the
  product is meant to do.
- [`task-inputs/onboarding-requirements.md`](./task-inputs/onboarding-requirements.md) —
  what this documentation has to cover.
- [`task-inputs/architecture-checklist.md`](./task-inputs/architecture-checklist.md) —
  coverage checklist for the write-up.
- [`task-inputs/validation-checklist.md`](./task-inputs/validation-checklist.md) —
  final smoke test.
