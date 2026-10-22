export const PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed"
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "cancelled"
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  paused: "Paused",
  completed: "Completed"
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Not started",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled"
};

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
  );
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}
