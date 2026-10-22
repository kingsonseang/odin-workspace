# image-meta thumbnail starter

A small, strict TypeScript project that generates square JPEG thumbnails with
[Sharp](https://sharp.pixelplumbing.com/).

> **Starter status: intentionally failing.**
>
> The thumbnail pipeline currently ignores the JPEG EXIF `Orientation` tag.
> Resizing and cropping therefore happen in the stored pixel coordinate space,
> and rotated or mirrored inputs produce improperly oriented thumbnails. The
> test suite exposes this bug. **The fix is intentionally not implemented in
> this starter.**

## Requirements

- Node.js 20.11 or newer
- npm

## Setup

```sh
npm install
npm run fixtures
```

`npm install` installs Sharp's native dependency. `npm run fixtures` creates four
deterministic JPEG fixtures and a manifest in `test/fixtures/`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run fixtures` | Regenerate the synthetic JPEG fixtures and manifest. |
| `npm run typecheck` | Type-check source, scripts, and tests with strict TypeScript. |
| `npm run build` | Compile `src/` to `dist/` with declarations. |
| `npm test` | Type-check, regenerate fixtures, and run the test suite. |

Run the tests with:

```sh
npm test
```

The current starter is expected to report **7 tests: 4 passing, 3 failing** and
exit with a non-zero status. The three failures are the orientation tests for
EXIF values 2, 6, and 8. They are the reproduction of the intentional bug:

```text
✖ normalizes EXIF orientation 2 before resizing and cropping
✖ normalizes EXIF orientation 6 before resizing and cropping
✖ normalizes EXIF orientation 8 before resizing and cropping
```

Do not make these tests pass by changing their expected colours, skipping them,
or only checking filenames. They inspect decoded output pixels.

## The intentional bug

`src/thumbnail.ts` exports:

```ts
generateThumbnail(inputPath, outputPath, {
  width?: number,
  height?: number,
  quality?: number,
})
```

The pipeline resizes with `fit: "cover"` and writes a JPEG, but it does not
normalize source orientation before resizing and cropping. As a result:

- orientation 1 already looks correct and passes;
- orientation 2 is displayed as its mirrored stored pixels;
- orientations 6 and 8 are displayed with the wrong rotation.

Sharp strips metadata by default. That means the broken outputs contain no EXIF
orientation tag that a viewer could use to compensate, so the visible pixels
themselves are wrong.

## Intended orientation behavior

The intended behavior is:

1. Read the source EXIF orientation.
2. Normalize/mirror the image so its visible pixels are upright.
3. Resize and centre-crop the normalized image.
4. Write a metadata-free JPEG whose pixels are ready to display.

The normalization step belongs **before** resizing and cropping. This starter
deliberately omits it.

## Metadata policy

Generated thumbnails intentionally contain:

- no EXIF metadata (including no `Orientation` tag);
- no GPS data;
- no camera make/model or other identifying EXIF fields;
- no XMP or IPTC metadata;
- no ICC profile.

Visible orientation is baked into the output pixels, so output files do not rely
on metadata for correct display. The source fixtures include synthetic camera
identifiers, GPS coordinates, XMP, and an ICC profile. The metadata test parses
the source EXIF to confirm those values exist, then verifies that the output has
none of them.

## Fixtures

All fixtures are synthetic 90×60 logical layouts with four strongly coloured
quadrants. Stored pixels are transformed as needed, then an EXIF orientation tag
is attached:

| File | EXIF orientation | Stored size | Intended display |
| --- | ---: | ---: | --- |
| `orientation-1-normal.jpg` | 1 | 90×60 | Upright, unmodified |
| `orientation-2-mirrored.jpg` | 2 | 90×60 | Mirror of stored pixels |
| `orientation-6-rotate-90-cw.jpg` | 6 | 60×90 | Rotated 90° clockwise from stored |
| `orientation-8-rotate-270-cw.jpg` | 8 | 60×90 | Rotated 270° clockwise from stored |

Generation is deterministic and idempotent: `scripts/generate-fixtures.ts`
recreates the directory each time. The JPEGs are included in this starter so
they can be inspected immediately; `npm test` regenerates them through the
`pretest` hook.

## What the tests inspect

- **Source fixtures:** Sharp reads the actual EXIF orientation from each JPEG.
- **Dimensions:** every output is checked as a 60×60 JPEG using both Sharp
  metadata and decoded raw image dimensions.
- **Visible orientation:** decoded output pixels are sampled at the four
  quadrant centres and classified against the expected red/green/blue/yellow
  layout. This catches wrong rotation, mirroring, and normalization after
  cropping without relying on filenames.
- **Already upright input:** the orientation-1 fixture must continue to work.
- **Metadata policy:** the source is checked for EXIF/GPS/XMP/ICC with
  `exif-reader`; the output is checked for their complete absence with Sharp.

## API example

```ts
import { generateThumbnail } from "./src/thumbnail.js";

const result = await generateThumbnail("input.jpg", "thumbnail.jpg", {
  width: 60,
  height: 60,
  quality: 90,
});

console.log(result);
// { width: 60, height: 60, format: "jpeg", size: ... }
```

The output directory must already exist. By default thumbnails are 60×60 at
JPEG quality 90 with 4:4:4 chroma subsampling.

## Project layout

```text
.
├── src/
│   └── thumbnail.ts
├── scripts/
│   └── generate-fixtures.ts
├── tests/
│   ├── helpers.ts
│   ├── metadata.test.ts
│   └── orientation.test.ts
├── test/fixtures/          # generated JPEG fixtures + manifest.json
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```
