# Forgeboard — Product brief

> Source of truth for **expected product behaviour**. It describes what the
> product does for people, not how the code is arranged. Use it to check your
> findings, not as a substitute for reading the repository.

## Purpose

Forgeboard is the internal project tracker used to keep delivery work legible:
who owns a project, what is in flight, how much effort is done, and what has
changed recently.

This brief describes intended product behavior. It is deliberately not an
implementation guide; use the repository and a running build to verify how the
product actually works.

## Audience and access

- Everyone in the organization can view every project, task, and activity entry.
- A project has one **lead** and a set of **members**.
- Project members can contribute tasks while the project is editable.
- The project lead is the only person who can manage project-level state:
  moving the project through its lifecycle, archiving it, and restoring it.
- For the prototype, there is no sign-in. A demo identity switcher lets someone
  act as one of the seeded teammates. Every action is attributed to the
  currently selected identity.
- The prototype is disposable: its demo data returns to the same seeded state
  whenever the API process is restarted.

## Core objects

### Project

A project is the top-level container for a body of work. It has a short key,
name, description, status, lead, membership, and an optional archived state.
Every member of the organization can open it.

### Task

A task belongs to exactly one project. It has a title, optional description, a
positive whole-number effort estimate, a workflow status, and an optional
assignee. An assignee must be a member of that project.

### Activity entry

The project keeps an append-only activity history of meaningful changes. Entries
identify the actor, the time, and enough context to understand what happened.
Activity is displayed with the newest entry first.

## Project lifecycle

The normal lifecycle is:

`planning → active ↔ paused → completed → active (reopen)`

Product rules:

1. A planning project can be started.
2. An active project can be paused.
3. A paused project can be resumed.
4. An active or paused project can be completed only when every task is done,
   cancelled, or absent.
5. A completed project is read-only until the lead reopens it. Reopening returns
   it to active.
6. Only the project lead may change project status.

### Archiving

Archiving is a separate action from the normal lifecycle. It is a way to remove
settled work from the active workspace without deleting its history.

- A project can be archived only after it is completed and has no open tasks.
- Only the project lead can archive or restore a project.
- Archived projects are excluded from the default project list but remain
  discoverable through an explicit archived/complete view.
- Archived projects are read-only. Restoring a project makes it visible again
  but does not reopen it; its lifecycle status is preserved.
- Archive and restore actions are recorded in activity.

## Task workflow

The task statuses are **Not started**, **In progress**, **Done**, and
**Cancelled**. The allowed moves are:

| From | Allowed next states |
| --- | --- |
| Not started | In progress, Cancelled |
| In progress | Not started, Done, Cancelled |
| Done | In progress (reopen) |
| Cancelled | Not started |

Task editing rules:

- Project members can add tasks and change task status while the project is in
  planning, active, or paused.
- Nobody can edit tasks while the project is completed or archived. The lead must
  reopen or restore the project first.
- New tasks start as **Not started** and may be left unassigned.
- Cancelled tasks are intentionally preserved; they are not deleted.
- Invalid moves should be rejected with a clear explanation rather than silently
  coerced.

## Progress

Progress communicates completed effort, not task counts.

- Every non-cancelled task contributes its estimate to the project's total
  effort.
- A done task contributes its estimate to completed effort.
- Cancelled tasks remain visible in task counts but are excluded from both the
  completed and total effort figures.
- Progress is shown as a whole-number percentage and as completed effort out of
  total effort.
- An empty project, or a project with only cancelled tasks, shows 0% progress.

## Project list

- The default view shows current projects and omits archived projects.
- A filter makes archived projects visible alongside current projects.
- Each project card should make the name, key, current lifecycle status,
  progress, lead, membership size, and open-task count readable.
- Archived projects should be clearly distinguished from current ones.
- Loading, empty, and failure states should be explicit and should not look like
  a blank workspace.

## Project detail

The project page is the working surface for a single project. It should provide:

- Project identity: key, name, description, status, lead, and membership.
- Current progress and a breakdown of open, done, and cancelled tasks.
- The actions available to the current identity, such as lifecycle changes,
  archive/restore, adding a task, or moving a task.
- The task list with assignee, estimate, status, and only the transitions that
  make sense from the task's current state.
- A member directory.
- Recent activity with actor and timestamp.

After any successful action, the displayed project should reflect the new
status, progress, tasks, and activity without requiring a full page reload.
Unavailable actions should not be presented as if they will succeed; the server
must still reject invalid requests with a useful error.

## Out of scope

- Real authentication, invitations, or organization management.
- Creating, renaming, or deleting whole projects.
- Comments, mentions, attachments, subtasks, or notifications.
- Time tracking in hours; estimates are relative effort points.
- Editing or deleting activity history.
- Durable multi-user storage beyond the prototype sandbox.
