# Tasklane Acceptance Criteria

**Task:** Build a regression test plan from defect reports  
**Application:** Tasklane synthetic task board  
**Purpose:** Define expected application behavior and the minimum verification expected for each supplied defect.

These are product expectations, not a test implementation. They do not prescribe regression test code, test priority, or defect resolution.

## 1. Task lifecycle

**AC-01 — Initial board**  
Given no saved board exists, when Tasklane loads, then eight fictional tasks are displayed, the total is eight, and the seeded data is stored locally.

**AC-02 — Create a task**  
Given a valid draft, when the user submits the new-task form, then the form closes, the task appears on the board, and the total count increases by one.

**AC-03 — Edit a task**  
Given an existing task, when the user opens its edit form, then current values are prefilled. Saving a valid edit closes the form and updates every visible representation of that task.

**AC-04 — Cancel create or edit**  
Given an open form with changed values, when the user cancels, then no task is created and no existing task is changed.

**AC-05 — Complete and reopen**  
Given an incomplete task, when its checkbox is checked, then its status becomes `Done` and the board counts update. Unchecking a completed task changes its status to `To do`.

**AC-06 — Delete and persist**  
Given a task, when the user confirms deletion, then the task is removed and remains absent after a page refresh. Canceling deletion leaves it unchanged.

**AC-07 — Reset demo data**  
Given a changed board, when the user selects **Reset demo data**, then the original eight tasks return and selection, filters, sort, and open dialogs reset.

## 2. Validation

**AC-08 — Title required on create**  
Given an empty or whitespace-only title, when the user submits the create form, then the form remains open and a title error is shown.

**AC-09 — Title required on edit**  
Given an existing task, when the user clears the title or enters only whitespace and submits the edit form, then the form remains open and a title error is shown.

**AC-10 — Title length boundary**  
Given a title whose trimmed value has exactly 80 characters, when the user submits the create or edit form, then the task is accepted. A trimmed title of 81 characters is rejected with a field-level error.

**AC-11 — Description limit**  
Given an optional description, when its trimmed length is 300 characters it is accepted; when it is 301 characters or more it is rejected with a field-level error.

**AC-12 — Due date validity**  
Given an optional due date, when a non-empty value is not a valid calendar date, then the form is not saved and a due-date error is shown.

**AC-13 — Error accessibility**  
Given a validation failure, then the error is displayed near its field, exposed as an alert, and programmatically associated with the field.

## 3. Details and state consistency

**AC-14 — Details contents**  
Given a selected task, when the details panel is open, then it shows title, description, status, priority, assignee, due date, created date, last updated date, and an edit action.

**AC-15 — Details stay current**  
Given a task is open in the details panel, when its completion status changes from the list, then the panel updates immediately without being closed and reopened.

**AC-16 — Editing preserves current state**  
Given a task was just completed and is open in the details panel, when the user edits an unrelated field from that panel and saves, then the task remains `Done`.

**AC-17 — Delete selected task**  
Given a task is open in the details panel, when its deletion is confirmed, then the details panel closes.

## 4. Search and filtering

**AC-18 — Search**  
Given a search term, when the user enters it in any letter case, then visible tasks match that substring in the title or description.

**AC-19 — Single filter**  
Given a specific status or priority is selected alone, then every visible task matches the selected value.

**AC-20 — Combined filters**  
Given a specific status and a specific priority are selected together, then every visible task matches both values.

**AC-21 — Search with filters**  
Given a search term and one or more specific filters, then every visible task matches the search and all selected filters.

**AC-22 — Clear filters**  
Given active search and filters, when the user chooses **Clear filters**, then search, status, and priority reset while the selected sort order remains unchanged.

**AC-23 — Filtered empty state**  
Given active criteria produce no matches, then the board shows a no-matches message and a way to clear the filters instead of the first-use empty state.

**AC-24 — Visible count**  
Given any search and filter combination, then the visible-result text reports the number of visible tasks and the total number of tasks.

## 5. Sorting

**AC-25 — Default sort**  
Given no explicit sort choice, when the board loads, then tasks are ordered by created date, newest first.

**AC-26 — Title sort**  
Given **Title A–Z** is selected, then titles are ordered case-insensitively ascending with deterministic ties.

**AC-27 — Priority sort**  
Given **Priority (urgent first)** is selected, then tasks are ordered Urgent, High, Medium, Low with deterministic ties.

**AC-28 — Due-date sort**  
Given **Due date (soonest first)** is selected, then dated tasks are ordered from earliest to latest and every task without a due date appears after all dated tasks.

**AC-29 — Filter and sort independence**  
Given active filters, changing sort preserves the filters. Given an active sort, changing filters preserves the sort.

## 6. Persistence and display

**AC-30 — Persistence**  
Given any create, edit, completion, or deletion, when the page is refreshed, then the latest saved board state is restored.

**AC-31 — Accessible controls**  
Given the board and forms, every input has a visible label, every icon-only control has an accessible name, and all actions are keyboard-operable.

**AC-32 — Responsive layout**  
Given a viewport width of 320 CSS pixels, the board and forms remain within the viewport and actions remain operable without horizontal page scrolling.

## 7. Minimum verification requirements for supplied defects

The following requirements define the minimum evidence needed for each defect. They do not assign tests or determine whether reports are duplicates.

| Defect ID | Minimum verification requirement |
| --- | --- |
| BUG-1042 | In both create and edit flows, verify that a trimmed 80-character title is accepted and an 81-character title is rejected. |
| BUG-1047 | With **In progress** and **High** selected simultaneously, verify that only tasks matching both values are visible and the visible count agrees with the rows. |
| BUG-1051 | With due-date sort active, verify every dated task appears in ascending date order and every task without a due date appears after all dated tasks. |
| BUG-1056 | With a task open in the details panel, complete it from the list and verify the panel shows the current status without being reopened. |
| BUG-1061 | With a stale-looking task open in the details panel, complete it from the list, edit an unrelated field from the panel, save, and verify the task remains `Done`. |
| BUG-1067 | In the edit flow, verify blank and whitespace-only titles are rejected and the task retains its previous title. |

## 8. Out of scope

- Authentication and user accounts
- Multiple projects
- Remote APIs or databases
- Comments, attachments, or notifications
- Bulk task operations
- Real personal data
