# Tasklane Defect Reports

**Task:** Build a regression test plan from defect reports  
**Application:** Tasklane synthetic task board  
**Input set:** Six reports for investigation

These reports describe user-visible observations from a fictional QA rotation. They are written as evidence for investigation, not as diagnoses. No root cause, source location, severity ranking, or fix is provided.

Some reports may be related. In particular, BUG-1056 and BUG-1061 describe symptoms observed in the same part of the interface. Determine during the task whether they require separate regression coverage.

All people, tasks, and dates are synthetic.

## Report index

| Defect ID | Summary |
| --- | --- |
| BUG-1042 | Title of exactly 80 characters is rejected |
| BUG-1047 | Status and priority filters return too many tasks |
| BUG-1051 | Tasks without due dates appear first in due-date sort |
| BUG-1056 | Details panel shows an outdated status after completing from the list |
| BUG-1061 | Editing from the details panel can reverse a completion |
| BUG-1067 | An existing task can be saved with a blank title |

---

## BUG-1042 — Title of exactly 80 characters is rejected

- **Defect ID:** BUG-1042
- **Status:** Open
- **Reported:** 2026-10-12
- **Observed in:** New task form and edit task form
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time
- **Related reports:** None confirmed

### Expected behavior

A task title may contain between 1 and 80 characters after trimming. A title containing exactly 80 characters should be accepted and the task should be saved.

### Observed behavior

Submitting a title of exactly 80 characters keeps the form open and displays the error “Title must be 80 characters or fewer.” Removing one character allows the same task to be saved.

### Steps to reproduce

1. Open Tasklane and choose **Reset demo data**.
2. Choose **New task**.
3. Enter this 80-character title:

   ```text
   Review onboarding checklist copy and layout on desktop, tablet, and mobile views
   ```

4. Leave the other fields at their defaults.
5. Choose **Create task**.
6. If needed, repeat the attempt with an existing task in the edit form.

### User impact

A user cannot save a valid title at the documented upper boundary even though the error message says that 80 characters are allowed. The user must shorten legitimate content or use a less descriptive title. The same limit is relevant when editing an existing task.

### Additional context

- A 79-character title saves successfully in the same session.
- No browser console error is shown.
- The behavior was reproduced after resetting the demo data and by pasting the title from a plain-text editor.

---

## BUG-1047 — Status and priority filters return too many tasks

- **Defect ID:** BUG-1047
- **Status:** Open
- **Reported:** 2026-10-14
- **Observed in:** Task filters
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time both filters are used
- **Related reports:** None confirmed

### Expected behavior

When a specific status and a specific priority are selected at the same time, only tasks that match both selected values should remain visible. Search and all active filters are expected to narrow the same result set.

### Observed behavior

Selecting **Status: In progress** and **Priority: High** shows four tasks. Only one of the four is both in progress and high priority. The other three match only one of the two selections. The visible-result count matches the incorrect number of rows.

### Steps to reproduce

1. Reset the demo data.
2. Leave the search field empty.
3. Set **Status** to **In progress**.
4. Set **Priority** to **High**.
5. Review every visible row and compare it with both selected filter values.

Expected visible task:

- Update the QA checklist for release

Observed visible tasks:

- Fix mobile navigation overlap
- Confirm analytics event names
- Update the QA checklist for release
- Write release notes draft

### User impact

A user trying to isolate active, high-priority work sees unrelated tasks. This slows triage and can make the board appear to contain more work in a particular state or priority than it does.

### Additional context

- Either filter on its own appears to show only matching tasks.
- The issue remains after refreshing the page.
- Search was empty during the observation.

---

## BUG-1051 — Tasks without due dates appear first in due-date sort

- **Defect ID:** BUG-1051
- **Status:** Open
- **Reported:** 2026-10-15
- **Observed in:** Task sorting
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time
- **Related reports:** None confirmed

### Expected behavior

The **Due date (soonest first)** option should order dated tasks from earliest to latest. Tasks without a due date should appear after every dated task.

### Observed behavior

The two tasks without due dates appear at the top of the list. All dated tasks, including an overdue task, appear below them.

### Steps to reproduce

1. Reset the demo data.
2. Leave search empty and both filters set to their all-inclusive options.
3. Set **Sort by** to **Due date (soonest first)**.
4. Inspect the first rows of the task list.

