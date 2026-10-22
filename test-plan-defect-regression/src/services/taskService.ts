import { buildSeedTasks } from '../data/seedTasks';
import type { Task, TaskDraft } from '../types';

export const STORAGE_KEY = 'tasklane.tasks.v1';

function normalizeDraft(draft: TaskDraft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    assignee: draft.assignee.trim() || null,
    dueDate: draft.dueDate || null,
  };
}

function nextTaskId(tasks: Task[]): string {
  const highest = tasks.reduce((max, task) => {
    const value = Number.parseInt(task.id.replace(/\D/g, ''), 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 1000);

  return `task-${highest + 1}`;
}

export function loadTasks(): Task[] {
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as Task[];
      }
    } catch {
      // Fall through to a clean set of demo data.
    }
  }

  const seeded = buildSeedTasks();
  saveTasks(seeded);
  return seeded;
}

export function saveTasks(tasks: Task[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function resetTasks(): Task[] {
  const seeded = buildSeedTasks();
  saveTasks(seeded);
  return seeded;
}

export function createTask(
  tasks: Task[],
  draft: TaskDraft,
  now = new Date(),
): Task[] {
  const timestamp = now.toISOString();
  const task: Task = {
    id: nextTaskId(tasks),
    ...normalizeDraft(draft),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return [...tasks, task];
}

export function updateTask(
  tasks: Task[],
  taskId: string,
  draft: TaskDraft,
  now = new Date(),
): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          ...normalizeDraft(draft),
          updatedAt: now.toISOString(),
        }
      : task,
  );
}

export function toggleTaskCompletion(
  tasks: Task[],
  taskId: string,
  now = new Date(),
): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: task.status === 'done' ? 'todo' : 'done',
          updatedAt: now.toISOString(),
        }
      : task,
  );
}

export function removeTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.id !== taskId);
}
