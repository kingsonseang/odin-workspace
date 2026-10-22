import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JsonViewer } from '../src/JsonViewer';
import { initialDocument } from '../src/fixtures';

describe('JsonViewer', () => {
  it('renders nested objects, arrays, and empty values', () => {
    render(<JsonViewer data={initialDocument} />);

    const viewer = screen.getByRole('region', { name: 'JSON document' });

    expect(within(viewer).getByText('"workspace"')).toBeInTheDocument();
    expect(within(viewer).getByText('"Field Notes"')).toBeInTheDocument();
    expect(within(viewer).getByText('"members"')).toBeInTheDocument();
    expect(within(viewer).getByText('"Ada Lovelace"')).toBeInTheDocument();
    expect(within(viewer).getByText('"activity"')).toBeInTheDocument();
    expect(within(viewer).getByText('"emptyList"')).toBeInTheDocument();
    expect(within(viewer).getByText('"emptyObject"')).toBeInTheDocument();

    expect(within(viewer).getAllByText('[]')).toHaveLength(4);
    expect(within(viewer).getAllByText('{}')).toHaveLength(2);
    expect(within(viewer).getAllByText('null')).toHaveLength(3);
    expect(within(viewer).getAllByText('""').length).toBeGreaterThanOrEqual(2);
  });
});
