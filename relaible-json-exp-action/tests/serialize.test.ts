import { describe, expect, it } from 'vitest';
import { ExportError, serializeForExport } from '../src/export';
import { initialDocument, updatedDocument } from '../src/fixtures';
import type { JsonValue } from '../src/types';

describe('serializeForExport', () => {
  it('round-trips the initial nested fixture, including empty values', () => {
    const serialized = serializeForExport(initialDocument);
    const parsed = JSON.parse(serialized) as unknown;

    expect(parsed).toEqual(initialDocument);
    expect(parsed).toMatchObject({
      workspace: {
        emptyList: [],
        emptyObject: {},
        description: null,
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
        activity: [
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
    expect(serialized.startsWith('{\n  "workspace": {')).toBe(true);
    expect(serialized.endsWith('\n')).toBe(true);
  });

  it('round-trips the updated fixture without losing nested updates', () => {
    const serialized = serializeForExport(updatedDocument);
    const parsed = JSON.parse(serialized) as unknown;

    expect(parsed).toEqual(updatedDocument);
    expect(parsed).toMatchObject({
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

  it('rejects circular references with an export error', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    expect(() => serializeForExport(circular as unknown as JsonValue)).toThrow(ExportError);
  });
});
