# Reliable JSON Export Action — exercise starter

A small React + strict TypeScript JSON viewer built with Vite. It displays a synthetic nested
document, lets you load a revised fixture, and exports JSON from the browser.

This repository is a **starter with a seeded defect**, not a finished implementation. The viewer
works, but the export action is not reliable yet. The acceptance tests describe the intended
behavior and currently fail in the places called out below.

## Prerequisites

- Node.js **20 or newer** (see `.nvmrc`)
- pnpm **9 or newer**

```bash
cd relaible-json-exp-action
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite development server. |
| `pnpm build` | Typecheck and create a production build in `dist/`. |
| `pnpm preview` | Serve the production build locally. |
| `pnpm typecheck` | Run strict TypeScript checks. |
| `pnpm test` | Run the Vitest suite once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm exec playwright install firefox` | Install Playwright's Firefox browser. |
| `pnpm test:browser` | Run the Firefox download workflow. |
| `pnpm test:browser:headed` | Run the Firefox workflow with a visible browser. |

## Supported data contract

The viewer and exporter support the JSON data model only:

```ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];
```

For reliable round-tripping, the runtime data must also satisfy these rules:

- Numbers must be finite. `NaN`, `Infinity`, and `-Infinity` are not supported.
- `-0` is not considered round-trip preserving because the JSON text representation normalizes it
  to `0`.
- Objects must be plain objects with enumerable own string keys. `Date`, `Map`, `Set`, class
  instances, functions, symbols, and `bigint` are not supported.
- `undefined` is not allowed anywhere in the value.
- Arrays must be dense. Sparse arrays and holes are not supported.
- Circular references are not supported.

Serialization must **reject** unsupported values with an `ExportError` instead of silently
coercing, dropping, or stringifying them. TypeScript types are erased at runtime, so a cast such as
`value as JsonValue` must not be trusted.

## Intended export behavior

Completing the exercise means making the export action:

1. Serialize the **current** document at the moment the button is clicked.
2. Preserve the full nested structure, including `null`, empty strings, empty arrays, and empty
   objects.
3. Produce a UTF-8 JSON download named exactly `json-viewer-export.json` with media type
   `application/json;charset=utf-8`.
4. Pretty-print with two spaces and end the file with a newline.
5. Reject values outside the supported contract with a clear export error.
6. Surface export/download failures in the UI, leave the displayed document untouched, and allow
   the user to retry.
7. Clean up the object URL and temporary anchor even when the download fails.

The parsed JSON structure is what matters; object key order is not semantically significant.

## Seeded defect and intentional gaps

### 1. Stale export snapshot (primary seeded defect)

The app keeps the active document in state, so clicking **Load updated JSON** changes the viewer to
revision 2. However, the export callback was created once with the initial revision still captured
in its closure. Clicking **Export JSON** after the update silently downloads revision 1.

This is the reproducible defect to fix. It uses ordinary JSON values and is observable both in the
browser and in the tests.

### 2. Export errors are not user-visible

The starter catches export exceptions and logs them to the console only. There is no alert or retry
feedback. The failure test expects a visible accessible alert while the viewer remains on revision
2.

### 3. The runtime contract is not enforced

`serializeForExport` currently calls `JSON.stringify` directly. Values such as `undefined`, `NaN`,
`Date`, or circular objects are therefore silently coerced or fail with an implementation error
instead of a deliberate `ExportError`. The contract tests fail until this is addressed.

## Reproduce the stale export in the browser

1. Run `pnpm dev` and open the app.
2. Confirm the badge says **Revision 1**.
3. Click **Load updated JSON**. The viewer now shows **Revision 2** and the description
   `"Updated immediately before export"`.
4. Click **Export JSON**.
5. Open the downloaded `json-viewer-export.json`.

With the seeded defect, the file contains revision 1. After the exercise is completed it must
contain revision 2, the appended activity event, and all empty values.

## Firefox download-verification workflow

### Manual workflow

1. Start the app with `pnpm dev` and open it in **Firefox**.
2. Click **Load updated JSON**.
3. Click **Export JSON**.
4. Open Firefox's downloads panel and locate `json-viewer-export.json`. If a previous exercise run
   produced the same filename, make sure you inspect the newest download.
5. Inspect the file with Firefox's built-in JSON viewer or from a terminal:

   ```bash
   jq '{
     revision: .workspace.revision,
     description: .workspace.description,
     lastActivity: .workspace.activity[-1],
     emptyList: .workspace.emptyList,
     emptyObject: .workspace.emptyObject
   }' ~/Downloads/json-viewer-export.json
   ```

   After a correct implementation, `revision` is `2`, `lastActivity.id` is `3`, `emptyList` is
   `[]`, and `emptyObject` is `{}`. With the starter defect, `revision` is `1`.

6. Error check: open Firefox DevTools on the page and run this in the console:

   ```js
   URL.createObjectURL = () => {
     throw new Error('Download blocked for verification');
   };
   ```

   Click **Export JSON** again. The finished implementation must show an accessible error, keep
   revision 2 visible, and allow a retry after reloading the page. The starter only logs to the
   console.

### Automated Firefox workflow

```bash
pnpm exec playwright install firefox
pnpm test:browser
```

Playwright is pinned to **1.50.1** because that release still provides a Firefox build for macOS
12. On newer systems you can upgrade it, but keep the lockfile in sync.

`tests/browser/export.firefox.spec.ts` loads revision 2, captures the Firefox download, saves it,
parses the file, and compares the resulting structure with the updated fixture. The test currently
fails because of the stale snapshot; it should pass once the export action is reliable.

## Tests

`pnpm test` currently fails intentionally. The passing tests cover rendering, initial export, and
normal round-tripping. The failing acceptance tests cover:

- exporting the latest data when the update happens immediately before export;
- exporting a fresh payload on every click rather than reusing the first download;
- visible failure handling with an intact viewer and a successful retry;
- rejecting values outside the supported runtime contract.

`tests/download-capture.ts` intercepts object URLs and anchor clicks in jsdom, captures the Blob and
suggested filename, and parses the downloaded text. The tests compare the parsed structure with the
fixtures using exact structural equality.

Do not weaken or delete the acceptance assertions to make the starter green; they define the task.

## Project structure

```text
src/
  App.tsx                 viewer state and export action
  JsonViewer.tsx          recursive JSON renderer
  export.ts               serialization and download boundary
  types.ts                supported JSON types
  fixtures/               synthetic initial and updated documents
tests/
  download-capture.ts     download/Blob test harness
  JsonViewer.test.tsx
  serialize.test.ts
  export.test.tsx
  browser/export.firefox.spec.ts
```
