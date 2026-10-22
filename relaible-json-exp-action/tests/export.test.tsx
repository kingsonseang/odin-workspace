import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { EXPORT_FILENAME, EXPORT_MEDIA_TYPE } from '../src/export';
import { initialDocument, updatedDocument } from '../src/fixtures';
import type { JsonObject } from '../src/types';
import {
  installDownloadCapture,
  readCapturedJson,
  type CapturedDownload,
  type DownloadCapture,
} from './download-capture';

let capture: DownloadCapture;

beforeEach(() => {
  capture = installDownloadCapture();
});

afterEach(() => {
  capture.restore();
});

function firstDownload(): CapturedDownload {
  const download = capture.downloads[0];

  if (!download) {
    throw new Error('Expected the application to trigger one download');
  }

  return download;
}

describe('JSON export workflow', () => {
  it('downloads the current document with a predictable filename', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('Revision 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(capture.downloads).toHaveLength(1);

    const download = firstDownload();
    expect(download.filename).toBe(EXPORT_FILENAME);
    expect(download.filename).toBe('json-viewer-export.json');
    expect(download.blob.type).toBe(EXPORT_MEDIA_TYPE);

    const exported = await readCapturedJson<JsonObject>(download);
    expect(exported).toEqual(initialDocument);
    expect(exported).toMatchObject({
      workspace: {
        emptyList: [],
        emptyObject: {},
        members: [
          {
            profile: {
              bio: '',
              links: [],
            },
          },
          {
            roles: [],
            profile: null,
          },
        ],
      },
    });
  });

  it('exports the latest data when an update happens immediately before export', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Load updated JSON' }));

    expect(screen.getByText('Revision 2')).toBeInTheDocument();
    expect(screen.getByText('"Updated immediately before export"')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(capture.downloads).toHaveLength(1);

    const download = firstDownload();
    const exported = await readCapturedJson<JsonObject>(download);

    expect(exported).toEqual(updatedDocument);
    expect(exported).toMatchObject({
      workspace: {
        revision: 2,
        emptyList: [],
        emptyObject: {},
        activity: [
          {},
          {},
          {
            id: 3,
            type: 'exported',
            payload: {
              source: 'in-app-update',
              note: '',
              artifacts: [],
            },
          },
        ],
      },
    });
  });

  it('does not reuse an earlier download payload after the data changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    await user.click(screen.getByRole('button', { name: 'Load updated JSON' }));
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(capture.downloads).toHaveLength(2);

    const first = await readCapturedJson<JsonObject>(firstDownload());
    const secondDownload = capture.downloads[1];

    if (!secondDownload) {
      throw new Error('Expected a second download');
    }

    const second = await readCapturedJson<JsonObject>(secondDownload);

    expect(first).toEqual(initialDocument);
    expect(second).toEqual(updatedDocument);
    expect(second).not.toEqual(first);
  });

  it('reports export failures without changing the viewer and allows a retry', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Load updated JSON' }));
    capture.failNextDownload('Simulated download failure');

    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/export failed/i);
    expect(capture.downloads).toHaveLength(0);
    expect(screen.getByText('Revision 2')).toBeInTheDocument();
    expect(screen.getByText('"Updated immediately before export"')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(capture.downloads).toHaveLength(1);
    const exported = await readCapturedJson<JsonObject>(firstDownload());
    expect(exported).toEqual(updatedDocument);

    consoleError.mockRestore();
  });
});
