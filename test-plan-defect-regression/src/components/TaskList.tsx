import type { Task } from '../types';
import { TaskRow } from './TaskRow';

interface TaskListProps {
  tasks: Task[];
  hasAnyTasks: boolean;
  hasActiveFilters: boolean;
  onOpen: (task: Task) => void;
  onToggleCompletion: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClearFilters: () => void;
}

export function TaskList({
  tasks,
  hasAnyTasks,
  hasActiveFilters,
  onOpen,
  onToggleCompletion,
  onEdit,
  onDelete,
  onClearFilters,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h3>{hasAnyTasks ? 'No tasks match these filters' : 'No tasks yet'}</h3>
        <p>
          {hasAnyTasks
            ? 'Try a different search or reset the filters to see the full board.'
            : 'Create a task to start planning the next piece of work.'}
        </p>
        {hasAnyTasks && hasActiveFilters ? (
          <button type="button" className="button button--quiet" onClick={onClearFilters}>
            Clear filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onOpen={onOpen}
          onToggleCompletion={onToggleCompletion}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
