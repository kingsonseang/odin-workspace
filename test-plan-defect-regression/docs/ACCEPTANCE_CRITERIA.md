# Tasklane Acceptance Criteria

**Version:** 1.0  
**Last updated:** 2026-10-20

These criteria describe observable, intended behavior. They are separate from the feature specification and do not describe implementation or test design.

## Task list and summary

**AC-01 — Initial board**  
Given no saved board exists, when Tasklane loads, then eight fictional tasks are displayed, the total count is eight, and all tasks persist to local storage.

**AC-02 — Status summary**  
Given the seeded board, when the summary is shown, then it reports four tasks in `To do`, two in `In progress`, and two in `Done`.

**AC-03 — Task metadata**  
Given any task in the list, when it is rendered, then its title, description, priority, status, assignee, and due date are represented, with clear fallbacks for an unassigned task and a task without a due date.

**AC-04 — Visible count**  
Given any combination of search and filters, when the list is shown, then the visible-result text reports the number of matching tasks and the total number of tasks.

## Create, edit, and validation

**AC-05 — Create a task**  
Given a valid title, when the user submits the new-task form, then the form closes, the task is added to the board, and the total count increases by one.

**AC-06 — Title boundary**  
Given a title of exactly 80 characters after trimming, when the user submits the form in create or edit mode, then the task is accepted. A title of 81 characters is rejected.

**AC-07 — Required title**  
Given a title that is empty or whitespace-only, when the user submits the form in create or edit mode, then the form remains open and a title error is shown.

**AC-08 — Description limit**  
Given a description of 300 characters after trimming, when the user submits the form, then it is accepted. A description of 301 characters is rejected with a field error.

**AC-09 — Invalid due date**  
Given a non-empty due date that is not a valid calendar date, when the user submits the form, then the task is not saved and a due-date error is shown.

**AC-10 — Cancel create or edit**  
Given an open create or edit form with changed values, when the user cancels, then no task is created and no existing task is changed.

**AC-11 — Edit prefill**  
Given an existing task, when the edit form opens from its row or from the details panel, then every field is prefilled with the task’s current values.

**AC-12 — Edit save**  
Given a valid edit, when the user saves, then the form closes and every visible representation of the task shows the updated field values.

**AC-13 — Edit validation parity**  
Given an edit that violates any validation rule that applies to creation, when the user saves, then the edit is rejected and the form remains open with a field-level error.

## Completion and details

**AC-14 — Complete from the list**  
Given an incomplete task, when its checkbox is checked, then its status becomes `Done`, its row updates, and the board status counts update immediately.

**AC-15 — Reopen from the list**  
Given a completed task, when its checkbox is unchecked, then its status becomes `To do`, its row updates, and the board status counts update immediately.

**AC-16 — Details contents**  
Given a selected task, when the details panel is open, then it shows title, description, status, priority, assignee, due date, created date, last updated date, and an edit action.

**AC-17 — Details synchronization**  
Given a task is open in the details panel, when its completion status changes from the row, then the status shown in the details panel updates immediately without reopening it.

**AC-18 — Details edit safety**  
Given a task is open in the details panel and has just been completed from the row, when the user opens edit from that panel and saves a valid change, then the completed status remains `Done`.

## Search and filters

**AC-19 — Title search**  
Given the board, when the user enters part of a title in any letter case, then only tasks whose titles contain that text are visible.

**AC-20 — Description search**  
Given the board, when the user enters text that appears only in descriptions, then the matching tasks are visible.

**AC-21 — Single status filter**  
Given the board, when the user selects a specific status, then every visible task has that status.

**AC-22 — Single priority filter**  
Given the board, when the user selects a specific priority, then every visible task has that priority.

**AC-23 — Combined filters**  
Given both a specific status and a specific priority are selected, then every visible task matches **both** values.

**AC-24 — Search plus filters**  
Given a search term and one or more specific filters, then every visible task matches the search and all active filters.

**AC-25 — Clear filters**  
Given search, status, and priority are active, when the user chooses `Clear filters`, then those three controls reset and the selected sort order is preserved.

**AC-26 — Filtered empty state**  
Given filters produce no matches, then the board shows a no-matches message rather than the first-use empty state, and offers a way to clear the filters.

## Sorting

**AC-27 — Default order**  
Given no explicit sort choice, when the board loads, then tasks are ordered by created date, newest first.

**AC-28 — Title order**  
Given `Title A–Z` is selected, then titles are ordered ascending without regard to letter case, with deterministic tie-breaking.

**AC-29 — Priority order**  
Given `Priority (urgent first)` is selected, then tasks are ordered `Urgent`, `High`, `Medium`, `Low`, with deterministic tie-breaking.

**AC-30 — Due-date order**  
Given `Due date (soonest first)` is selected, then dated tasks are ordered from earliest to latest and every task without a due date appears after all dated tasks.

**AC-31 — Control independence**  
Given an active filter or search, when the sort order changes, then the filters remain active. Given an active sort order, when filters change, then the sort remains selected.

## Delete, persistence, and reset

**AC-32 — Delete confirmation**  
Given a task, when the user chooses delete, then a confirmation dialog identifies the task and no deletion occurs until confirmation.

**AC-33 — Delete cancellation**  
Given the delete confirmation is open, when the user cancels, then the task remains on the board.

**AC-34 — Delete persistence**  
Given a confirmed deletion, when the page is refreshed, then the deleted task does not return.

**AC-35 — Delete selected task**  
Given the task is open in the details panel, when deletion is confirmed, then the panel closes.

**AC-36 — Persistence**  
Given a created, edited, completed, or deleted task, when the page is refreshed, then the latest saved state is restored.

**AC-37 — Reset demo data**  
Given a changed board, when the user activates `Reset demo data`, then the original eight tasks return, the previous selection closes, and search, status, priority, and sort reset to their defaults.

## Accessibility and layout

**AC-38 — Accessible controls**  
Given the board or form, when a user navigates with a keyboard or assistive technology, then every input has a visible label and every icon-only control has an accessible name.

**AC-39 — Error announcement**  
Given a validation failure, then the error text is displayed near the field, programmatically associated with it, and exposed as an alert.

**AC-40 — Responsive usability**  
Given a viewport width of 320 CSS pixels, when the board and forms are used, then content remains within the viewport and actions remain operable without horizontal page scrolling.
