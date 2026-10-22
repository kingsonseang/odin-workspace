import { describe, expect, it } from 'vitest';
import { ExportError, serializeForExport } from '../src/export';
import { initialDocument } from '../src/fixtures';
import type { JsonValue } from '../src/types';

describe('serializeForExport', () => {
  it('round-trips the nested fixture, including empty values', () => {
    const serialized = serializeForExport(initialDocument);
    const parsed = JSON.parse(serialized) as unknown;

    expect(parsed).toEqual(initialDocument);
    expect(parsed).toMatchObject({
      document: {
        emptyList: [],
        emptyObject: {},
        summary: null,
        events: [
          {
            payload: {
              note: '',
            },
          },
          {
            payload: null,
          },
        ],
      },
    });
    expect(serialized.startsWith('{\n  "document": {')).toBe(true);
    expect(serialized.endsWith('\n')).toBe(true);
  });

  it.each([
    ['nested undefined', { nested: undefined }],
    ['NaN', { amount: Number.NaN }],
    ['Infinity', { amount: Number.POSITIVE_INFINITY }],
    ['bigint', { total: 12n }],
    ['Date instance', { createdAt: new Date('2026-01-01T00:00:00.000Z') }],
    ['sparse array', [1, , 3]],
  ])('rejects %s instead of silently coercing it', (_label, value) => {
    expect(() => serializeForExport(value as unknown as JsonValue)).toThrow(ExportError);
  });

  it('rejects circular references instead of throwing an implementation error', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    expect(() => serializeForExport(circular as unknown as JsonValue)).toThrow(ExportError);
  });
});
