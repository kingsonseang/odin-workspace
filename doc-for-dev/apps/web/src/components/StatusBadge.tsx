import type { ProjectStatus, TaskStatus } from "@forgeboard/shared";
import {
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS
} from "@forgeboard/shared";

export function ProjectStatusBadge({
  status
}: {
  status: ProjectStatus;
}) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`task-status task-status--${status}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
