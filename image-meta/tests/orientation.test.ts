import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import sharp from "sharp";

import {
  DEFAULT_THUMBNAIL_HEIGHT,
  DEFAULT_THUMBNAIL_WIDTH,
  generateThumbnail,
} from "../src/thumbnail.js";
import {
  assertJpegDimensions,
  assertUprightQuadrants,
  findFixture,
  fixturePath,
  loadFixtureManifest,
  type FixtureManifest,
  type Orientation,
} from "./helpers.js";

let workDir: string | undefined;
let manifest: FixtureManifest;
const outputs = new Map<Orientation, string>();

before(async () => {
  workDir = await mkdtemp(join(tmpdir(), "image-meta-orientation-"));
  manifest = await loadFixtureManifest();

  for (const fixture of manifest.fixtures) {
    const outputPath = join(workDir, `thumbnail-orientation-${fixture.orientation}.jpg`);
    await generateThumbnail(fixturePath(fixture), outputPath);
    outputs.set(fixture.orientation, outputPath);
  }
});

after(async () => {
  if (workDir !== undefined) {
    await rm(workDir, { recursive: true, force: true });
  }
});

function outputFor(orientation: Orientation): string {
  const outputPath = outputs.get(orientation);

  if (outputPath === undefined) {
    throw new Error(`No thumbnail was generated for orientation ${orientation}`);
  }

  return outputPath;
}

test("fixtures carry the declared EXIF orientation tags", async () => {
  for (const fixture of manifest.fixtures) {
    const metadata = await sharp(fixturePath(fixture)).metadata();

    assert.equal(
      metadata.orientation,
      fixture.orientation,
      `${fixture.fileName} should carry EXIF orientation ${fixture.orientation}`,
    );
  }
});

test("thumbnails have exact JPEG dimensions for every orientation", async () => {
  for (const fixture of manifest.fixtures) {
    await assertJpegDimensions(
      outputFor(fixture.orientation),
      DEFAULT_THUMBNAIL_WIDTH,
      DEFAULT_THUMBNAIL_HEIGHT,
    );
  }
});

test("already correctly oriented images remain upright", async () => {
  const outputPath = outputFor(1);

  await assertJpegDimensions(outputPath, DEFAULT_THUMBNAIL_WIDTH, DEFAULT_THUMBNAIL_HEIGHT);
  await assertUprightQuadrants(outputPath, "EXIF orientation 1");
});

for (const orientation of [2, 6, 8] as const) {
  test(`normalizes EXIF orientation ${orientation} before resizing and cropping`, async () => {
    const fixture = findFixture(manifest, orientation);
    const outputPath = outputFor(orientation);

    await assertJpegDimensions(outputPath, DEFAULT_THUMBNAIL_WIDTH, DEFAULT_THUMBNAIL_HEIGHT);
    await assertUprightQuadrants(outputPath, `${fixture.fileName} (EXIF orientation ${orientation})`);
  });
}
