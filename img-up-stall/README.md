# Image Upload Preview

A small React + strict TypeScript app built with Vite. It accepts one image,
shows a local preview, validates PNG/JPEG/WebP files, and never sends the image
anywhere.

> **Intentional defect:** this starter intentionally leaves the last preview
> visible after the selection is cleared. It also does not clean up generated
> object URLs. The final fix is not included. See
> [Known defect](#known-defect) for the expected failing tests.

## Requirements

- Node.js **22.12 or newer**. The included `.nvmrc` uses Node 22.23.3.
- npm.
- Firefox is installed automatically by the Playwright setup below for browser
  verification.

```bash
nvm use
npm install
```

If you do not use nvm, confirm the active version before installing:

```bash
node --version
```

## Run the app

```bash
npm run dev
```

Open the URL printed by Vite (normally <http://localhost:5173>). Choose an
image with the file picker to see its preview. There is no upload endpoint or
network request.

## Tests

### Component and lifecycle tests

```bash
npm test
```

This runs Vitest with Testing Library in jsdom. The tests load the same PNG
fixtures used by the Firefox suite from `tests/fixtures/`.

For watch mode:

```bash
npm run test:watch
```

### Firefox browser verification

Install the Playwright Firefox browser once:

```bash
npm run browsers:install
```

Run the Firefox-only Playwright suite:

```bash
npm run test:browser
```

To watch the browser while the tests run:

```bash
npm run test:browser:headed
```

The Playwright config starts the Vite server on
`http://127.0.0.1:4173`, reuses an existing server when one is available, and
runs only the `firefox` project. Test traces are captured on the first retry;
screenshots are saved on failure under `test-results/`.

Playwright is pinned to `1.58.2` because this project is verified on macOS 12,
where newer Playwright releases no longer provide Firefox builds. The workflow
can be upgraded on a newer operating system.

### Manual Firefox verification

1. Run `npm run dev` and open the app in Firefox.
2. Confirm the initial state says **No image selected.** and has no preview.
3. Choose `tests/fixtures/red.png`; confirm its preview and filename appear.
4. Choose `tests/fixtures/blue.png`; confirm the blue preview replaces the red
   preview.
5. Click **Clear selection**; the preview should be removed. In the current
   starter it remains visible, which reproduces the defect.
6. Choose `tests/fixtures/notes.txt`; confirm the unsupported-file message
   appears and no preview is created.

## Known defect

The selected file and preview are stored separately. A synchronization effect
returns early when there is no selected file, and the clear handler only resets
the file input and selected-file state. Consequently:

- Clearing leaves the previous image and filename on screen.
- Object URLs created for previous selections are never revoked.

These tests document the required behavior and are expected to fail on the
starter:

| Command | Expected starter result |
| --- | --- |
| `npm test` | 4 passed, 2 failed |
| `npm run test:browser` | 2 passed, 1 failed |

Failing checks:

- `clears the selection and removes the preview`
- `revokes the previous object URL when the selection is replaced`
- Firefox: `clears the selected image and preview`

The initial-state, selecting, replacing, and unsupported-file tests pass.

## Intended behavior

The eventual fix should satisfy all of these without adding an upload service:

- The preview always represents the currently selected file.
- Selecting another supported image replaces the preview.
- Clearing the selection removes the preview and returns the empty state.
- Invalid files produce a useful, accessible message and no preview.
- Object URLs are revoked when replaced, cleared, or no longer needed.
- The native file input remains usable, including after clearing or rejecting a
  file.

No final implementation or patch is included intentionally.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run unit/component tests once |
| `npm run test:watch` | Run component tests in watch mode |
| `npm run test:browser` | Run Playwright using Firefox |
| `npm run test:browser:headed` | Run Playwright in headed Firefox |
| `npm run browsers:install` | Install the pinned Playwright Firefox build |

## Fixtures and project layout

```text
src/
  App.tsx             app shell
  ImageUpload.tsx     form, validation, preview state (contains the defect)
  ImageUpload.test.tsx
  test/setup.ts
tests/
  e2e/image-upload.spec.ts
  fixtures/red.png    320 x 180 synthetic PNG
  fixtures/blue.png   320 x 180 synthetic PNG
  fixtures/notes.txt  unsupported file fixture
```

The app intentionally has no backend, persistence, drag-and-drop, multiple-file
support, or image processing.
