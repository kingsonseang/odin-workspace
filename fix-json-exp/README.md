# JSON Viewer Export Exercise

A small, runnable React and strict TypeScript JSON viewer built with Vite. It renders a synthetic nested document, can load a revised copy into memory, and exposes a basic JSON download action.

This repository is a **starter with an intentionally incomplete export implementation**. It is not the finished solution. The included acceptance tests describe the required behavior and intentionally fail where the starter does not meet it.

## What is included

- React 18 + Vite 5 client application
- Strict TypeScript configuration
- Recursive structured JSON viewer
- Synthetic nested JSON fixtures (initial and updated)
- Download workflow with an observable stale-data defect
- Vitest and Testing Library tests that capture the exported `Blob`, parse it with `JSON.parse`, and compare the result to expected fixtures
- A manual Firefox workflow for checking the downloaded file

No backend or external data service is used. All data is local and reproducible.

## Requirements

- Node.js 20 or newer (verified with 20.11.1)
- pnpm 12.5.1 (pinned in `package.json` and `pnpm-lock.yaml`)

If pnpm is not installed:

```bash
corepack enable
corepack prepare pnpm@12.5.1 --activate
```

Alternatively:

```bash
npm install --global pnpm@12.5.1
```

## Setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Vite, normally <http://localhost:5173>.

Other scripts:

```bash
pnpm test        # run all tests once
pnpm test:watch  # run tests in watch mode
pnpm typecheck   # strict TypeScript check
pnpm build       # type-check and create a production build
pnpm preview     # serve the production build locally
```

`pnpm-workspace.yaml` contains the pnpm 12 build approval for esbuild. It is required for pnpm to install esbuild correctly.

## Using the viewer

1. The app starts with the initial fixture from `src/fixtures/initial-document.json`.
2. Click **Load updated JSON** to replace the in-memory document with `src/fixtures/updated-document.json`.
3. Click **Export JSON** to download the current document.

The updated fixture changes nested values and appends event `3`. It also retains empty strings, empty arrays, empty objects, `false`, `null`, and numeric values so that lossy serialization is visible.

## Current starter behavior and the seeded defect

The export workflow currently has these intentional gaps:

1. **Stale export data.** The export handler in `src/App.tsx` is memoized with an empty dependency list. It closes over the document from the initial render. The viewer updates after **Load updated JSON**, but the downloaded file still contains the initial fixture.
2. **No runtime contract enforcement.** `serializeForExport` calls `JSON.stringify` directly. Values that JSON cannot represent faithfully are silently changed or omitted instead of being rejected with `ExportError`.
3. **No visible export error.** A failed download is caught and logged to the console, but no accessible error message is shown.

The test suite demonstrates all three gaps. In the current starter, `pnpm test` is expected to fail.

The defect is realistic and reproducible with ordinary JSON values: no cyclic-only or impossible fixture is required to observe the stale export. The contract tests intentionally go beyond ordinary fixture values to verify the documented runtime boundary.

## Supported data contract

The application's public TypeScript API uses:

```ts
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
```

That compile-time type is not sufficient at runtime. Serialization must validate before producing output.

### Supported

| Value | Requirement |
| --- | --- |
| `null` | Preserved as `null` |
| Boolean | Preserved |
| Number | Finite numbers only; `-0` is rejected because JSON serialization would silently normalize it to `0` |
| String | Preserved, including the empty string |
| Array | Dense arrays of supported values; empty arrays are preserved |
| Object | Plain objects with enumerable string keys and supported values; empty objects are preserved |

Object insertion order is not part of the export contract. JavaScript may reorder integer-like keys, so tests parse the file and compare structure rather than comparing raw text.

### Rejected with `ExportError`

| Value | Why it cannot be silently exported |
| --- | --- |
| `undefined` in an object | `JSON.stringify` drops the property |
| `undefined` in an array or a sparse array | `JSON.stringify` emits `null` for the hole/value |
| Function or symbol | Object members disappear; array members become `null` |
| `bigint` | `JSON.stringify` throws a raw `TypeError`, not a domain error |
| `NaN`, `Infinity`, `-Infinity` | They become `null` |
| `Date` | It is converted through `toJSON` and changes type |
| `Map`, `Set`, `RegExp`, class instances, typed arrays | They lose their runtime type or serialize as unexpected plain values |
| Cyclic references | They either throw or cannot be represented |
| Symbol-keyed properties | They are omitted |

The intended serializer should reject these with a useful `ExportError` message that identifies the unsupported value, rather than coercing, dropping, or throwing an implementation-level exception.

## Target export contract

A complete implementation must satisfy all of the following:

