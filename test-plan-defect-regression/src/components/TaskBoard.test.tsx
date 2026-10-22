import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TaskBoard } from './TaskBoard';

describe('TaskBoard', () => {
  it('renders the seeded task board and summary', () => {
    render(<TaskBoard />);

    expect(screen.getByRole('heading', { name: 'Task board' })).toBeInTheDocument();
    expect(screen.getByText('Showing 8 of 8 tasks')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Fix mobile navigation overlap' }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('task-row')).toHaveLength(8);
  });

  it('creates a task and adds it to the list', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });

    await user.type(within(dialog).getByLabelText('Title'), 'Draft launch announcement');
    await user.type(
      within(dialog).getByLabelText('Description'),
      'Write a short note for the internal launch channel.',
    );
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'high');
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(screen.queryByRole('dialog', { name: 'New task' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Draft launch announcement' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Showing 9 of 9 tasks')).toBeInTheDocument();
  });

  it('shows a validation error when a new task has no title', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.click(screen.getByRole('button', { name: 'New task' }));
    const dialog = screen.getByRole('dialog', { name: 'New task' });
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Title is required.');
    expect(screen.getByRole('dialog', { name: 'New task' })).toBeInTheDocument();
  });

  it('edits a task title', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.click(
      screen.getByRole('button', { name: 'Edit Audit current landing page copy' }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit task' });
    const titleInput = within(dialog).getByLabelText('Title');

    await user.clear(titleInput);
    await user.type(titleInput, 'Audit the revised landing page copy');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(
      screen.getByRole('button', { name: 'Audit the revised landing page copy' }),
    ).toBeInTheDocument();
  });

  it('filters the list by status', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.selectOptions(screen.getByLabelText('Status'), 'done');

    expect(screen.getAllByTestId('task-row')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Audit current landing page copy' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Write release notes draft' }),
    ).not.toBeInTheDocument();
  });

  it('searches task titles and descriptions', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.type(screen.getByLabelText('Search tasks'), 'keyboard');

    expect(screen.getAllByTestId('task-row')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Keyboard focus in task form' }),
    ).toBeInTheDocument();
  });

  it('opens a task in the details panel', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.click(screen.getByRole('button', { name: 'Fix mobile navigation overlap' }));
    const details = screen.getByRole('complementary', { name: 'Task details' });

    expect(
      within(details).getByRole('heading', { name: 'Fix mobile navigation overlap' }),
    ).toBeInTheDocument();
    expect(within(details).getByText('In progress')).toBeInTheDocument();
    expect(within(details).getByText('Riley')).toBeInTheDocument();
  });

  it('sorts tasks by title', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'title-asc');
    const rows = screen.getAllByTestId('task-row');

    expect(
      within(rows[0]).getByRole('button', { name: 'Add an empty state to the project list' }),
    ).toBeInTheDocument();
  });

  it('marks a task complete from the list', async () => {
    const user = userEvent.setup();
    render(<TaskBoard />);

    await user.click(
      screen.getByRole('checkbox', { name: 'Complete Fix mobile navigation overlap' }),
    );

    expect(
      screen.getByRole('checkbox', { name: 'Reopen Fix mobile navigation overlap' }),
    ).toBeChecked();
  });
});
