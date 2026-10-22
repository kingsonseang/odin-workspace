import { useMemo, useState } from 'react';
import type { Task, TaskDraft, TaskFilters, TaskFormMode, SortOption } from '../types';
import { DEFAULT_FILTERS, filterTasks, sortTasks } from '../lib/taskRules';
import {
  createTask,
  loadTasks,
  removeTask,
  resetTasks,
  saveTasks,
  toggleTaskCompletion,
  updateTask,
} from '../services/taskService';
import { ConfirmDialog } from './ConfirmDialog';
import { TaskDetails } from './TaskDetails';
import { TaskFormDialog } from './TaskFormDialog';
import { TaskList } from './TaskList';
import { TaskToolbar } from './TaskToolbar';

interface FormState {
  mode: TaskFormMode;
  task?: Task;
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>('created-desc');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);

  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(tasks, filters), sort),
    [tasks, filters, sort],
  );

  const counts = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
    }),
    [tasks],
  );

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all';

  function commit(nextTasks: Task[]) {
    setTasks(nextTasks);
    saveTasks(nextTasks);
  }

  function handleFiltersChange(patch: Partial<TaskFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  function handleToggleCompletion(taskId: string) {
    commit(toggleTaskCompletion(tasks, taskId));
  }

  function handleSave(draft: TaskDraft) {
    if (!formState) {
      return;
    }

    if (formState.mode === 'create') {
      commit(createTask(tasks, draft));
    } else if (formState.task) {
      const nextTasks = updateTask(tasks, formState.task.id, draft);
      commit(nextTasks);

      if (selectedTask?.id === formState.task.id) {
        setSelectedTask(nextTasks.find((task) => task.id === formState.task?.id) ?? null);
      }
    }

    setFormState(null);
  }

  function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    commit(removeTask(tasks, pendingDelete.id));

    if (selectedTask?.id === pendingDelete.id) {
      setSelectedTask(null);
    }

    setPendingDelete(null);
  }

  function handleResetDemoData() {
    setTasks(resetTasks());
    setSelectedTask(null);
    setFormState(null);
    setPendingDelete(null);
    setFilters(DEFAULT_FILTERS);
    setSort('created-desc');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            T
          </span>
          <div>
            <p className="brand__name">Tasklane</p>
            <p className="brand__tagline">Small team work, clearly tracked.</p>
          </div>
        </div>
        <div className="project-chip">
          <span>Project</span>
          <strong>Website Refresh</strong>
        </div>
      </header>

      <main className="app-main">
        <section className="board-intro" aria-labelledby="board-heading">
          <div>
            <p className="eyebrow">Workspace / Website Refresh</p>
            <h1 id="board-heading">Task board</h1>
            <p className="board-intro__copy">
              Review delivery work, keep ownership visible, and focus the list without
              leaving the page.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary button--large"
            onClick={() => setFormState({ mode: 'create' })}
          >
            New task
          </button>
        </section>

        <section className="summary-strip" aria-label="Task summary">
          <div className="summary-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="summary-card">
            <span>To do</span>
            <strong>{counts.todo}</strong>
          </div>
          <div className="summary-card">
            <span>In progress</span>
            <strong>{counts.inProgress}</strong>
          </div>
          <div className="summary-card">
            <span>Done</span>
            <strong>{counts.done}</strong>
          </div>
        </section>

        <TaskToolbar
          filters={filters}
          sort={sort}
          hasActiveFilters={hasActiveFilters}
          onFiltersChange={handleFiltersChange}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />

        <div className="workspace">
          <section className="task-panel" aria-labelledby="tasks-heading">
            <div className="task-panel__header">
              <h2 id="tasks-heading">Tasks</h2>
              <p className="result-count" aria-live="polite">
                Showing {visibleTasks.length} of {tasks.length} tasks
              </p>
            </div>

            <TaskList
              tasks={visibleTasks}
              hasAnyTasks={tasks.length > 0}
              hasActiveFilters={hasActiveFilters}
              onOpen={setSelectedTask}
              onToggleCompletion={handleToggleCompletion}
              onEdit={(task) => setFormState({ mode: 'edit', task })}
              onDelete={setPendingDelete}
              onClearFilters={clearFilters}
            />
          </section>

          {selectedTask ? (
            <TaskDetails
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onEdit={(task) => setFormState({ mode: 'edit', task })}
            />
          ) : (
            <aside className="details-panel details-panel--empty" aria-label="Task details">
              <p className="eyebrow">Task details</p>
              <h2>Select a task</h2>
              <p>
                Open any task title to review its description, ownership, and dates.
              </p>
            </aside>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>All tasks and people in this workspace are fictional demo data.</p>
        <button type="button" className="text-button" onClick={handleResetDemoData}>
          Reset demo data
        </button>
      </footer>

      {formState ? (
        <TaskFormDialog
          mode={formState.mode}
          initialTask={formState.task}
          onSave={handleSave}
          onClose={() => setFormState(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete task?"
          message={`“${pendingDelete.title}” will be removed from this demo board.`}
          confirmLabel="Delete task"
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
