# Tasklane Feature Specification

**Status:** Approved product intent for the synthetic fixture  
**Version:** 1.0  
**Last updated:** 2026-10-20

## 1. Purpose

Tasklane is a single-project task board for a small team. It lets a user create and maintain delivery tasks, review ownership and dates, narrow the list, and sort the work without leaving the board.

This specification defines intended behavior. It is not a test plan and does not describe implementation details.

## 2. Scope

### In scope

- A single fixed project named “Website Refresh”
- One task list with persisted local data
- Task creation, editing, deletion, completion, and reopening
- Search, status filtering, priority filtering, and sorting
- Task details
- Form validation
- Responsive behavior on desktop and mobile widths

### Out of scope

- Authentication, accounts, and permissions
- Multiple projects
- Remote synchronization or a server API
- Notifications, comments, mentions, or attachments
- Recurring tasks or subtasks
- Bulk editing

## 3. Task model

Each task has the following attributes:

| Attribute | Required | Rules |
| --- | --- | --- |
| ID | Yes | System-generated and stable within the board |
| Title | Yes | After trimming, 1–80 characters inclusive |
| Description | No | After trimming, 0–300 characters |
| Status | Yes | `To do`, `In progress`, or `Done`; defaults to `To do` |
| Priority | Yes | `Low`, `Medium`, `High`, or `Urgent`; defaults to `Medium` |
| Assignee | No | One of the fixed fictional team handles, or unassigned |
| Due date | No | A valid calendar date; no time component |
| Created at | Yes | Set when the task is created |
| Updated at | Yes | Updated whenever a task is changed |

The assignee list is fictional and limited to Avery, Jordan, Morgan, Riley, and Sam.

## 4. Board overview

The board displays:

- The fixed project name, “Website Refresh”
- A total count of tasks
- A count of tasks in each status
- The current number of visible tasks compared with the total
- Search, status, priority, and sort controls
- The task list
- A details panel for the selected task, or a neutral prompt when nothing is selected
- A footer action to reset the demo data

Status and priority counts describe the entire board, not only the filtered result. The visible-result count describes the filtered result.

## 5. Creating a task

A **New task** action opens a modal form.

- Title starts blank and is required.
- Description starts blank and is optional.
- Status defaults to `To do`.
- Priority defaults to `Medium`.
- Assignee defaults to unassigned.
- Due date starts blank.
- The user can cancel without creating a task.
- Submitting a valid form creates one task, closes the form, records the current time, and makes the task available in the list.
- Invalid input keeps the form open and displays a specific field-level error.

## 6. Validation

Validation is applied when the form is submitted.

- A title that is empty after trimming is rejected on both create and edit.
- A title whose trimmed length is **80 characters is valid**. A title whose trimmed length is 81 characters or more is rejected.
- A description whose trimmed length is 300 characters is valid. A description whose trimmed length is 301 characters or more is rejected.
- A due date, when present, must be a valid calendar date.
- Errors identify the field and explain the requirement.
- Correcting a field clears its current error presentation on the next submit or edit.
- Saving must not silently accept input that violates these rules.

## 7. Editing a task

A task can be edited from its row or from the details panel.

- The form is prefilled with the task’s current values at the moment the edit action is used.
- Saving applies all form values to the task and updates the “Last updated” value.
- Saving a valid edit closes the form and refreshes every representation of that task on the board.
- Canceling discards the form values without changing the task.
- Validation rules are identical for create and edit.
- If the same task is visible in the details panel, the panel must show the saved values after the edit completes.

## 8. Completion and status

Each task row has a completion checkbox.

- Checking an incomplete task changes its status to `Done`.
- Unchecking a completed task changes its status to `To do`.
- The row badge and the board status counts update immediately.
- If that task is open in the details panel, the panel updates immediately to the same status.
- Status can also be changed explicitly in the edit form.

## 9. Task details

Selecting a task title opens a details panel showing:

- Title
- Description
- Status
- Priority
- Assignee
- Due date
- Created date
- Last updated date
- An edit action

The details panel reflects the current state of the selected task. Changes made elsewhere on the board, including completion changes, must be visible in the panel without requiring the user to close and reopen it.

The panel can be closed manually. Deleting the selected task closes the panel.

## 10. Search and filtering

### Search

- Searches task titles and descriptions.
- Is case-insensitive.
- Uses trimmed input.
- Matches substrings.
- An empty search does not restrict results.

### Status and priority

- The status filter can be `All statuses`, `To do`, `In progress`, or `Done`.
- The priority filter can be `All priorities`, `Low`, `Medium`, `High`, or `Urgent`.
- Selecting a specific status shows only tasks in that status.
- Selecting a specific priority shows only tasks in that priority.
- When both specific filters are active, a task must match **both** conditions to remain visible.
- Search is combined with every active filter using AND.
- The visible count and empty state reflect the combined criteria.
- **Clear filters** resets search, status, and priority. It leaves the current sort order unchanged.

## 11. Sorting

The selected sort order determines the order of all visible tasks.

| Option | Rule |
| --- | --- |
| Newest first | Created date, newest to oldest; default |
| Title A–Z | Title, case-insensitive ascending; task ID breaks ties |
| Priority (urgent first) | Urgent, High, Medium, Low; title breaks ties |
| Due date (soonest first) | Earliest due date first; tasks without a due date appear last; title breaks ties |

Sorting does not remove or alter tasks. Changing filters preserves the selected sort order. Changing sort preserves the active filters.

## 12. Deleting a task

- Delete asks for confirmation and identifies the task by title.
- Cancel leaves the task unchanged.
- Confirming removes the task from the board and from local storage.
- If the deleted task is open in the details panel, the panel closes.
- After a refresh, a deleted task does not return.

## 13. Persistence and reset

- The board loads saved tasks from local storage.
- If no saved board exists, eight demo tasks are created and saved.
- Create, edit, completion, and delete changes persist across a page refresh.
- An intentionally empty board remains empty until the user creates a task or resets the demo data.
- **Reset demo data** restores the original eight tasks and clears selected-task, form, filter, and sort state.

## 14. Display and accessibility

- Every form control has a visible label.
- Icon-only controls have accessible names.
- Validation errors are programmatically associated with their fields.
- Buttons and checkboxes are keyboard-operable.
- Focus indicators are visible.
- Status is not communicated by color alone.
- Layout remains usable at mobile widths down to 320 CSS pixels.
- Long titles and descriptions wrap without breaking the layout.
- Empty states distinguish between “no tasks exist” and “no tasks match the filters.”

## 15. Non-functional expectations

- No real personal data is used.
- The app works without a backend or network connection after assets are loaded.
- The existing test command must run consistently with no external services.
