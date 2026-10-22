# batch-img

A small TypeScript exercise for safe batch image resizing with
[Sharp](https://sharp.pixelplumbing.com/).

The single-image path works. The batch path is **intentionally incomplete and
unsafe**. This repository is an exercise baseline: the acceptance tests fail
until batch processing is implemented correctly. The defects are left in place
on purpose so they can be investigated and fixed.

> Do not treat the current batch implementation as production-ready.

## What already works

- `resizeImage()` validates options, decodes one supported image with Sharp,
  resizes it within the requested bounds, writes an explicit output path, and
  returns source/output metadata.
- The CLI can resize a single image.
- TypeScript is strict, fixtures are reproducible, and unit tests pass.
- Unsupported files fail through `ImageProcessingError`.

## Seeded batch defects

`processBatch()` in `src/processor.ts` currently:

1. **Uses a lossy output name.** It drops the source extension and replaces it
   with the requested output format extension. With the default JPEG format,
   `02-shared.png` and `02-shared.jpg` both become `02-shared.jpg`.
2. **Writes over existing files.** It does not inspect the output directory and
   calls `resizeImage()` with an existing path. The planted files
   `fixtures/output/01-valid.jpg` and `fixtures/output/02-shared.jpg` are
   overwritten when the output directory starts with fixtures in place.
3. **Aborts the whole batch on the first bad file.** It has no per-file error
   handling. The corrupt `03-broken.jpg` throws out of `processBatch()`, so
   `04-late-valid.png` is never processed and no summary is returned.

A run against a copy of the fixtures therefore produces only two files
(`01-valid.jpg` and `02-shared.jpg`, the latter written twice) and then exits
with an error.

## Task

Extend the batch workflow without changing the single-image contract:

- Produce deterministic output names that stay unique when two source files
  share a base name with different extensions.
- Never overwrite a file that already exists in the output directory.
  Existing files must remain byte-for-byte unchanged.
- Still process every decodable input. Protecting an existing file must not be
  achieved by dropping a valid input; use deterministic disambiguation instead.
- Handle failures per file. One undecodable image must not stop later files.
- Report each failure with the input path and a useful error message.
- Return counts and paths that agree with what was actually written:
  - `totalFiles` is the number of supported image candidates discovered.
  - Each candidate produces exactly one result: `processed`, `skipped`, or
    `failed`.
  - `processed`, `skipped`, and `failed` equal the corresponding result counts.
  - Every `processed` result points to a distinct file that exists on disk.
- Ignore non-image extensions such as `.txt`.
- Keep the CLI usable, with a non-zero exit code when any file fails.
- Do not add network services, a database, or an elaborate UI.

No particular naming scheme is required. It must be stable and collision-free
for the fixture set and preserve pre-existing files.

## Requirements

- Node.js **20.11 or newer** (developed and tested with Node 20.11.1)
- npm 10 or newer
- Sharp's supported platforms (macOS, Linux, Windows)

The project pins its dependencies and includes `package-lock.json`.

## Setup

```bash
cd batch-img
npm ci
```

If the binary fixtures are missing or you want to regenerate the canonical set:

```bash
npm run fixtures:generate
```

That command is idempotent: it recreates the fixture images, the deliberately
corrupt file, the text file, and the pre-existing output sentinels.

Useful checks:

```bash
npm run typecheck      # strict TypeScript, no emit
npm run test:unit      # single-image tests; should pass now
npm run test:acceptance # batch contract; expected to fail before the fix
npm test               # full suite; expected to fail before the fix
npm run build          # emits compiled JS into dist/
```

## CLI

Single image:

```bash
npm run resize -- fixtures/input/01-valid.png /tmp/01-valid.jpg \
  --width 200 --height 150 --format jpeg --quality 82
```

Batch:

```bash
npm run batch -- fixtures/input /tmp/batch-output \
  --width 200 --height 150 --format jpeg
```

Options are available from `npm run start -- --help`:

- `--width`, `--height`: maximum dimensions (defaults `320x240`)
- `--fit`: `cover`, `contain`, `fill`, `inside`, or `outside` (default `inside`)
- `--format`: `jpeg`, `png`, or `webp` (default `jpeg`)
- `--quality`: `1` through `100` for JPEG/WebP (default `80`)

Use a temporary output directory for manual batch runs. The current buggy batch
will overwrite files there if names collide.

## Repository layout

```text
batch-img/
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
├── scripts/
│   └── generate-fixtures.ts
├── src/
│   ├── cli.ts
│   └── processor.ts
├── tests/
│   ├── batch.acceptance.test.ts
│   └── processor.test.ts
└── fixtures/
    ├── input/
    │   ├── 01-valid.png           # 640x480 valid PNG
    │   ├── 02-shared.jpg          # 360x480 valid JPEG, shares a base name
    │   ├── 02-shared.png          # 480x320 valid PNG, shares a base name
    │   ├── 03-broken.jpg          # text with a .jpg extension; not decodable
    │   ├── 04-late-valid.png      # 800x200 valid PNG, sorted after the bad file
    │   └── notes.txt              # non-image; must be ignored
    └── output/
        ├── 01-valid.jpg           # pre-existing sentinel; must not change
        ├── 02-shared.jpg          # pre-existing sentinel; must not change
        └── keep-me.txt            # pre-existing non-image sentinel; must not change
```

All image fixtures are synthetic and generated locally by
`scripts/generate-fixtures.ts`. Tests copy fixtures into a temporary directory,
so test runs never modify the tracked fixture files.

## Acceptance tests

`tests/processor.test.ts` covers the working single-image behavior. It should
continue to pass.

`tests/batch.acceptance.test.ts` encodes the batch contract:

1. **Resilience:** every valid image is processed, the corrupt image produces
   one accurate failure result, and processing continues after that failure.
2. **No overwrite:** all pre-existing output files remain byte-for-byte
   identical.
3. **Collision handling:** duplicate base names get distinct output paths, and
   output names are stable across two fresh runs with identical inputs.
4. **Summary accuracy:** result counts, processed output paths, and newly
   created files all agree.

The tests intentionally do not dictate an output-name format. They compare the
names returned in the summary with the files on disk and across runs.

Current expected status before implementation:

```text
tests/processor.test.ts        3 passed
tests/batch.acceptance.test.ts 4 failed
```

The acceptance suite should pass once the batch workflow satisfies the contract.
Do not weaken the assertions or alter fixtures to make the tests pass.

## Notes on the current behavior

The batch walks supported files in sorted order. With the fixture set, that order
is:

```text
01-valid.png
02-shared.jpg
02-shared.png
03-broken.jpg
04-late-valid.png
```

The first two valid files already demonstrate the overwrite problem, and the
corrupt file aborts before `04-late-valid.png`. This order is deterministic so
the defects reproduce consistently.
