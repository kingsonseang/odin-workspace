import { describe, expect, it } from 'vitest';
import {
  filterTasks,
  sortTasks,
  validateTaskDraft,
  DEFAULT_FILTERS,
} from './taskRules';
import { makeDraft, makeTask } from '../test/factories';

describe('validateTaskDraft', () => {
  it('requires a title when creating a task', () => {
    const errors = validateTaskDraft(makeDraft({ title: '   ' }), 'create');

    expect(errors.title).toBe('Title is required.');
  });

  it('rejects titles longer than 80 characters', () => {
    const errors = validateTaskDraft(
      makeDraft({ title: 'A'.repeat(81) }),
      'create',
    );

    expect(errors.title).toBe('Title must be 80 characters or fewer.');
  });

  it('accepts a complete draft with an empty due date', () => {
    const errors = validateTaskDraft(makeDraft(), 'create');

    expect(errors).toEqual({});
  });
});

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 'task-1', title: 'Draft homepage copy', status: 'todo', priority: 'high' }),
    makeTask({
      id: 'task-2',
      title: 'Review navigation',
      description: 'Check keyboard access on the menu.',
      status: 'in_progress',
      priority: 'low',
    }),
    makeTask({ id: 'task-3', title: 'Publish release notes', status: 'done', priority: 'medium' }),
  ];

  it('filters by a single status', () => {
    const result = filterTasks(tasks, { ...DEFAULT_FILTERS, status: 'in_progress' });

    expect(result.map((task) => task.id)).toEqual(['task-2']);
  });

  it('filters by a single priority', () => {
    const result = filterTasks(tasks, { ...DEFAULT_FILTERS, priority: 'high' });

    expect(result.map((task) => task.id)).toEqual(['task-1']);
  });

  it('searches titles and descriptions case-insensitively', () => {
    const titleResult = filterTasks(tasks, { ...DEFAULT_FILTERS, search: 'HOMEPAGE' });
    const descriptionResult = filterTasks(tasks, {
      ...DEFAULT_FILTERS,
      search: 'keyboard',
    });

    expect(titleResult.map((task) => task.id)).toEqual(['task-1']);
    expect(descriptionResult.map((task) => task.id)).toEqual(['task-2']);
  });
});

describe('sortTasks', () => {
  const tasks = [
    makeTask({ id: 'task-1', title: 'Beta task', priority: 'medium' }),
    makeTask({ id: 'task-2', title: 'Alpha task', priority: 'urgent' }),
    makeTask({ id: 'task-3', title: 'Gamma task', priority: 'low' }),
  ];

  it('sorts titles alphabetically', () => {
    const result = sortTasks(tasks, 'title-asc');

    expect(result.map((task) => task.title)).toEqual([
      'Alpha task',
      'Beta task',
      'Gamma task',
    ]);
  });

  it('sorts priority with urgent first', () => {
    const result = sortTasks(tasks, 'priority-desc');

    expect(result.map((task) => task.priority)).toEqual(['urgent', 'medium', 'low']);
  });
});
