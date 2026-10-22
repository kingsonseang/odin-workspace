import type { Task } from '../types';
import { formatDate, isOverdue } from '../lib/dates';
import { PriorityBadge, StatusBadge } from './Badges';

interface TaskRowProps {
  task: Task;
  onOpen: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({
  task,
  onOpen,
  onToggleCompletion,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const done = task.status === 'done';
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <li
      className={`task-row${done ? ' task-row--done' : ''}`}
      data-testid="task-row"
    >
      <div className="task-row__checkbox">
        <input
          type="checkbox"
          checked={done}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
          onChange={() => onToggleCompletion(task.id)}
        />
      </div>

      <div className="task-row__body">
        <div className="task-row__headline">
          <button type="button" className="task-title" onClick={() => onOpen(task)}>
            {task.title}
          </button>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="task-row__description">{task.description || 'No description.'}</p>
        <div className="task-row__meta">
          <StatusBadge status={task.status} />
          <span>{task.assignee ? `Assigned to ${task.assignee}` : 'Unassigned'}</span>
          <span className={overdue ? 'due-date due-date--overdue' : 'due-date'}>
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
            {overdue ? <em>Overdue</em> : null}
          </span>
        </div>
      </div>

      <div className="task-row__actions">
        <button
          type="button"
          className="text-button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          Edit
        </button>
        <button
          type="button"
          className="text-button text-button--danger"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
