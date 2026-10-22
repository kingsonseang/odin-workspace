import { vi } from 'vitest';

export interface CapturedDownload {
  filename: string;
  blob: Blob;
}

export interface DownloadCapture {
  downloads: CapturedDownload[];
  failNextDownload(message?: string): void;
  restore(): void;
}

/**
 * Capture the Blob and suggested filename produced by the download workflow.
 * jsdom does not implement downloads or object URLs, so both are replaced for
 * the duration of a test.
 */
export function installDownloadCapture(): DownloadCapture {
  const downloads: CapturedDownload[] = [];
  let pendingBlob: Blob | null = null;
  let failureMessage: string | null = null;
  let objectUrlCount = 0;

  const originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

  const clickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      if (!pendingBlob) {
        throw new Error('A download was clicked without a pending Blob');
      }

      downloads.push({ filename: this.download, blob: pendingBlob });
      pendingBlob = null;
    });

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn((value: Blob | MediaSource): string => {
      if (failureMessage !== null) {
        const message = failureMessage;
        failureMessage = null;
        throw new Error(message);
      }

      if (!(value instanceof Blob)) {
        throw new TypeError('Expected URL.createObjectURL to receive a Blob');
      }

      pendingBlob = value;
      objectUrlCount += 1;
      return `blob:captured-download-${objectUrlCount}`;
    }),
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(() => undefined),
  });

  return {
    downloads,
    failNextDownload(message = 'Simulated download failure') {
      failureMessage = message;
    },
    restore() {
      clickSpy.mockRestore();
      restoreProperty(URL, 'createObjectURL', originalCreateObjectURL);
      restoreProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
    },
  };
}

export async function readCapturedJson<T>(download: CapturedDownload): Promise<T> {
  const text = await readBlobText(download.blob);
  return JSON.parse(text) as T;
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Expected the exported Blob to contain text'));
        return;
      }

      resolve(reader.result);
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('Could not read the exported Blob'));
    });
    reader.readAsText(blob);
  });
}

function restoreProperty(
  target: object,
  property: string,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
    return;
  }

  Reflect.deleteProperty(target, property);
}
