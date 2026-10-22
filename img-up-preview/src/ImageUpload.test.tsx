import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageUpload } from './ImageUpload';

let nextObjectUrlId = 0;

const createObjectURLMock = vi.fn((_file: Blob): string => {
  nextObjectUrlId += 1;
  return `blob:test-object-url-${nextObjectUrlId}`;
});

const revokeObjectURLMock = vi.fn((_url: string): void => {});

function fixtureFile(name: string, type: string): File {
  const fixturePath = resolve(process.cwd(), 'tests/fixtures', name);
  return new File([readFileSync(fixturePath)], name, { type });
}

function redPng() {
  return fixtureFile('red.png', 'image/png');
}

function bluePng() {
  return fixtureFile('blue.png', 'image/png');
}

function notesFile() {
  return fixtureFile('notes.txt', 'text/plain');
}

describe('ImageUpload', () => {
  beforeEach(() => {
    nextObjectUrlId = 0;
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    });

    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    });
  });

  it('starts with an empty upload form', () => {
    render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);

    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/png,image/jpeg,image/webp');
    expect(input).not.toBeDisabled();
    expect((input as HTMLInputElement).files?.length ?? 0).toBe(0);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /clear selection/i }),
    ).not.toBeInTheDocument();
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('shows a preview after selecting a supported image', async () => {
    const user = userEvent.setup();
    const red = redPng();
    render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);
    await user.upload(input, red);

    const preview = await screen.findByRole('img', {
      name: /preview of red\.png/i,
    });

    expect(preview).toHaveAttribute('src', 'blob:test-object-url-1');
    expect(screen.getByText(/selected file:/i)).toHaveTextContent('red.png');
    expect(
      screen.getByRole('button', { name: /clear selection/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(createObjectURLMock).toHaveBeenCalledWith(red);
  });

  it('replaces the preview and revokes the previous object URL', async () => {
    const user = userEvent.setup();
    const red = redPng();
    const blue = bluePng();
    render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);

    await user.upload(input, red);
    const firstPreview = await screen.findByRole('img', {
      name: /preview of red\.png/i,
    });
    const firstSrc = firstPreview.getAttribute('src');
    expect(firstSrc).toBe('blob:test-object-url-1');

    await user.upload(input, blue);
    const secondPreview = await screen.findByRole('img', {
      name: /preview of blue\.png/i,
    });

    expect(secondPreview).toHaveAttribute('src', 'blob:test-object-url-2');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByText(/selected file:/i)).toHaveTextContent('blue.png');
    expect(createObjectURLMock).toHaveBeenLastCalledWith(blue);
    expect(revokeObjectURLMock).toHaveBeenCalledWith(firstSrc);
  });

  it('clears the selected file, preview, and object URL', async () => {
    const user = userEvent.setup();
    render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);
    await user.upload(input, redPng());

    const preview = await screen.findByRole('img', {
      name: /preview of red\.png/i,
    });
    const previewSrc = preview.getAttribute('src');
    expect(previewSrc).toBe('blob:test-object-url-1');

    await user.click(
      screen.getByRole('button', { name: /clear selection/i }),
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/selected file:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /clear selection/i }),
    ).not.toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('');
    expect(revokeObjectURLMock).toHaveBeenCalledWith(previewSrc);
  });

  it('rejects unsupported files with a useful message', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);
    await user.upload(input, notesFile());

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Cannot use "notes.txt"');
    expect(alert).toHaveTextContent('text/plain');
    expect(alert).toHaveTextContent('Choose a PNG, JPEG, or WebP image.');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('revokes the active object URL when unmounted', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ImageUpload />);

    const input = screen.getByLabelText(/choose an image/i);
    await user.upload(input, redPng());

    const preview = await screen.findByRole('img', {
      name: /preview of red\.png/i,
    });
    const previewSrc = preview.getAttribute('src');
    expect(previewSrc).toBe('blob:test-object-url-1');

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith(previewSrc);
  });
});
