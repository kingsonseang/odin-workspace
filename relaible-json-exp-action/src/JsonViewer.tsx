import type { ReactElement } from 'react';
import type { JsonPrimitive, JsonValue } from './types';

export interface JsonViewerProps {
  data: JsonValue;
}

export function JsonViewer({ data }: JsonViewerProps): ReactElement {
  return (
    <section className="json-viewer" aria-label="JSON document">
      <JsonNode value={data} />
    </section>
  );
}

interface JsonNodeProps {
  value: JsonValue;
}

function JsonNode({ value }: JsonNodeProps): ReactElement {
  if (value === null) {
    return <span className="json-null">null</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span className="json-empty" title="Empty array">
          []
        </span>
      );
    }

    return (
      <ul className="json-list json-array" aria-label="Array">
        {value.map((item, index) => (
          <li key={index} className="json-row">
            <span className="json-index">{index}</span>
            <span className="json-punctuation">: </span>
            <JsonNode value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);

    if (entries.length === 0) {
      return (
        <span className="json-empty" title="Empty object">
          {'{}'}
        </span>
      );
    }

    return (
      <ul className="json-list json-object" aria-label="Object">
        {entries.map(([key, child]) => (
          <li key={key} className="json-row">
            <span className="json-key">{JSON.stringify(key)}</span>
            <span className="json-punctuation">: </span>
            <JsonNode value={child} />
          </li>
        ))}
      </ul>
    );
  }

  return <Primitive value={value} />;
}

function Primitive({ value }: { value: JsonPrimitive }): ReactElement {
  if (typeof value === 'string') {
    return <span className="json-string">{JSON.stringify(value)}</span>;
  }

  if (typeof value === 'number') {
    return <span className="json-number">{String(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="json-boolean">{String(value)}</span>;
  }

  return <span className="json-null">null</span>;
}
