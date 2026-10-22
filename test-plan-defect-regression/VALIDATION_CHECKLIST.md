# Validation Checklist

**For fixture maintainers — contains reproduction details**  
**Version:** 1.0  
**Last updated:** 2026-10-21

Use this checklist before handing the repository to an engineer for regression analysis. It confirms that the application runs, the happy path behaves normally, and the intended defect reports are reproducible.

This checklist is **not** the regression test plan and is not a test matrix.

## 1. Environment and commands

- [ ] Node.js 20 or newer is active. `node --version` reports a supported version.
- [ ] `npm ci` completes from the committed `package-lock.json`.
- [ ] `npm run build` completes with no TypeScript or Vite errors.
- [ ] `npm test` completes consistently with all tests passing. Expected: 3 test files and 24 tests.
- [ ] `npm run dev` starts the app, and the printed local URL loads in a current browser.
- [ ] The page displays no framework error overlay and no unexpected console errors on load.

## 2. Application smoke checks

Start from a fresh browser profile or activate **Reset demo data** before the list checks.

- [ ] Eight seeded tasks are visible, and the result text reads `Showing 8 of 8 tasks`.
- [ ] Summary counts read `4` To do, `2` In progress, and `2` Done.
- [ ] **New task** creates a task with a valid title, and the result count increases to `Showing 9 of 9 tasks`.
- [ ] An empty title in the create form shows `Title is required.` and keeps the form open.
- [ ] Editing a task title updates the corresponding list row.
- [ ] Marking a task complete from its checkbox updates that row’s status.
- [ ] The **Status** filter set to **Done** alone shows two tasks.
- [ ] Searching for `keyboard` shows one task.
- [ ] **Title A–Z** places `Add an empty state to the project list` first.
- [ ] Selecting a task title opens the details panel with the task’s fields.
- [ ] The details panel closes with its close control.
- [ ] Deleting a task requires confirmation. Cancel leaves it present; confirm removes it.
- [ ] A created or edited task is still present after a page refresh.
- [ ] **Reset demo data** restores the eight seeded tasks and the default controls.

## 3. Intended defect reproduction

Reset demo data before each numbered check unless a continuation is explicitly stated.

### 3.1 BUG-1042 — 80-character title rejected

- [ ] Open **New task**.
- [ ] Enter this title, which is exactly 80 characters:

  ```text
  Review onboarding checklist copy and layout on desktop, tablet, and mobile views
  ```

- [ ] Submit the form.

Expected: the task is created.  
Observed fixture behavior: the form remains open and shows `Title must be 80 characters or fewer.`  
Result: [ ] Confirmed

### 3.2 BUG-1047 — combined filters return too many tasks

- [ ] Set **Status** to **In progress**.
- [ ] Set **Priority** to **High**.
- [ ] Compare the visible tasks with the task `Update the QA checklist for release`.

Expected: only `Update the QA checklist for release` is visible.  
Observed fixture behavior: four tasks are visible. The three additions are `Fix mobile navigation overlap`, `Confirm analytics event names`, and `Write release notes draft`.  
Result: [ ] Confirmed

### 3.3 BUG-1051 — undated tasks sort first

- [ ] Leave both filters at **All**.
- [ ] Set **Sort by** to **Due date (soonest first)**.
- [ ] Inspect the first two rows.

Expected: tasks without a due date appear after all dated tasks.  
Observed fixture behavior: `Confirm analytics event names` and `Keyboard focus in task form` are first, and both have no due date.  
Result: [ ] Confirmed

### 3.4 BUG-1056 — details panel shows stale status

- [ ] Open the task **Fix mobile navigation overlap** in the details panel.
- [ ] Confirm the panel shows **In progress**.
- [ ] With the panel still open, check the task’s completion checkbox in the list.
- [ ] Compare the row status and the details-panel status.

Expected: both show **Done**, and the panel updates without reopening.  
Observed fixture behavior: the row shows **Done**, but the panel continues to show **In progress**.  
Result: [ ] Confirmed

### 3.5 BUG-1061 — edit from details reverses completion

- [ ] Open **Fix mobile navigation overlap** in the details panel.
- [ ] Check its completion checkbox in the list. The row now shows **Done**, while the panel still shows **In progress**.
- [ ] Choose **Edit task** in the details panel.
- [ ] Confirm the form’s **Status** field shows **In progress**.
- [ ] Change the title to `Fix mobile navigation overlap – header`.
- [ ] Save the form.

Expected: the task remains **Done** after the title edit.  
Observed fixture behavior: the task returns to **In progress**, and the Done summary count decreases.  
Result: [ ] Confirmed

**Overlap note:** BUG-1061 reuses the precondition from BUG-1056. Do not decide here whether they are one defect or two; that question belongs to the regression analysis.

### 3.6 BUG-1067 — blank title saved on edit

- [ ] Find **Add an empty state to the project list**.
- [ ] Choose **Edit**.
- [ ] Clear the **Title** field.
- [ ] Choose **Save changes**.

Expected: the form stays open with a required-title error.  
Observed fixture behavior: the form closes and the task appears as a blank row.  
Result: [ ] Confirmed

## 4. Handoff checks

- [ ] All six report IDs above have been reproduced from a clean board.
- [ ] The passing test suite did not fail during validation.
- [ ] No source files, tests, or defect reports were modified to make a defect reproduce or disappear.
- [ ] The overlap between BUG-1056 and BUG-1061 has been noted for the engineer but not resolved in this checklist.
- [ ] The repository contains no real personal data.

## 5. Stop conditions

Do not hand off the fixture if:

- The build or test command fails.
- Fewer than eight seeded tasks appear after reset.
- Any intended defect in section 3 cannot be reproduced.
- The existing automated tests do not pass.
- Reproduction requires changing application code.