The first two visible tasks are:

- Confirm analytics event names
- Keyboard focus in task form

Neither task has a due date. Dated tasks follow in ascending date order.

### User impact

A user looking for urgent or upcoming work sees unscheduled tasks before time-sensitive tasks. This can lead to incorrect planning and can hide overdue work below the fold.

### Additional context

- Sorting by title and by priority appears normal in the same session.
- The task with the earliest due date is not at the top while this sort is active.
- The behavior persists after a refresh and after changing filters.

---

## BUG-1056 — Details panel shows an outdated status after completing from the list

- **Defect ID:** BUG-1056
- **Status:** Open
- **Reported:** 2026-10-16
- **Observed in:** Task list and task details panel
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time
- **Related reports:** BUG-1061

### Expected behavior

When a task is open in the details panel and its completion state changes elsewhere on the board, the panel should show the current status immediately. Every representation of the same task should remain consistent.

### Observed behavior

After checking the task’s completion checkbox in the list, the row changes to **Done**. The open details panel for the same task continues to show **In progress**. Closing and reopening the panel shows the correct status.

### Steps to reproduce

1. Reset the demo data.
2. Select the task title **Fix mobile navigation overlap**.
3. Confirm that the details panel shows **In progress**.
4. Leave the panel open.
5. Check that task’s checkbox in the list.
6. Compare the row status with the status shown in the details panel.

### User impact

The same task appears to be in two different states at once. A user may act on outdated information, and the mismatch reduces confidence in the board’s status summary.

### Additional context

- The row badge and the board’s Done count both change after completion.
- The panel updates correctly if it is closed and reopened.
- BUG-1061 describes a related observation when editing from the open panel.

---

## BUG-1061 — Editing from the details panel can reverse a completion

- **Defect ID:** BUG-1061
- **Status:** Open
- **Reported:** 2026-10-18
- **Observed in:** Task details panel and edit task form
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time when following the sequence below
- **Related reports:** BUG-1056

### Expected behavior

After a task is marked complete, editing a field such as its title or description should not change its completion status. The form should save the task’s current state, and the task should remain **Done**.

### Observed behavior

Completing a task from the list while its details panel is open leaves the panel showing the earlier status. Editing from that panel then prefills the earlier status. Saving the unrelated edit returns the task to **In progress** and reduces the Done count.

### Steps to reproduce

1. Reset the demo data.
2. Open **Fix mobile navigation overlap** in the details panel.
3. With the panel still open, check the task’s checkbox in the list. The row shows **Done**, while the panel still shows **In progress**.
4. Choose **Edit task** in the details panel.
5. Observe the **Status** value in the edit form.
6. Change the title to `Fix mobile navigation overlap – header`.
7. Choose **Save changes**.
8. Compare the saved task status with the status before the edit.

### User impact

A routine title edit can silently reverse a completion. This loses progress state, changes the board’s status totals, and can cause completed work to be picked up again.

### Additional context

- Starting the edit from the task row instead of the open details panel did not reproduce the reversal in my attempt.
- The observation may be related to BUG-1056, but the reported effect is different because saved task data changes.
- Changing only the description also reproduced the reversal.

---

## BUG-1067 — An existing task can be saved with a blank title

- **Defect ID:** BUG-1067
- **Status:** Open
- **Reported:** 2026-10-20
- **Observed in:** Edit task form and task list
- **Environment:** Tasklane demo, current desktop browser, default viewport
- **Frequency:** Every time
- **Related reports:** None confirmed

### Expected behavior

A task title is required in both the create and edit flows. Clearing the title or entering only whitespace and saving should keep the form open and show a title validation error.

### Observed behavior

When editing an existing task, a blank or whitespace-only title can be saved. The form closes without an error and the task appears as a blank row. Opening its details shows no title.

### Steps to reproduce

1. Reset the demo data.
2. Find **Add an empty state to the project list**.
3. Choose **Edit**.
4. Clear the **Title** field, or replace its contents with spaces.
5. Choose **Save changes**.
6. Inspect the row that previously represented the task.

### User impact

A required field can be removed, leaving an unidentifiable task that is difficult to select or manage. The edit flow is inconsistent with creation, where an empty title is rejected.

### Additional context

- The same blank title is rejected in the create form.
- Whitespace-only titles also save in the edit form.
- The change persists after a page refresh.
