# transparent-img

A small strict TypeScript CLI and module for converting PNG, JPEG, and WebP
images with [Sharp](https://sharp.pixelplumbing.com/).

> **This repository intentionally contains a seeded bug.**
>
> Transparent PNG input converted to JPEG currently gets a black background
> because JPEG transparency is not handled explicitly. Background color
> configuration is also intentionally missing. The failing tests document the
> expected behavior for a future fix. No fix is included here.

## Requirements

- Node.js 20.9 or newer
- npm

## Setup

```bash
npm install
npm run fixtures
```

`npm test` also regenerates the fixtures automatically through its `pretest`
script.

## Current behavior

Output format is inferred from the output file extension:

| Extension | Output format | Transparency |
| --- | --- | --- |
| `.png` | PNG | Preserved |
| `.jpg` | JPEG | **Broken: transparent regions become black** |
| `.jpeg` | JPEG | **Broken: transparent regions become black** |
| `.webp` | WebP | Preserved |

Any other extension is rejected with a clear unsupported-format error.

This is the intentionally incomplete part of the exercise:

- There is no `--background` option.
- There is no background-color parser or validator.
- JPEG output does not composite transparent pixels against a background.

### Reproduce the seeded bug

```bash
mkdir -p out
npm run convert -- fixtures/transparent.png out/transparent.jpg
```

The resulting `out/transparent.jpg` is black where the source is transparent.
The relevant contract test currently fails for this reason.

## Target contract

After the exercise is fixed, the converter should satisfy this contract:

1. PNG and WebP outputs preserve alpha.
2. JPEG output composites transparency against a documented background.
3. The JPEG background defaults to **white (`#ffffff`)**.
4. The CLI accepts a background color:

   ```bash
   npm run convert -- input.png output.jpg --background '#ff0000'
   ```

5. Background colors accept CSS-style hex values:
   - `#rgb`
   - `#rrggbb`

   Hex values are case-insensitive.
6. Invalid output formats and invalid background colors must fail with a clear
   error and must not produce an output file.
7. The target tests in `test/convert.test.ts` should pass without being
   modified.

The background setting is relevant to JPEG. PNG and WebP outputs must continue
to preserve transparency.

## Usage

Convert with an inferred output format:

```bash
npm run convert -- fixtures/opaque.png out/opaque.webp
npm run convert -- fixtures/semi-transparent.png out/semi-transparent.png
```

The CLI currently accepts exactly two arguments:

```text
npm run convert -- <input> <output>
```

The target interface adds an optional `--background <color>` argument for JPEG
output.

### Module usage

```ts
import { convertImage } from './src/convert.js';

await convertImage('fixtures/opaque.png', 'out/opaque.webp');
```

## Fixtures

The fixture generator creates three deterministic 8×8 PNG files under
`fixtures/`:

| File | RGBA value | Purpose |
| --- | --- | --- |
| `transparent.png` | `rgba(255, 0, 0, 0)` | Fully transparent pixels |
| `semi-transparent.png` | `rgba(0, 80, 255, 128)` | Partially transparent pixels |
| `opaque.png` | `rgba(0, 140, 255, 255)` | Fully opaque pixels |

Each file is a solid image, making representative-pixel assertions stable.

Generate or regenerate them at any time:

```bash
npm run fixtures
```

The generation logic is in `scripts/generate-fixtures.ts`; it uses raw RGBA
buffers encoded as PNG so the alpha values are exact.

## Tests

Run the test suite:

```bash
npm test
```

Run the strict TypeScript checker:

```bash
npm run typecheck
```

### Expected status in the seeded state

The suite is intentionally red. Currently:

- **6 tests pass**:
  - PNG conversion, format, dimensions, partial/full transparency, and opaque
    pixel values
  - WebP conversion, format, dimensions, partial/full transparency, and opaque
    pixel values
  - Opaque JPEG conversion, format, dimensions, and pixel values
  - Reading JPEG and WebP inputs
  - Unsupported-format rejection through the module and CLI
- **6 contract tests fail**:
  - Fully transparent PNG → JPEG should use a white default background
    (actual result: black)
  - Partially transparent PNG → JPEG should blend against white
    (actual result: dark/black composite)
  - `--background '#ff0000'` should control the JPEG background
    (actual result: unsupported argument)
  - Three invalid background color cases should be rejected with an
    invalid-background-color error (actual result: generic usage error)

After implementing the target contract, all 12 tests should pass.

The test suite checks:

- Output formats via Sharp metadata
- Width and height preservation
- Representative pixel RGBA values
- Alpha preservation for PNG and WebP
- Default JPEG compositing behavior
- Configurable JPEG background behavior
- Invalid output formats
- Invalid background colors
- That rejected conversions do not create output files

## Project structure

```text
.
├── fixtures/
│   ├── opaque.png
│   ├── semi-transparent.png
│   └── transparent.png
├── scripts/
│   └── generate-fixtures.ts
├── src/
│   └── convert.ts
├── test/
│   └── convert.test.ts
├── package.json
├── tsconfig.json
└── README.md
```
