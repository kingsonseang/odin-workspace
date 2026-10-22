import { useEffect, useState, type FormEvent } from 'react';
import type { Task, TaskDraft, TaskFormMode, ValidationErrors } from '../types';
import { validateTaskDraft } from '../lib/taskRules';

interface TaskFormDialogProps {
  mode: TaskFormMode;
  initialTask?: Task;
  onSave: (draft: TaskDraft) => void;
  onClose: () => void;
}

function toDraft(task?: Task): TaskDraft {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    assignee: task?.assignee ?? '',
    dueDate: task?.dueDate ?? '',
  };
}

export function TaskFormDialog({
  mode,
  initialTask,
  onSave,
  onClose,
}: TaskFormDialogProps) {
  const [draft, setDraft] = useState<TaskDraft>(() => toDraft(initialTask));
  const [errors, setErrors] = useState<ValidationErrors>({});
  const heading = mode === 'create' ? 'New task' : 'Edit task';
  const submitLabel = mode === 'create' ? 'Create task' : 'Save changes';

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function updateField<K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTaskDraft(draft, mode);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave(draft);
  }

  return (
    <div className="modal-backdrop">
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-heading"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">{mode === 'create' ? 'Add to the board' : 'Update task'}</p>
            <h2 id="task-form-heading">{heading}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="form-grid">
          <div className="field field--full">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              value={draft.title}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'task-title-error' : 'task-title-hint'}
              autoFocus
              onChange={(event) => updateField('title', event.target.value)}
            />
            <p id="task-title-hint" className="field-hint">
              Use 1–80 characters.
            </p>
            {errors.title ? (
              <p id="task-title-error" className="field-error" role="alert">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="field field--full">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              rows={4}
              value={draft.description}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? 'task-description-error' : 'task-description-count'
              }
              onChange={(event) => updateField('description', event.target.value)}
            />
            <p id="task-description-count" className="field-hint">
              {draft.description.length} / 300 characters
            </p>
            {errors.description ? (
              <p id="task-description-error" className="field-error" role="alert">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="task-status">Status</label>
            <select
              id="task-status"
              value={draft.status}
              onChange={(event) =>
                updateField('status', event.target.value as TaskDraft['status'])
              }
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={draft.priority}
              onChange={(event) =>
                updateField('priority', event.target.value as TaskDraft['priority'])
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
              value={draft.assignee}
              onChange={(event) => updateField('assignee', event.target.value)}
            >
              <option value="">Unassigned</option>
              <option value="Avery">Avery</option>
              <option value="Jordan">Jordan</option>
              <option value="Morgan">Morgan</option>
              <option value="Riley">Riley</option>
              <option value="Sam">Sam</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              type="date"
              value={draft.dueDate}
              aria-invalid={Boolean(errors.dueDate)}
              aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
            {errors.dueDate ? (
              <p id="task-due-date-error" className="field-error" role="alert">
                {errors.dueDate}
              </p>
            ) : null}
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="button button--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button button--primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
