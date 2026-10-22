import type { JsonValue } from './types';

export const EXPORT_FILENAME = 'json-viewer-export.json';
export const EXPORT_MEDIA_TYPE = 'application/json;charset=utf-8';

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Serialize a JSON document for download.
 *
 * The starter currently relies on JSON.stringify directly. It does not yet
 * enforce the documented JsonValue runtime contract.
 */
export function serializeForExport(data: JsonValue): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

/**
 * Serialize the supplied document and trigger a browser download.
 */
export function downloadJson(data: JsonValue, filename: string = EXPORT_FILENAME): void {
  const blob = new Blob([serializeForExport(data)], { type: EXPORT_MEDIA_TYPE });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
