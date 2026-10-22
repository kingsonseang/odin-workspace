import type { Task, TaskDraft } from '../types';

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-9001',
    title: 'Prepare a task',
    description: 'A task used in automated tests.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Morgan',
    dueDate: null,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
  };
}

export function makeDraft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: 'Draft a release note',
    description: 'Summarize the change for the weekly notes.',
    status: 'todo',
    priority: 'medium',
    assignee: 'Morgan',
    dueDate: '',
    ...overrides,
  };
}
