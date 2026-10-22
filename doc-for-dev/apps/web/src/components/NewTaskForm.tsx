import { useState, type FormEvent } from "react";
import type { CreateTaskRequest, UserDto } from "@forgeboard/shared";

interface NewTaskFormProps {
  members: UserDto[];
  currentUser: UserDto;
  disabled?: boolean;
  onCreate: (input: CreateTaskRequest) => Promise<boolean>;
}

const ESTIMATE_OPTIONS = [1, 2, 3, 5, 8, 13];

export function NewTaskForm({
  members,
  currentUser,
  disabled = false,
  onCreate
}: NewTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimate, setEstimate] = useState(3);
  const [assigneeId, setAssigneeId] = useState(currentUser.id);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openForm() {
    const defaultAssignee = members.some(
      (member) => member.id === currentUser.id
    )
      ? currentUser.id
      : (members[0]?.id ?? "");
    setAssigneeId(defaultAssignee);
    setTitle("");
    setDescription("");
    setEstimate(3);
    setLocalError(null);
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
    setLocalError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length === 0) {
      setLocalError("Give the task a short, descriptive title.");
      return;
    }

    setLocalError(null);
    setIsSubmitting(true);
    try {
      const success = await onCreate({
        title: title.trim(),
        description: description.trim(),
        estimate,
        assigneeId: assigneeId || null
      });
      if (success) {
        closeForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        className="button button--secondary"
        type="button"
        onClick={openForm}
        disabled={disabled}
      >
        <span aria-hidden="true">＋</span> Add task
      </button>
    );
  }

  return (
    <form className="new-task-form" onSubmit={handleSubmit}>
      <div className="new-task-form__heading">
        <div>
          <p className="eyebrow">New work item</p>
          <h3>Add a task</h3>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Close task form"
          onClick={closeForm}
        >
          ×
        </button>
      </div>

      <label className="field field--wide">
        <span>Title</span>
        <input
          autoFocus
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to happen?"
          disabled={isSubmitting}
        />
      </label>

      <label className="field field--wide">
        <span>Description <em>optional</em></span>
        <textarea
          maxLength={500}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add context or a definition of done."
          disabled={isSubmitting}
        />
      </label>

      <label className="field">
        <span>Effort estimate</span>
        <select
          value={estimate}
          onChange={(event) => setEstimate(Number(event.target.value))}
          disabled={isSubmitting}
        >
          {ESTIMATE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? "point" : "points"}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Assignee</span>
        <select
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>

      {localError && <p className="form-error">{localError}</p>}

      <div className="new-task-form__actions">
        <button
          className="button button--ghost"
          type="button"
          onClick={closeForm}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          className="button button--primary"
          type="submit"
          disabled={isSubmitting || disabled}
        >
          {isSubmitting ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
}
