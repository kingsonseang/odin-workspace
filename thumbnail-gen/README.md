# thumbnail-gen

A small, strict TypeScript thumbnail generator built on
[Sharp](https://sharp.pixelplumbing.com/). It crops an image to the requested
aspect ratio and writes an exact-size thumbnail.

The repository is intentionally incomplete. It is a starter exercise with two
seeded gaps:

1. **Crop dimensions are calculated incorrectly for several aspect-ratio
   combinations.** Some portrait and landscape sources are cropped with the
   wrong dimensions and are then squashed by the final resize.
2. **Focal-point positioning is not implemented.** `focalPoint` is accepted and
   validated, but every crop is currently centered.

These gaps are described in [Known starter gaps](#known-starter-gaps). The test
suite describes the intended contract and therefore contains expected failures.
The project runs, validates input, produces thumbnails, and writes files; the
two incomplete areas are deliberate.

## Requirements

- Node.js 20.11 or newer
- npm 10 or newer
- No system ImageMagick installation is required; Sharp supplies the image
  processing runtime.

## Install

```bash
npm ci
```

If `package-lock.json` is unavailable, use `npm install` instead.

## Run

### Command line

```bash
mkdir -p out

npm run thumbnail -- \
  fixtures/landscape-center.svg \
  out/landscape-16x9.png \
  --width 320 \
  --height 180
```

With a focal point:

```bash
npm run thumbnail -- \
  fixtures/landscape-offcenter.svg \
  out/landscape-focal.png \
  --width 300 \
  --height 400 \
  --focal-x 0.7 \
  --focal-y 0.5
```

The CLI prints the source dimensions, selected crop rectangle, requested focal
point, and actual output dimensions as JSON:

```json
{
  "outputPath": "out/landscape-16x9.png",
  "source": { "width": 1200, "height": 800 },
  "crop": { "left": 0, "top": 0, "width": 1200, "height": 800 },
  "output": { "width": 320, "height": 180 },
  "focalPoint": { "x": 0.5, "y": 0.5 }
}
```

The values above illustrate the current starter output for the first command.
They do not satisfy the documented contract: the correct crop is
`{ left: 0, top: 63, width: 1200, height: 675 }`.

Run `npm run thumbnail -- --help` for usage.

### Programmatic API

```ts
import { generateThumbnail } from './src/index.js';

const result = await generateThumbnail(
  'fixtures/landscape-offcenter.svg',
  'out/thumbnail.png',
  {
    width: 300,
    height: 400,
    focalPoint: { x: 0.7, y: 0.5 },
  },
);

console.log(result.source);
console.log(result.crop);
console.log(result.output);
```

`computeCropRect(source, options)` is also exported for calculating a crop
without decoding or writing an image.

## Image-processing contract

### Output size

- `width` and `height` are required positive safe integers.
- The written image must have exactly the requested width and height.
- Upscaling is allowed when the requested dimensions are larger than the source.
- Zero, negative, fractional, non-finite, and unsafe-integer dimensions are
  rejected with a `RangeError`.
- The output format is inferred by Sharp from the output file extension (for
  example `.png`, `.jpg`, `.webp`, `.avif`).

### Source orientation

- The source is auto-oriented using its EXIF orientation before dimensions and
  crop coordinates are interpreted.
- `result.source` and `result.crop` refer to the oriented source.

### Crop dimensions and bounds

- The crop is the largest integer rectangle inside the source that matches the
  requested output aspect ratio, subject to one-pixel integer rounding.
- The crop width and height are at least 1 pixel.
- The rectangle uses a top-left origin: `{ left, top, width, height }`.
- All crop coordinates are integers.
- `left >= 0`, `top >= 0`,
  `left + width <= source.width`, and `top + height <= source.height`.
- If the source already has the requested aspect ratio, the crop covers the
  whole source.
- Extreme values such as a `1000×1` or `1×1000` output must still produce valid
  crop bounds and exact output dimensions.

### Centering and focal points

- With no focal point, the crop is centered in the source.
- The default focal point is `{ x: 0.5, y: 0.5 }`.
- `focalPoint` is optional and uses normalized image coordinates:
  - `x = 0` is the left edge; `x = 1` is the right edge.
  - `y = 0` is the top edge; `y = 1` is the bottom edge.
- The crop should be positioned so the focal point is at the crop center when
  possible.
- Crop origins are rounded to the nearest pixel, with half values rounded up.
- Positions are clamped so the crop never extends beyond the source. A focal
  point at `0` or `1` therefore places the crop flush against that edge.
- Focal-point coordinates must be finite numbers in `[0, 1]`; otherwise a
  `RangeError` is thrown.
- With `{ x: 0.5, y: 0.5 }`, the result must be the same centered crop as when
  `focalPoint` is omitted.

### Result

- `result.source` is the oriented source size.
- `result.crop` is the applied source rectangle.
- `result.output` is the actual size reported by Sharp after writing the file.
- The output dimensions reported by Sharp must match the requested dimensions.

## Known starter gaps

### Seeded crop-dimension defect

`computeCropRect` in `src/crop.ts` currently scales both axes by the target
aspect ratio. The constrained axis should use the reciprocal relationship. The
existing `min()` guards keep the crop inside the source, but the selected
rectangle often has the wrong aspect ratio.

Examples:

| Source | Requested | Current crop | Contract crop |
| --- | --- | --- | --- |
| 1200 × 800 | 320 × 180 | 1200 × 800 | 1200 × 675 at top 63 |
| 800 × 1200 | 320 × 180 | 800 × 1200 | 800 × 450 at top 375 |
| 200 × 1600 | 400 × 300 | 200 × 267 at top 667 | 200 × 150 at top 725 |

### Missing focal-point behavior

`focalPoint` is part of the public type and CLI, and invalid values are rejected.
However, `computeCropRect` always calculates the centered position. The
landscape and portrait focal-point tests therefore fail in the starter.

## Fixtures

The fixtures are synthetic SVG images with no third-party content. They are
dedicated to the public domain under CC0 1.0; see `fixtures/README.md`.

| Fixture | Size | Subject center | Use |
| --- | ---: | ---: | --- |
| `landscape-center.svg` | 1200 × 800 | (600, 400) | Centered landscape |
| `landscape-offcenter.svg` | 1200 × 800 | (840, 400) | Focal point (0.7, 0.5) |
| `portrait-center.svg` | 800 × 1200 | (400, 600) | Centered portrait |
| `portrait-offcenter.svg` | 800 × 1200 | (400, 800) | Focal point (0.5, 0.6667) |
| `panorama.svg` | 1600 × 200 | (800, 100) | Extreme landscape ratio |
| `tall.svg` | 200 × 1600 | (100, 800) | Extreme portrait ratio |

The red subject circle and four colored corner blocks make crop movement visible.
The fixtures intentionally avoid text so rendering does not depend on fonts.

## Tests

```bash
npm run typecheck
npm test
```

The suite uses Node's built-in test runner through `tsx`. It covers:

- dimension and focal-point validation;
- centered crops for portrait and landscape sources;
- known problematic aspect-ratio conversions;
- extremely wide and tall output ratios;
- horizontal and vertical focal-point edge clamping;
- exact output dimensions from actual Sharp processing;
- crop rectangles and center-pixel assertions against the fixtures.

**The starter test run is expected to fail.** The crop-contract and focal-point
tests exercise behavior that has deliberately not been implemented. No passing
test result is claimed for those behaviors. A green run requires fixing both
seeded gaps.

## Verify dimensions and crop positions

### Read dimensions from the written file

```bash
node --input-type=module -e "
import sharp from 'sharp';
const metadata = await sharp('out/landscape-16x9.png').metadata();
console.log({ width: metadata.width, height: metadata.height });
"
```

The CLI also prints `output.width` and `output.height`; these come from the
`info` object returned by Sharp's `toFile`.

### Inspect the crop position

The CLI's `crop` object is the rectangle passed to Sharp's `extract` operation:

```bash
npm run thumbnail -- \
  fixtures/landscape-offcenter.svg \
  out/landscape-focal.png \
  --width 300 \
  --height 400 \
  --focal-x 0.7 --focal-y 0.5
```

The correct crop for that command is:

```json
{ "left": 540, "top": 0, "width": 600, "height": 800 }
```

The starter currently reports `left: 300` because it centers the crop.

### Inspect the center pixel

After fixing focal-point behavior, the off-center subject should cover the
center of the output:

```bash
node --input-type=module -e "
import sharp from 'sharp';
const { data, info } = await sharp('out/landscape-focal.png')
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const x = Math.floor(info.width / 2);
const y = Math.floor(info.height / 2);
const i = (y * info.width + x) * info.channels;
console.log({ r: data[i], g: data[i + 1], b: data[i + 2] });
"
```

The expected subject color is approximately `{ r: 230, g: 57, b: 70 }`.

## Project layout

```text
src/types.ts    Public types and result shapes
src/crop.ts     Validation, crop calculation, Sharp pipeline
src/cli.ts      npm run thumbnail CLI
src/index.ts    Public exports
tests/          Unit and integration tests
fixtures/       Synthetic CC0 source images
```

## License

The source code is licensed under the MIT License. The fixture images are
dedicated to the public domain under CC0 1.0.
