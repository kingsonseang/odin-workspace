import { useCallback, useState } from 'react';
import { JsonViewer } from './JsonViewer';
import { EXPORT_FILENAME, downloadJson } from './export';
import { initialDocument, updatedDocument } from './fixtures';
import type { JsonObject } from './types';

export default function App() {
  const [currentDocument, setCurrentDocument] = useState<JsonObject>(initialDocument);
  const [hasUpdatedDocument, setHasUpdatedDocument] = useState(false);

  const handleLoadUpdated = () => {
    setCurrentDocument(updatedDocument);
    setHasUpdatedDocument(true);
  };

  const handleExport = useCallback(() => {
    try {
      downloadJson(currentDocument, EXPORT_FILENAME);
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
          Inspect a synthetic nested document, load a revised copy, and download the active data
          as JSON.
        </p>
      </header>

      <section className="toolbar" aria-label="Document actions">
        <div className="toolbar-buttons">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleLoadUpdated}
            disabled={hasUpdatedDocument}
          >
            Load updated JSON
          </button>
          <button type="button" className="button button-primary" onClick={handleExport}>
            Export JSON
          </button>
        </div>
        <p className="revision" aria-live="polite">
          {`Revision ${hasUpdatedDocument ? 2 : 1}`}
        </p>
      </section>

      <section className="viewer-card" aria-labelledby="viewer-title">
        <div className="viewer-heading">
          <h2 id="viewer-title">Current document</h2>
          <p>
            {hasUpdatedDocument
              ? 'The revised fixture is loaded in memory.'
              : 'The initial fixture is loaded in memory.'}
          </p>
        </div>
        <JsonViewer data={currentDocument} />
      </section>
    </main>
  );
}
