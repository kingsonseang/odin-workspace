import type {
  Activity,
  Project,
  Task,
  User
} from "@forgeboard/domain";

export interface SeedData {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

export function createSeedData(): SeedData {
  const users: User[] = [
    {
      id: "usr_ada",
      name: "Ada Park",
      title: "Staff Engineer"
    },
    {
      id: "usr_ben",
      name: "Ben Okafor",
      title: "Product Designer"
    },
    {
      id: "usr_cy",
      name: "Cyra Raman",
      title: "Backend Engineer"
    },
    {
      id: "usr_diya",
      name: "Diya Shah",
      title: "Quality Engineer"
    }
  ];

  const projects: Project[] = [
    {
      id: "prj_checkout",
      key: "CHK",
      name: "Checkout recovery",
      description:
        "Reduce failed-payment dead ends across web checkout and make recovery paths measurable.",
      status: "active",
      leadId: "usr_ada",
      memberIds: ["usr_ada", "usr_ben", "usr_cy"],
      createdAt: "2026-08-04T09:00:00.000Z",
      updatedAt: "2026-10-18T17:30:00.000Z",
      archivedAt: null
    },
    {
      id: "prj_push",
      key: "PUSH",
      name: "Push delivery v2",
      description:
        "Move transactional notifications onto the new delivery service without losing device coverage.",
      status: "paused",
      leadId: "usr_cy",
      memberIds: ["usr_cy", "usr_diya"],
      createdAt: "2026-07-22T14:10:00.000Z",
      updatedAt: "2026-10-09T10:30:00.000Z",
      archivedAt: null
    },
    {
      id: "prj_billing",
      key: "BILL",
      name: "Billing cutover",
      description:
        "Retire the legacy invoicing job ahead of the Q4 renewal window.",
      status: "planning",
      leadId: "usr_diya",
      memberIds: ["usr_diya", "usr_ada"],
      createdAt: "2026-09-15T11:00:00.000Z",
      updatedAt: "2026-10-12T08:45:00.000Z",
      archivedAt: null
    },
    {
      id: "prj_a11y",
      key: "A11Y",
      name: "Accessibility sweep",
      description:
        "Close the highest-impact WCAG gaps in the internal console before the external audit.",
      status: "completed",
      leadId: "usr_ben",
      memberIds: ["usr_ben", "usr_cy", "usr_ada"],
      createdAt: "2026-06-10T13:00:00.000Z",
      updatedAt: "2026-09-30T16:00:00.000Z",
      archivedAt: null
    },
    {
      id: "prj_tokens",
      key: "DS",
      name: "Design tokens 2.0",
      description:
        "Consolidate colour and spacing decisions into one versioned token package.",
      status: "completed",
      leadId: "usr_ada",
      memberIds: ["usr_ada", "usr_ben"],
      createdAt: "2026-04-02T08:30:00.000Z",
      updatedAt: "2026-08-21T09:30:00.000Z",
      archivedAt: "2026-08-21T09:30:00.000Z"
    }
  ];

  const tasks: Task[] = [
    {
      id: "tsk_chk_retry",
      projectId: "prj_checkout",
      title: "Instrument retry outcomes",
      description:
        "Emit one event per recovery attempt, including the payment method and final outcome.",
      estimate: 8,
      status: "done",
      assigneeId: "usr_cy",
      createdAt: "2026-08-05T15:10:00.000Z",
      updatedAt: "2026-10-16T16:20:00.000Z"
    },
    {
      id: "tsk_chk_wallet",
      projectId: "prj_checkout",
      title: "Add wallet fallback path",
      description:
        "Offer a wallet retry when the original card authorization expires.",
      estimate: 5,
      status: "in_progress",
      assigneeId: "usr_ben",
      createdAt: "2026-08-18T10:25:00.000Z",
      updatedAt: "2026-10-14T16:20:00.000Z"
    },
    {
      id: "tsk_chk_copy",
      projectId: "prj_checkout",
      title: "Write recovery copy",
      description:
        "Replace generic failure language with a short explanation and a clear next action.",
      estimate: 3,
      status: "todo",
      assigneeId: "usr_ben",
      createdAt: "2026-09-02T13:45:00.000Z",
      updatedAt: "2026-09-02T13:45:00.000Z"
    },
    {
      id: "tsk_chk_tax",
      projectId: "prj_checkout",
      title: "Audit tax edge cases",
      description:
        "Confirm that retry attempts do not duplicate tax holds for partially settled orders.",
      estimate: 2,
      status: "cancelled",
      assigneeId: "usr_ada",
      createdAt: "2026-08-21T09:30:00.000Z",
      updatedAt: "2026-10-01T11:05:00.000Z"
    },
    {
      id: "tsk_chk_load",
      projectId: "prj_checkout",
      title: "Load test at 2x peak",
      description:
        "Exercise the recovery endpoint with twice the highest observed peak-hour traffic.",
      estimate: 5,
      status: "done",
      assigneeId: "usr_cy",
      createdAt: "2026-09-12T08:00:00.000Z",
      updatedAt: "2026-10-08T13:40:00.000Z"
    },
    {
      id: "tsk_chk_flag",
      projectId: "prj_checkout",
      title: "Remove legacy retry flag",
      description:
        "Delete the old server-side flag once every client is reading the recovery policy.",
      estimate: 2,
      status: "todo",
      assigneeId: null,
      createdAt: "2026-10-02T10:00:00.000Z",
      updatedAt: "2026-10-02T10:00:00.000Z"
    },
    {
      id: "tsk_push_map",
      projectId: "prj_push",
      title: "Map retry semantics",
      description:
        "Document which delivery failures are retried, dropped, or surfaced to the sender.",
      estimate: 3,
      status: "done",
      assigneeId: "usr_cy",
      createdAt: "2026-07-25T10:00:00.000Z",
      updatedAt: "2026-08-14T15:30:00.000Z"
    },
    {
      id: "tsk_push_ios",
      projectId: "prj_push",
      title: "Migrate iOS certificate path",
      description:
        "Replace the legacy certificate upload with the delivery service's key-based credentials.",
      estimate: 8,
      status: "in_progress",
      assigneeId: "usr_diya",
      createdAt: "2026-08-02T12:15:00.000Z",
      updatedAt: "2026-09-28T14:00:00.000Z"
    },
    {
      id: "tsk_push_backfill",
      projectId: "prj_push",
      title: "Backfill device tokens",
      description:
        "Load existing tokens into the new service and reconcile invalid registrations.",
      estimate: 5,
      status: "todo",
      assigneeId: "usr_cy",
      createdAt: "2026-09-04T09:45:00.000Z",
      updatedAt: "2026-09-04T09:45:00.000Z"
    },
    {
      id: "tsk_push_runbook",
      projectId: "prj_push",
      title: "Draft rollback runbook",
      description:
        "Give on-call a tested path back to the previous provider if delivery rates fall.",
      estimate: 2,
      status: "done",
      assigneeId: "usr_diya",
      createdAt: "2026-08-11T11:10:00.000Z",
      updatedAt: "2026-09-19T16:45:00.000Z"
    },
    {
      id: "tsk_bill_jobs",
      projectId: "prj_billing",
      title: "Inventory legacy jobs",
      description:
        "List every scheduled invoicing job and its current owner.",
      estimate: 5,
      status: "todo",
      assigneeId: "usr_ada",
      createdAt: "2026-09-18T09:30:00.000Z",
      updatedAt: "2026-09-18T09:30:00.000Z"
    },
    {
      id: "tsk_bill_rehearsal",
      projectId: "prj_billing",
      title: "Define cutover rehearsal",
      description:
        "Agree the data snapshot, validation steps, and go/no-go owner for a rehearsal.",
      estimate: 3,
      status: "todo",
      assigneeId: "usr_diya",
      createdAt: "2026-09-23T14:00:00.000Z",
      updatedAt: "2026-09-23T14:00:00.000Z"
    },
    {
      id: "tsk_bill_signoff",
      projectId: "prj_billing",
      title: "Confirm finance sign-off",
      description:
        "Get written approval for the reconciliation report and final invoicing date.",
      estimate: 2,
      status: "todo",
      assigneeId: "usr_diya",
      createdAt: "2026-10-01T10:20:00.000Z",
      updatedAt: "2026-10-01T10:20:00.000Z"
    },
    {
      id: "tsk_a11y_focus",
      projectId: "prj_a11y",
      title: "Remediate focus traps",
      description:
        "Fix the three dialogs that do not return focus to their trigger when closed.",
      estimate: 5,
      status: "done",
      assigneeId: "usr_cy",
      createdAt: "2026-06-12T09:00:00.000Z",
      updatedAt: "2026-09-26T12:10:00.000Z"
    },
    {
      id: "tsk_a11y_contrast",
      projectId: "prj_a11y",
      title: "Run colour contrast audit",
      description:
        "Check all shared surfaces against the 4.5:1 body text threshold.",
      estimate: 3,
      status: "done",
      assigneeId: "usr_ben",
      createdAt: "2026-06-20T11:30:00.000Z",
      updatedAt: "2026-09-18T15:00:00.000Z"
    },
    {
      id: "tsk_a11y_reader",
      projectId: "prj_a11y",
      title: "Screen reader smoke test",
      description:
        "Walk the project and task flows with VoiceOver and record blocking issues.",
      estimate: 5,
      status: "done",
      assigneeId: "usr_ada",
      createdAt: "2026-08-05T13:15:00.000Z",
      updatedAt: "2026-09-29T17:20:00.000Z"
    },
    {
      id: "tsk_a11y_upstream",
      projectId: "prj_a11y",
      title: "File upstream component bugs",
      description:
        "Send confirmed design-system defects to the shared component maintainers.",
      estimate: 2,
      status: "cancelled",
      assigneeId: "usr_cy",
      createdAt: "2026-08-19T10:00:00.000Z",
      updatedAt: "2026-09-22T09:40:00.000Z"
    },
    {
      id: "tsk_tok_spacing",
      projectId: "prj_tokens",
      title: "Publish spacing scale",
      description:
        "Release the new four-pixel spacing scale and document its migration aliases.",
      estimate: 5,
      status: "done",
      assigneeId: "usr_ada",
      createdAt: "2026-04-05T09:00:00.000Z",
      updatedAt: "2026-08-12T11:30:00.000Z"
    },
    {
      id: "tsk_tok_migrate",
      projectId: "prj_tokens",
      title: "Migrate marketing pages",
      description:
        "Replace hard-coded spacing values on the highest-traffic public pages.",
      estimate: 8,
      status: "done",
      assigneeId: "usr_ben",
      createdAt: "2026-05-02T14:20:00.000Z",
      updatedAt: "2026-08-19T16:00:00.000Z"
    },
    {
      id: "tsk_tok_cleanup",
      projectId: "prj_tokens",
      title: "Delete legacy variables",
      description:
        "Remove deprecated token names after the migration window closes.",
      estimate: 2,
      status: "cancelled",
      assigneeId: "usr_ada",
      createdAt: "2026-06-10T10:10:00.000Z",
      updatedAt: "2026-08-15T13:20:00.000Z"
    }
  ];

  const activities: Activity[] = [
    {
      id: "act_chk_001",
      projectId: "prj_checkout",
      actorId: "usr_ada",
      createdAt: "2026-08-05T15:10:00.000Z",
      kind: "task.created",
      taskId: "tsk_chk_retry"
    },
    {
      id: "act_chk_002",
      projectId: "prj_checkout",
      actorId: "usr_ada",
      createdAt: "2026-08-12T09:15:00.000Z",
      kind: "project.status_changed",
      from: "planning",
      to: "active"
    },
    {
      id: "act_chk_003",
      projectId: "prj_checkout",
      actorId: "usr_ada",
      createdAt: "2026-09-12T08:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_chk_load"
    },
    {
      id: "act_chk_004",
      projectId: "prj_checkout",
      actorId: "usr_ada",
      createdAt: "2026-10-01T11:05:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_chk_tax",
      from: "todo",
      to: "cancelled"
    },
    {
      id: "act_chk_005",
      projectId: "prj_checkout",
      actorId: "usr_ada",
      createdAt: "2026-10-02T10:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_chk_flag"
    },
    {
      id: "act_chk_006",
      projectId: "prj_checkout",
      actorId: "usr_cy",
      createdAt: "2026-10-08T13:40:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_chk_load",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_chk_007",
      projectId: "prj_checkout",
      actorId: "usr_ben",
      createdAt: "2026-10-14T16:20:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_chk_wallet",
      from: "todo",
      to: "in_progress"
    },
    {
      id: "act_chk_008",
      projectId: "prj_checkout",
      actorId: "usr_cy",
      createdAt: "2026-10-16T16:20:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_chk_retry",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_push_001",
      projectId: "prj_push",
      actorId: "usr_cy",
      createdAt: "2026-07-25T10:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_push_map"
    },
    {
      id: "act_push_002",
      projectId: "prj_push",
      actorId: "usr_diya",
      createdAt: "2026-08-11T11:10:00.000Z",
      kind: "task.created",
      taskId: "tsk_push_runbook"
    },
    {
      id: "act_push_003",
      projectId: "prj_push",
      actorId: "usr_cy",
      createdAt: "2026-08-14T15:30:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_push_map",
      from: "todo",
      to: "done"
    },
    {
      id: "act_push_004",
      projectId: "prj_push",
      actorId: "usr_diya",
      createdAt: "2026-09-19T16:45:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_push_runbook",
      from: "todo",
      to: "done"
    },
    {
      id: "act_push_005",
      projectId: "prj_push",
      actorId: "usr_diya",
      createdAt: "2026-09-28T14:00:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_push_ios",
      from: "todo",
      to: "in_progress"
    },
    {
      id: "act_push_006",
      projectId: "prj_push",
      actorId: "usr_cy",
      createdAt: "2026-10-09T10:30:00.000Z",
      kind: "project.status_changed",
      from: "active",
      to: "paused"
    },
    {
      id: "act_bill_001",
      projectId: "prj_billing",
      actorId: "usr_diya",
      createdAt: "2026-09-18T09:30:00.000Z",
      kind: "task.created",
      taskId: "tsk_bill_jobs"
    },
    {
      id: "act_bill_002",
      projectId: "prj_billing",
      actorId: "usr_diya",
      createdAt: "2026-09-23T14:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_bill_rehearsal"
    },
    {
      id: "act_bill_003",
      projectId: "prj_billing",
      actorId: "usr_diya",
      createdAt: "2026-10-01T10:20:00.000Z",
      kind: "task.created",
      taskId: "tsk_bill_signoff"
    },
    {
      id: "act_a11y_001",
      projectId: "prj_a11y",
      actorId: "usr_cy",
      createdAt: "2026-06-12T09:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_a11y_focus"
    },
    {
      id: "act_a11y_002",
      projectId: "prj_a11y",
      actorId: "usr_ben",
      createdAt: "2026-09-18T15:00:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_a11y_contrast",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_a11y_003",
      projectId: "prj_a11y",
      actorId: "usr_cy",
      createdAt: "2026-09-22T09:40:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_a11y_upstream",
      from: "todo",
      to: "cancelled"
    },
    {
      id: "act_a11y_004",
      projectId: "prj_a11y",
      actorId: "usr_cy",
      createdAt: "2026-09-26T12:10:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_a11y_focus",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_a11y_005",
      projectId: "prj_a11y",
      actorId: "usr_ada",
      createdAt: "2026-09-29T17:20:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_a11y_reader",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_a11y_006",
      projectId: "prj_a11y",
      actorId: "usr_ben",
      createdAt: "2026-09-30T16:00:00.000Z",
      kind: "project.status_changed",
      from: "active",
      to: "completed"
    },
    {
      id: "act_tok_001",
      projectId: "prj_tokens",
      actorId: "usr_ada",
      createdAt: "2026-04-05T09:00:00.000Z",
      kind: "task.created",
      taskId: "tsk_tok_spacing"
    },
    {
      id: "act_tok_002",
      projectId: "prj_tokens",
      actorId: "usr_ada",
      createdAt: "2026-08-15T13:20:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_tok_cleanup",
      from: "todo",
      to: "cancelled"
    },
    {
      id: "act_tok_003",
      projectId: "prj_tokens",
      actorId: "usr_ben",
      createdAt: "2026-08-19T16:00:00.000Z",
      kind: "task.status_changed",
      taskId: "tsk_tok_migrate",
      from: "in_progress",
      to: "done"
    },
    {
      id: "act_tok_004",
      projectId: "prj_tokens",
      actorId: "usr_ada",
      createdAt: "2026-08-20T14:00:00.000Z",
      kind: "project.status_changed",
      from: "active",
      to: "completed"
    },
    {
      id: "act_tok_005",
      projectId: "prj_tokens",
      actorId: "usr_ada",
      createdAt: "2026-08-21T09:30:00.000Z",
      kind: "project.archived"
    }
  ];

  return { users, projects, tasks, activities };
}
