import { useCallback, useState } from 'react';
import { JsonViewer } from './JsonViewer';
import { EXPORT_FILENAME, downloadJson } from './export';
import { initialDocument, updatedDocument } from './fixtures';
import type { JsonObject } from './types';

export default function App() {
  const [currentDocument, setCurrentDocument] = useState<JsonObject>(initialDocument);
  const [revision, setRevision] = useState(1);

  const handleLoadUpdated = () => {
    setCurrentDocument(updatedDocument);
    setRevision(2);
  };

  const handleExport = useCallback(() => {
    try {
      downloadJson(currentDocument);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="eyebrow">Strict TypeScript exercise</p>
        <h1>JSON Viewer</h1>
        <p className="lede">
          Inspect a synthetic nested document, load a revised copy, and download the active data as
          JSON.
        </p>
      </header>

      <section className="toolbar" aria-label="Document actions">
        <div className="toolbar-buttons">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLoadUpdated}
            disabled={revision === 2}
          >
            Load updated JSON
          </button>
          <button type="button" className="button button-primary" onClick={handleExport}>
            Export JSON
          </button>
        </div>
        <p className="revision" aria-live="polite">
          {`Revision ${revision}`}
        </p>
      </section>

      <section className="viewer-card" aria-labelledby="viewer-title">
        <div className="viewer-heading">
          <div>
            <h2 id="viewer-title">Current document</h2>
            <p>
              {revision === 2
                ? 'The revised fixture is loaded in memory.'
                : 'The initial fixture is loaded in memory.'}
            </p>
          </div>
          <p className="export-note">Downloads as {EXPORT_FILENAME}</p>
        </div>
        <JsonViewer data={currentDocument} />
      </section>
    </main>
  );
}