1. **Current data:** the file contains the state visible at the moment Export is clicked, including an update made immediately before the click.
2. **Predictable filename:** the suggested download filename is exactly `json-viewer-export.json`.
3. **Format:** UTF-8 JSON, `application/json;charset=utf-8`, two-space indentation, and a trailing newline.
4. **Contract enforcement:** unsupported values cause an `ExportError`; they are never silently converted.
5. **Error isolation:** a failed serialization or browser download shows an accessible `role="alert"` message beginning with “Export failed”, leaves the displayed document unchanged, and does not prevent a later successful export.
6. **No stale caches:** no module-level snapshot or mount-time closure is used as the exported value.

The starter intentionally does not implement this finished contract.

## Tests

```bash
pnpm test
```

Baseline in the starter:

| Area | Result | What it checks |
| --- | --- | --- |
| `tests/JsonViewer.test.tsx` | Passes | Recursive rendering, nested objects and arrays, empty values |
| `tests/serialize.test.ts` round-trip | Passes | Parsing the serialized fixture returns the same structure, including empty containers |
| `tests/export.test.tsx` initial download | Passes | Filename, media type, and parsed structure for the initial document |
| `tests/export.test.tsx` update export | **Fails by design** | Load revised data, export immediately, parse the download, and compare it with `updatedDocument` |
| `tests/export.test.tsx` failure handling | **Fails by design** | Forced object URL failure must show an alert, preserve the viewer, and allow a retry |
| `tests/serialize.test.ts` contract cases | **Fails by design** | Unsupported values must throw `ExportError` (7 test cases) |

Expected starter summary: **3 passed, 9 failed**. An all-green run is the acceptance signal for the intended fix.

The download helper in `tests/download-capture.ts` replaces `URL.createObjectURL` and captures the `Blob` plus the anchor's `download` filename. Tests then use `FileReader` to read the blob, `JSON.parse` the text, and assert deep structural equality. They never compare serialized text as a proxy for data equality.

## Verifying the downloaded file in Firefox

Firefox is available locally, but the following steps are manual and are not run by the test command.

1. Install dependencies and start the app:
   ```bash
   pnpm install --frozen-lockfile
   pnpm dev
   ```
2. Open <http://localhost:5173> in Firefox.
3. Confirm the page says **Revision 1** and shows `"emptyList": []`, `"emptyObject": {}`, and the initial event list.
4. Click **Load updated JSON**.
   - Confirm the page now says **Revision 2**.
   - Confirm the summary is `"Updated immediately before export"` and event `3` is visible.
5. Click **Export JSON**.
6. Open Firefox's Downloads panel (the arrow icon in the toolbar, or **Ctrl/Cmd + J**). Locate `json-viewer-export.json`.
   - Delete or move any previous copy first; Firefox adds a numeric suffix when a same-named file already exists, so the exact filename is easiest to verify from a clean Downloads folder.
7. Inspect the file. On macOS/Linux with `jq`:
   ```bash
   jq '{
     revision: .document.revision,
     eventIds: [.document.events[].id],
     emptyList: .document.emptyList,
     emptyObject: .document.emptyObject,
     metrics: .document.metrics
   }' "$HOME/Downloads/json-viewer-export.json"
   ```
   Expected output:
   ```json
   {
     "revision": 2,
     "eventIds": [1, 2, 3],
     "emptyList": [],
     "emptyObject": {},
     "metrics": {
       "views": 12,
       "downloads": 1
     }
   }
   ```
   On Windows PowerShell, the default path is usually `%USERPROFILE%\Downloads\json-viewer-export.json`. If Firefox is configured to ask where to save, use the folder you selected.
8. You can also drag the downloaded file into a Firefox tab. Firefox will display the JSON content; confirm the revision, the third event, and the empty structures.

With the starter's seeded defect, step 7 reports `revision: 1`, `eventIds: [1, 2]`, and the initial metrics. After the intended fix it must report revision 2 and preserve all updated nested values.

## Project structure

```text
.
├── .gitignore
├── README.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── JsonViewer.tsx
│   ├── export.ts
│   ├── main.tsx
│   ├── styles.css
│   ├── types.ts
│   ├── vite-env.d.ts
│   └── fixtures/
│       ├── index.ts
│       ├── initial-document.json
│       └── updated-document.json
└── tests/
    ├── setup.ts
    ├── download-capture.ts
    ├── JsonViewer.test.tsx
    ├── export.test.tsx
    └── serialize.test.ts
```

## Notes for the implementer

- The viewer should remain read-only; editing is not part of this exercise.
- The export action should read the current state at click time, not a captured initial snapshot.
- Runtime validation and serialization should be separated from browser download mechanics where practical.
- An export failure must not remove, replace, or reorder the visible document.
- Keep tests parsing the exported file; do not weaken them to inspect implementation internals.
- Use the generated fixtures as the expected structures, and preserve empty arrays, empty objects, empty strings, `false`, `null`, and zero values.
