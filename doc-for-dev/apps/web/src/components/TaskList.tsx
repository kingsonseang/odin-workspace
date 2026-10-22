import type { TaskDto, TaskStatus } from "@forgeboard/shared";
import { TASK_STATUS_LABELS } from "@forgeboard/shared";
import { InitialsAvatar } from "./InitialsAvatar";
import { TaskStatusBadge } from "./StatusBadge";

interface TaskListProps {
  tasks: TaskDto[];
  disabled?: boolean;
  onTransition: (taskId: string, status: TaskStatus) => void;
}

function transitionLabel(from: TaskStatus, to: TaskStatus): string {
  if (to === "done") {
    return "Mark done";
  }
  if (to === "cancelled") {
    return "Cancel";
  }
  if (to === "in_progress") {
    return from === "done" ? "Reopen" : "Start";
  }
  if (to === "todo") {
    return from === "cancelled" ? "Restore" : "Move to not started";
  }
  return `Move to ${TASK_STATUS_LABELS[to]}`;
}

export function TaskList({
  tasks,
  disabled = false,
  onTransition
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="empty-copy">
        No tasks yet. Add the first piece of work for this project.
      </p>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`task-row ${task.status === "done" || task.status === "cancelled" ? "task-row--settled" : ""}`}
        >
          <div className="task-row__main">
            <div className="task-row__title-line">
              <TaskStatusBadge status={task.status} />
              <h3>{task.title}</h3>
            </div>
            {task.description && (
              <p className="task-row__description">{task.description}</p>
            )}
            <div className="task-row__meta">
              {task.assignee ? (
                <span className="task-row__assignee">
                  <InitialsAvatar user={task.assignee} size="sm" />
                  {task.assignee.name}
                </span>
              ) : (
                <span className="task-row__assignee task-row__assignee--empty">
                  Unassigned
                </span>
              )}
              <span>{task.estimate} effort points</span>
            </div>
          </div>

          {task.allowedStatusTransitions.length > 0 && (
            <div className="task-row__actions">
              {task.allowedStatusTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="button button--tiny"
                  disabled={disabled}
                  onClick={() => onTransition(task.id, status)}
                >
                  {transitionLabel(task.status, status)}
                </button>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
