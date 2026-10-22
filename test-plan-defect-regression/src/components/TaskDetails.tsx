import type { Task } from '../types';
import { formatDate, formatTimestamp } from '../lib/dates';
import { PriorityBadge, StatusBadge } from './Badges';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetails({ task, onClose, onEdit }: TaskDetailsProps) {
  return (
    <aside className="details-panel" aria-label="Task details">
      <div className="details-panel__header">
        <p className="eyebrow">Task details</p>
        <button
          type="button"
          className="icon-button"
          aria-label="Close task details"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <h2 className="details-panel__title">{task.title}</h2>
      <p className="details-panel__description">
        {task.description || 'No description.'}
      </p>

      <dl className="details-list">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={task.status} />
          </dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <PriorityBadge priority={task.priority} />
          </dd>
        </div>
        <div>
          <dt>Assignee</dt>
          <dd>{task.assignee ?? 'Unassigned'}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatTimestamp(task.createdAt)}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatTimestamp(task.updatedAt)}</dd>
        </div>
      </dl>

      <button type="button" className="button button--primary" onClick={() => onEdit(task)}>
        Edit task
      </button>
    </aside>
  );
}
