# Image Preview Starter

A small React 19 + strict TypeScript + Vite application that accepts one image
file and shows a local preview. Nothing is uploaded; the form only creates
browser object URLs for the selected file.

This is a **bug-fix starter**. The preview state synchronization and object URL
lifecycle are intentionally broken. The tests describe the intended behavior,
so parts of the baseline test suite are expected to fail until the defect is
fixed.

## Intentional defect

`src/ImageUpload.tsx` keeps the selected file and preview URL in separate pieces
of state. The current implementation:

- creates a new object URL for every accepted file but never revokes the
  previous URL;
- clears the selected file, the error, and the native input value, but leaves
  `previewUrl` untouched;
- never revokes the active URL when the component unmounts.

The most obvious symptom is reproducible in the browser:

1. Choose a valid image.
2. Click **Clear selection**.
3. The file name and button disappear, but the previous preview remains visible.

The same missing lifecycle handling causes object URLs from replaced and
unmounted previews to leak. The unit tests spy on `URL.revokeObjectURL` to expose
those leaks.

## Requirements

- Node.js 20 or newer (developed with Node 20.11.1)
- npm 10 or newer
- A Playwright-managed Firefox for the browser tests

The project pins `@playwright/test` to `1.58.1` because it still ships a Firefox
build for macOS 12. Newer Playwright releases do not support Firefox on macOS 12.
The same version works on newer operating systems as well.

## Setup

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (usually <http://localhost:5173>). Vite will choose
another port if 5173 is already in use.

Production build and type checking:

```bash
npm run typecheck
npm run build
```

## Tests

Component tests use Vitest, Testing Library, and jsdom:

```bash
npm test
```

The baseline is intentionally mixed:

| Test | Baseline |
| --- | --- |
| starts with an empty upload form | Pass |
| shows a preview after selecting a supported image | Pass |
| rejects unsupported files with a useful message | Pass |
| replaces the preview and revokes the previous object URL | Fail: previous URL not revoked |
| clears the selected file, preview, and object URL | Fail: stale preview remains and URL is not revoked |
| revokes the active object URL when unmounted | Fail: URL is not revoked |

The tests encode the expected behavior; fix the implementation rather than
weakening or skipping the assertions.

Image fixtures live in `tests/fixtures/`:

- `red.png` and `blue.png` — synthetic 32×32 solid-color PNGs
- `notes.txt` — unsupported file type used to exercise validation

## Firefox browser verification

### Automated Playwright workflow

Install the Playwright Firefox build once:

```bash
npm run setup:firefox
```

Then run the browser tests:

```bash
npm run verify:firefox
```

Useful variants:

```bash
npm run test:e2e          # same Firefox project
npm run test:e2e:headed   # watch the flow in a visible browser
npx playwright show-report
```

Playwright starts its own Vite server on `127.0.0.1:4317` and refuses to reuse an
existing server, so it will not accidentally test another app already running
on port 5173.

Baseline result:

- “rejects an unsupported file with a useful message” passes.
- “selecting, replacing, and clearing an image keeps the preview in sync” fails
  at the final assertion because the preview remains after **Clear selection**.

Failure artifacts (screenshot, trace, error context) are written to
`test-results/`.

### Manual Firefox workflow

1. Run `npm run dev`.
2. Open the printed local URL in Firefox.
3. Confirm the empty state has no preview, no error, and no clear button.
4. Select `tests/fixtures/red.png`. A red square preview and the file name should
   appear.
5. Select `tests/fixtures/blue.png`. The preview should change to blue and the
   file name should update.
6. Click **Clear selection**. Expected: preview, file name, and button disappear,
   and the input is empty. Current baseline: the blue preview remains visible.
7. Reload the page, then select `tests/fixtures/notes.txt`. Expected: a useful
   unsupported-type message, no preview, and no new object URL.
8. Re-run the automated Firefox workflow after the fix; both tests should pass.

## Intended behavior

The fix should make the preview follow the current accepted selection at all
times:

- Initial state shows no preview and no error.
- A valid PNG, JPEG, or WebP selection displays a preview with a blob URL and the
  selected file name.
- Replacing a file immediately updates the preview and name, leaves exactly one
  preview, and revokes the previous object URL.
- Clearing removes the preview and file name, resets the native file input,
  revokes the active URL, and removes the error.
- Unsupported files are rejected with a message naming the file and explaining
  the supported formats. They must not create a preview or object URL. The
  previously accepted valid image, if any, remains the active selection.
- The active object URL is revoked on clear and unmount, and replaced URLs are
  revoked when the preview changes.

All type checks, builds, unit tests, and the Firefox browser test should pass
after the fix, without changing the test assertions.

## Project structure

```text
.
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── src/
│   ├── App.tsx
│   ├── ImageUpload.tsx
│   ├── ImageUpload.test.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── test/setup.ts
│   └── vite-env.d.ts
└── tests/
    ├── e2e/upload.spec.ts
    └── fixtures/
        ├── blue.png
        ├── notes.txt
        └── red.png
```

## Non-goals

This starter does not include a real upload endpoint, drag-and-drop, multiple
files, image compression, or file-size limits. Validation is limited to the
supported image MIME types.
