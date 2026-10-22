# Validation Checklist

Run this as a final smoke test over the finished deliverables: the onboarding
guide (`.odt`), the architecture diagram (`.odg`), the component inventory
(`.ods`), and the completed README. Record evidence for everything you check.

## 1. Reproduce the setup

- [ ] `npm ci` succeeds from a clean checkout with the documented Node/npm
      versions.
- [ ] `npm run verify` passes; record the test count and the final result.
- [ ] `npm run dev` starts every process the README claims, at the URLs the
      README and the guide describe.
- [ ] The README's install and run instructions work as written, from a clean
      clone, with no undocumented step.

## 2. Exercise the product

- [ ] The project list loads from a freshly started API process.
- [ ] A project can be opened, and its metadata, progress, members, tasks, and
      activity render.
- [ ] Switching identity changes what the interface offers; reloading keeps the
      selection.
- [ ] The archived filter changes the visible set, and archived projects are
      clearly marked.
- [ ] Creating a task updates progress, task counts, and activity without a
      page reload.
- [ ] At least two valid task transitions work, and one invalid or unavailable
      transition is rejected.
- [ ] The progress figures in the guide can be reproduced from the task data.

## 3. Exercise lifecycle and permissions

- [ ] The completion precondition is tested, and the outcome matches the guide.
- [ ] Archiving and restoring are exercised, and the resulting state is
      recorded.
- [ ] A non-lead and a non-member are both denied the actions the guide says
      they cannot perform.
- [ ] The API is restarted after a change, and the resulting state matches what
      the guide claims about storage and seed data.

## 4. Check the documents

- [ ] Every claim in the guide, the inventory, and the diagram is backed by a
      path, symbol, command, or observed response.
- [ ] The diagram contains the components that exist, with connectors you
      verified — and no placeholder box is left unlabelled.
- [ ] The inventory has one row per component, no leftover placeholder rows, and
      evidence in every row.
- [ ] The README no longer contains a stub, and its setup instructions still
      work.
- [ ] The shipped documentation is compared with the running product, and each
      difference is recorded with evidence and a classification.
- [ ] Unverified areas are labelled instead of being written as fact.

## 5. Finish

- [ ] No application source, tests, schema, or configuration were changed.
- [ ] All four deliverables are saved in their original formats and open
      cleanly.
- [ ] A reviewer can repeat the main flows using only the written
      documentation.
