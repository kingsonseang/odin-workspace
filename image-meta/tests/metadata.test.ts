import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import exifReader from "exif-reader";
import sharp from "sharp";

import {
  DEFAULT_THUMBNAIL_HEIGHT,
  DEFAULT_THUMBNAIL_WIDTH,
  generateThumbnail,
} from "../src/thumbnail.js";
import { findFixture, fixturePath, loadFixtureManifest } from "./helpers.js";

let workDir: string | undefined;

after(async () => {
  if (workDir !== undefined) {
    await rm(workDir, { recursive: true, force: true });
  }
});

test("removes EXIF, GPS, XMP, IPTC, and ICC metadata from thumbnails", async () => {
  const manifest = await loadFixtureManifest();
  const fixture = findFixture(manifest, 6);
  const sourcePath = fixturePath(fixture);
  const sourceMetadata = await sharp(sourcePath).metadata();

  assert.equal(
    sourceMetadata.orientation,
    6,
    "the metadata-policy fixture must carry a non-default EXIF orientation",
  );

  const sourceExif = sourceMetadata.exif;
  assert.ok(sourceExif, "the source fixture must contain EXIF metadata");

  const parsedSourceExif = exifReader(sourceExif);
  const sourceGps = parsedSourceExif.GPSInfo;

  assert.ok(sourceGps, "the source fixture must contain a GPS EXIF directory");
  assert.equal(sourceGps.GPSLatitudeRef, "N", "the source fixture must contain GPS latitude");
  assert.ok(
    Array.isArray(sourceGps.GPSLatitude) && sourceGps.GPSLatitude.length > 0,
    "the source fixture must contain parsed GPS coordinates",
  );
  assert.equal(
    parsedSourceExif.Image?.Make,
    "Fixture Camera Co.",
    "the source fixture must contain identifying camera metadata",
  );
  assert.ok(sourceMetadata.xmp, "the source fixture must contain XMP metadata");
  assert.ok(sourceMetadata.icc, "the source fixture must contain an ICC profile");

  workDir = await mkdtemp(join(tmpdir(), "image-meta-policy-"));
  const outputPath = join(workDir, "metadata-policy.jpg");

  const result = await generateThumbnail(sourcePath, outputPath);

  assert.equal(result.width, DEFAULT_THUMBNAIL_WIDTH);
  assert.equal(result.height, DEFAULT_THUMBNAIL_HEIGHT);
  assert.equal(result.format, "jpeg");
  assert.ok(result.size > 0, "thumbnail should contain JPEG data");

  const metadata = await sharp(outputPath).metadata();

  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, DEFAULT_THUMBNAIL_WIDTH);
  assert.equal(metadata.height, DEFAULT_THUMBNAIL_HEIGHT);
  assert.equal(metadata.orientation, undefined, "output must not contain an EXIF orientation tag");
  assert.equal(metadata.exif, undefined, "output must not contain EXIF or GPS data");
  assert.equal(metadata.xmp, undefined, "output must not contain XMP data");
  assert.equal(metadata.xmpAsString, undefined, "output must not contain decoded XMP data");
  assert.equal(metadata.iptc, undefined, "output must not contain IPTC data");
  assert.equal(metadata.icc, undefined, "output must not retain the source ICC profile");
  assert.equal(metadata.hasProfile, false, "output must not advertise an embedded profile");
});
