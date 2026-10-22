# New Engineer Onboarding Exercise — Forgeboard

## Scenario

You have joined the team as an engineer who will maintain Forgeboard. A new
contributor starts next week, and the documentation that shipped with the
repository is incomplete: some sections are stubs, and some of what is written
no longer matches the running product.

Your job is to investigate the repository as a working system and produce the
onboarding material you wish you had received — a trustworthy explanation of
how the product is put together, how its important flows move through the code,
and where the documented behavior and the implemented behavior diverge.

You are documenting the system, not changing it.

## Timebox

Plan for one focused engineering session of roughly two hours. A precise,
evidence-backed explanation of the core is worth more than complete but
hand-wavy coverage of every file.

## Inputs

- This repository and its source code, tests, and configuration.
- `task-inputs/product-brief.md`, which describes intended product behavior.
- `task-inputs/architecture-checklist.md`, the coverage checklist.
- `task-inputs/validation-checklist.md`, the final smoke test.
- The three editable starter templates in `task-inputs/`.
- The running application and API.

## Ground rules

- Do not modify application source, tests, schema, or configuration as part of
  this exercise.
- Read the implementation instead of inferring behavior from folder or file
  names alone.
- Execute the application and verify behavior directly where practical.
- Prefer specific evidence — file paths, symbols, commands, request/response
  examples, or screenshots — over general summaries.
- Treat the shipped README as a claim to verify, not as a reliable
  specification.
- Clearly distinguish product intent, intentional implementation choices, stale
  documentation, test gaps, and actual defects.
- Record unanswered questions honestly. Do not fill gaps with guesses.
- Keep the supplied templates editable. Save your work in the same OpenDocument
  formats; export a PDF copy only if someone asks for one.

## Deliverables

Four artefacts. All of them start as templates in `task-inputs/`.

### 1. Onboarding guide — `task-inputs/onboarding-guide-template.odt`

Open it in LibreOffice Writer and fill in the sections. Keep the supplied
headings; add sections only when you have something real to put in them.

| Section | What it must contain |
| --- | --- |
| Repository structure | The top-level units of the repository, what each one owns, and where the entry points are, with paths. |
| Architecture overview | The runtime processes, their responsibilities, the boundaries between them, and how they communicate. Summarise your diagram from deliverable 2. |
| Request lifecycle | One read path, one write path, and one rejected path traced end to end, with the actual request and response you observed. |
| Key dependencies | The third-party packages that matter and why, the internal dependency direction between modules, and runtime constraints. |
| Local setup | The exact commands to install, configure, run, and stop the app, the URLs the processes actually use, and the configuration variables with their defaults. |
| Testing | The test suites and what they cover, the commands you ran with their results, the important gaps, and how to verify a change end to end. |
| Troubleshooting | Symptoms you hit while setting the project up, the cause, and the fix that worked. |

The template also provides **Discrepancies found**, **Decisions and trade-offs**,
and **Open questions**. Use them.

### 2. Architecture diagram — `task-inputs/architecture-template.odg`

Open it in LibreOffice Draw. The canvas ships with labelled placeholder boxes
(frontend, API, business logic, persistence, external dependencies) and a notes
area. The boxes are positioned arbitrarily and nothing is connected.

Replace the placeholders with the components you actually found, arrange them
so the diagram reads clearly, and draw the connections you verified in the
source code and the running app. Use the notes area for the file, symbol, or
command that proves each element. A diagram that is beautiful but unsupported
counts as an empty diagram.

### 3. Component inventory — `task-inputs/component-inventory-template.ods`

Open it in LibreOffice Calc. The **Component inventory** sheet has the columns
*Component*, *Location*, *Responsibility*, *Dependencies*, and *Evidence*, plus
a few clearly marked placeholder rows.

Add one row per component you discover and delete the placeholder rows. Evidence
means a file path, symbol, test name, or command output — not a guess. Keep a row
for something you could not confirm and mark it unverified rather than quietly
dropping it. The second sheet, **How to use**, contains guidance you may keep
or replace.

### 4. Completed project README — `README.md`

The shipped README is deliberately incomplete: the setup instructions work, but
the architecture, request flow, dependencies, and troubleshooting sections are
stubs. Fill them in so that a new engineer can install, run, and navigate the
project from the README alone, and correct anything you find to be wrong.

## What a new engineer must be able to do afterwards

- Install the project from a clean checkout and start it, without asking anyone.
- Find the file responsible for a given feature, rule, or screen.
- Explain how a request travels from the interface to the data and back.
- Say which layer owns permissions, state transitions, and calculated values.
- Add a change safely: know where to edit, what to test, and what to run.
- Diagnose a failure from its symptom.
- Trust the documentation, or at least know exactly which parts to distrust.

## Evidence expectations

Every architectural claim needs a traceable anchor: a path, a symbol, a
command, a response, or an observation from the running app. Where you could
not verify something, say so and mark it unverified instead of guessing.

## Discrepancy log

Record every material difference between the shipped documentation and the
running product, for example:

| Claim | Source | Observed behavior | Evidence | Classification | Suggested action |
| --- | --- | --- | --- | --- | --- |

Classify each row as stale documentation, an intentional product change, an
undocumented rule, a test gap, or a defect. Do not assume that every mismatch
is a documentation problem.

## Decision record

List at least four non-obvious decisions that shaped this codebase. For each:
the decision, the context and the problem it solves, the reasonable
alternatives, the consequences and trade-offs, and how a new engineer should
account for it when changing the code. Document the decisions that are actually
present, not a generic list of best practices.

## Review criteria

Your work is ready when:

- A new engineer can predict where to look for a change without opening a file
  first.
- Every architectural claim is traceable to code or a runtime observation.
- The three traced flows include both a happy path and a rejected path.
- The diagram matches this repository, not a generic template.
- The inventory covers the components that matter, and every row carries
  evidence.
- The README works as a standalone entry point for a new joiner.
- The discrepancy log separates stale docs from intentional behavior and
  defects.
- At least four decisions include real trade-offs rather than restating code.
- The checklists in `architecture-checklist.md` and `validation-checklist.md` are
  substantially covered, and anything skipped is explained.
