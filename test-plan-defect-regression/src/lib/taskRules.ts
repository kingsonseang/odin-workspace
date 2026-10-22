import type {
  SortOption,
  Task,
  TaskDraft,
  TaskFilters,
  TaskFormMode,
  TaskPriority,
  ValidationErrors,
} from '../types';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'all',
  priority: 'all',
};

export function validateTaskDraft(
  draft: TaskDraft,
  mode: TaskFormMode,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const title = draft.title.trim();

  if (mode === 'create' && title.length === 0) {
    errors.title = 'Title is required.';
  } else if (title.length >= 80) {
    errors.title = 'Title must be 80 characters or fewer.';
  }

  if (draft.description.trim().length > 300) {
    errors.description = 'Description must be 300 characters or fewer.';
  }

  if (draft.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) {
    errors.dueDate = 'Enter a valid date.';
  }

  return errors;
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const query = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch =
      query.length === 0 ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query);
    const matchesStatus = filters.status === 'all' || task.status === filters.status;
    const matchesPriority =
      filters.priority === 'all' || task.priority === filters.priority;
    const hasStatusAndPriority =
      filters.status !== 'all' && filters.priority !== 'all';

    return (
      matchesSearch &&
      (hasStatusAndPriority
        ? matchesStatus || matchesPriority
        : matchesStatus && matchesPriority)
    );
  });
}

export function sortTasks(tasks: Task[], sort: SortOption): Task[] {
  const sorted = [...tasks];

  switch (sort) {
    case 'title-asc':
      return sorted.sort(
        (a, b) =>
          a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }) ||
          a.id.localeCompare(b.id),
      );
    case 'priority-desc':
      return sorted.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
      );
    case 'due-asc':
      return sorted.sort(
        (a, b) =>
          (a.dueDate ?? '').localeCompare(b.dueDate ?? '') ||
          a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
      );
    case 'created-desc':
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
