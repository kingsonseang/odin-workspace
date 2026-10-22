import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  createTask,
  loadTasks,
  removeTask,
  resetTasks,
  saveTasks,
  toggleTaskCompletion,
  updateTask,
} from './taskService';
import { makeDraft, makeTask } from '../test/factories';

describe('taskService persistence', () => {
  it('seeds and persists demo tasks on first load', () => {
    const tasks = loadTasks();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown[];

    expect(tasks).toHaveLength(8);
    expect(stored).toHaveLength(8);
  });

  it('loads previously saved tasks', () => {
    const saved = [makeTask({ id: 'task-77', title: 'Saved task' })];
    saveTasks(saved);

    expect(loadTasks()).toEqual(saved);
  });

  it('restores the demo tasks when reset', () => {
    saveTasks([makeTask({ id: 'task-77', title: 'Temporary task' })]);

    const tasks = resetTasks();

    expect(tasks).toHaveLength(8);
    expect(tasks.some((task) => task.title === 'Temporary task')).toBe(false);
  });
});

describe('taskService task changes', () => {
  it('creates a task from a valid draft', () => {
    const tasks = [makeTask({ id: 'task-9001' })];
    const next = createTask(
      tasks,
      makeDraft({
        title: '  Prepare the launch checklist  ',
        assignee: 'Avery',
        dueDate: '2026-11-01',
      }),
      new Date('2026-10-21T12:00:00.000Z'),
    );
    const created = next.at(-1);

    expect(next).toHaveLength(2);
    expect(created).toMatchObject({
      id: 'task-9002',
      title: 'Prepare the launch checklist',
      assignee: 'Avery',
      dueDate: '2026-11-01',
      status: 'todo',
      priority: 'medium',
    });
  });

  it('updates an existing task and refreshes its timestamp', () => {
    const task = makeTask({ id: 'task-9001', title: 'Old title' });
    const next = updateTask(
      [task],
      task.id,
      makeDraft({ title: 'New title', priority: 'high' }),
      new Date('2026-10-22T08:30:00.000Z'),
    );

    expect(next[0]).toMatchObject({
      title: 'New title',
      priority: 'high',
      updatedAt: '2026-10-22T08:30:00.000Z',
    });
  });

  it('marks a task complete and reopens it', () => {
    const task = makeTask({ status: 'todo' });
    const completed = toggleTaskCompletion([task], task.id);
    const reopened = toggleTaskCompletion(completed, task.id);

    expect(completed[0].status).toBe('done');
    expect(reopened[0].status).toBe('todo');
  });

  it('removes a task by id', () => {
    const first = makeTask({ id: 'task-1' });
    const second = makeTask({ id: 'task-2' });

    expect(removeTask([first, second], 'task-1')).toEqual([second]);
  });
});
