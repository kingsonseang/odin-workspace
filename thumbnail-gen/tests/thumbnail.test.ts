import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { generateThumbnail } from '../src/crop.js';
import type { CropRectangle, ImageDimensions } from '../src/types.js';

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const SUBJECT_RED: Rgb = { r: 230, g: 57, b: 70 };

let outputDir = '';

function fixturePath(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
}

function outputPath(name: string): string {
  return join(outputDir, name);
}

function assertCropInside(
  crop: CropRectangle,
  source: ImageDimensions,
): void {
  assert.ok(crop.left >= 0, 'left must not be negative');
  assert.ok(crop.top >= 0, 'top must not be negative');
  assert.ok(crop.width > 0, 'width must be positive');
  assert.ok(crop.height > 0, 'height must be positive');
  assert.ok(
    crop.left + crop.width <= source.width,
    'crop must fit within the source width',
  );
  assert.ok(
    crop.top + crop.height <= source.height,
    'crop must fit within the source height',
  );
}

async function readCenterPixel(filePath: string): Promise<Rgb> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const x = Math.floor(info.width / 2);
  const y = Math.floor(info.height / 2);
  const offset = (y * info.width + x) * info.channels;

  return {
    r: data.readUInt8(offset),
    g: data.readUInt8(offset + 1),
    b: data.readUInt8(offset + 2),
  };
}

function assertColorClose(
  actual: Rgb,
  expected: Rgb,
  message: string,
  tolerance = 8,
): void {
  assert.ok(
    Math.abs(actual.r - expected.r) <= tolerance,
    `${message}: expected red ${expected.r}, received ${actual.r}`,
  );
  assert.ok(
    Math.abs(actual.g - expected.g) <= tolerance,
    `${message}: expected green ${expected.g}, received ${actual.g}`,
  );
  assert.ok(
    Math.abs(actual.b - expected.b) <= tolerance,
    `${message}: expected blue ${expected.b}, received ${actual.b}`,
  );
}

before(async () => {
  outputDir = await mkdtemp(join(tmpdir(), 'thumbnail-gen-'));
});

after(async () => {
  if (outputDir !== '') {
    await rm(outputDir, { recursive: true, force: true });
  }
});

describe('generateThumbnail', () => {
  it('writes the exact requested output dimensions', async () => {
    const result = await generateThumbnail(
      fixturePath('landscape-center.svg'),
      outputPath('exact-size.png'),
      { width: 320, height: 180 },
    );

    assert.deepEqual(result.source, { width: 1200, height: 800 });
    assert.deepEqual(result.output, { width: 320, height: 180 });

    const metadata = await sharp(result.outputPath).metadata();
    assert.equal(metadata.width, 320);
    assert.equal(metadata.height, 180);
  });

  it('centers a square crop from a landscape fixture', async () => {
    const result = await generateThumbnail(
      fixturePath('landscape-center.svg'),
      outputPath('landscape-square.png'),
      { width: 400, height: 400 },
    );

    assert.deepEqual(result.crop, {
      left: 200,
      top: 0,
      width: 800,
      height: 800,
    });
    assertCropInside(result.crop, result.source);

    const center = await readCenterPixel(result.outputPath);
    assertColorClose(center, SUBJECT_RED, 'centered landscape subject');
  });

  it('uses a 16:9 crop for the landscape fixture', async () => {
    const result = await generateThumbnail(
      fixturePath('landscape-center.svg'),
      outputPath('landscape-16x9.png'),
      { width: 320, height: 180 },
    );

    assert.deepEqual(result.crop, {
      left: 0,
      top: 63,
      width: 1200,
      height: 675,
    });
    assertCropInside(result.crop, result.source);
  });

  it('uses a 16:9 crop for the portrait fixture', async () => {
    const result = await generateThumbnail(
      fixturePath('portrait-center.svg'),
      outputPath('portrait-16x9.png'),
      { width: 320, height: 180 },
    );

    assert.deepEqual(result.crop, {
      left: 0,
      top: 375,
      width: 800,
      height: 450,
    });
    assertCropInside(result.crop, result.source);
  });

  it('positions a landscape crop around a focal point', async () => {
    const result = await generateThumbnail(
      fixturePath('landscape-offcenter.svg'),
      outputPath('landscape-focal.png'),
      {
        width: 300,
        height: 400,
        focalPoint: { x: 0.7, y: 0.5 },
      },
    );

    assert.deepEqual(result.crop, {
      left: 540,
      top: 0,
      width: 600,
      height: 800,
    });
    assertCropInside(result.crop, result.source);

    const center = await readCenterPixel(result.outputPath);
    assertColorClose(center, SUBJECT_RED, 'focal-point landscape subject');
  });

  it('positions a portrait crop around a focal point', async () => {
    const result = await generateThumbnail(
      fixturePath('portrait-offcenter.svg'),
      outputPath('portrait-focal.png'),
      {
        width: 400,
        height: 400,
        focalPoint: { x: 0.5, y: 2 / 3 },
      },
    );

    assert.deepEqual(result.crop, {
      left: 0,
      top: 400,
      width: 800,
      height: 800,
    });
    assertCropInside(result.crop, result.source);

    const center = await readCenterPixel(result.outputPath);
    assertColorClose(center, SUBJECT_RED, 'focal-point portrait subject');
  });

  it('handles an extreme tall source without invalid crop bounds', async () => {
    const result = await generateThumbnail(
      fixturePath('tall.svg'),
      outputPath('tall-source.png'),
      { width: 400, height: 300 },
    );

    assert.deepEqual(result.source, { width: 200, height: 1600 });
    assert.deepEqual(result.crop, {
      left: 0,
      top: 725,
      width: 200,
      height: 150,
    });
    assert.deepEqual(result.output, { width: 400, height: 300 });
    assertCropInside(result.crop, result.source);
  });
});
