import type { SortOption, TaskFilters } from '../types';

interface TaskToolbarProps {
  filters: TaskFilters;
  sort: SortOption;
  hasActiveFilters: boolean;
  onFiltersChange: (patch: Partial<TaskFilters>) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
}

export function TaskToolbar({
  filters,
  sort,
  hasActiveFilters,
  onFiltersChange,
  onSortChange,
  onClearFilters,
}: TaskToolbarProps) {
  return (
    <section className="toolbar" aria-label="Task filters and sorting">
      <div className="field field--search">
        <label htmlFor="task-search">Search tasks</label>
        <input
          id="task-search"
          type="search"
          value={filters.search}
          placeholder="Search title or description"
          onChange={(event) => onFiltersChange({ search: event.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              status: event.target.value as TaskFilters['status'],
            })
          }
        >
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="priority-filter">Priority</label>
        <select
          id="priority-filter"
          value={filters.priority}
          onChange={(event) =>
            onFiltersChange({
              priority: event.target.value as TaskFilters['priority'],
            })
          }
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="sort-order">Sort by</label>
        <select
          id="sort-order"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
        >
          <option value="created-desc">Newest first</option>
          <option value="title-asc">Title A–Z</option>
          <option value="priority-desc">Priority (urgent first)</option>
          <option value="due-asc">Due date (soonest first)</option>
        </select>
      </div>

      {hasActiveFilters ? (
        <button type="button" className="button button--quiet" onClick={onClearFilters}>
          Clear filters
        </button>
      ) : null}
    </section>
  );
}
