import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeCropRect,
  resolveThumbnailOptions,
  validateDimensions,
  validateFocalPoint,
} from '../src/crop.js';
import type {
  CropRectangle,
  FocalPoint,
  ImageDimensions,
  ThumbnailOptions,
} from '../src/types.js';

function options(
  width: number,
  height: number,
  focalPoint?: FocalPoint,
): ThumbnailOptions {
  return focalPoint === undefined
    ? { width, height }
    : { width, height, focalPoint };
}

function assertCropInside(
  crop: CropRectangle,
  source: ImageDimensions,
): void {
  assert.ok(Number.isInteger(crop.left), 'left must be an integer');
  assert.ok(Number.isInteger(crop.top), 'top must be an integer');
  assert.ok(Number.isInteger(crop.width), 'width must be an integer');
  assert.ok(Number.isInteger(crop.height), 'height must be an integer');
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

describe('dimension validation', () => {
  it('accepts positive safe integers', () => {
    assert.doesNotThrow(() => validateDimensions(1, 1));
    assert.doesNotThrow(() => validateDimensions(1200, 800));
  });

  it('rejects zero, negative, fractional, and non-finite dimensions', () => {
    for (const [width, height] of [
      [0, 100],
      [100, 0],
      [-1, 100],
      [100, -1],
      [100.5, 100],
      [100, Number.NaN],
      [Number.POSITIVE_INFINITY, 100],
    ] as const) {
      assert.throws(
        () => validateDimensions(width, height),
        RangeError,
        `${width}x${height} should be rejected`,
      );
    }
  });

  it('rejects unsafe integers', () => {
    assert.throws(
      () => validateDimensions(Number.MAX_SAFE_INTEGER + 1, 100),
      RangeError,
    );
  });
});

describe('focal point validation', () => {
  it('accepts normalized points including both edges', () => {
    for (const point of [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ]) {
      assert.doesNotThrow(() => validateFocalPoint(point));
    }
  });

  it('rejects out-of-range and non-finite coordinates', () => {
    for (const point of [
      { x: -0.01, y: 0.5 },
      { x: 1.01, y: 0.5 },
      { x: 0.5, y: -0.01 },
      { x: 0.5, y: 1.01 },
      { x: Number.NaN, y: 0.5 },
      { x: 0.5, y: Number.POSITIVE_INFINITY },
    ]) {
      assert.throws(() => validateFocalPoint(point), RangeError);
    }
  });

  it('defaults the focal point to the center', () => {
    assert.deepEqual(resolveThumbnailOptions(options(100, 100)).focalPoint, {
      x: 0.5,
      y: 0.5,
    });
  });
});

describe('computeCropRect', () => {
  it('centers a square crop from a landscape source', () => {
    const source = { width: 1200, height: 800 };
    const crop = computeCropRect(source, options(400, 400));

    assert.deepEqual(crop, { left: 200, top: 0, width: 800, height: 800 });
    assertCropInside(crop, source);
  });

  it('centers a square crop from a portrait source', () => {
    const source = { width: 800, height: 1200 };
    const crop = computeCropRect(source, options(400, 400));

    assert.deepEqual(crop, { left: 0, top: 200, width: 800, height: 800 });
    assertCropInside(crop, source);
  });

  it('crops a 3:2 landscape source to a 16:9 aspect ratio', () => {
    const source = { width: 1200, height: 800 };
    const crop = computeCropRect(source, options(320, 180));

    assert.deepEqual(crop, { left: 0, top: 63, width: 1200, height: 675 });
    assertCropInside(crop, source);
    assert.ok(
      Math.abs(crop.width / crop.height - 320 / 180) < 0.002,
      'crop should have the requested aspect ratio',
    );
  });

  it('crops a 2:3 portrait source to a 16:9 aspect ratio', () => {
    const source = { width: 800, height: 1200 };
    const crop = computeCropRect(source, options(320, 180));

    assert.deepEqual(crop, { left: 0, top: 375, width: 800, height: 450 });
    assertCropInside(crop, source);
    assert.ok(
      Math.abs(crop.width / crop.height - 320 / 180) < 0.002,
      'crop should have the requested aspect ratio',
    );
  });

  it('handles an extremely wide output aspect ratio', () => {
    const source = { width: 1200, height: 800 };
    const crop = computeCropRect(source, options(1000, 1));

    assert.deepEqual(crop, { left: 0, top: 400, width: 1200, height: 1 });
    assertCropInside(crop, source);
  });

  it('handles an extremely tall output aspect ratio', () => {
    const source = { width: 1200, height: 800 };
    const crop = computeCropRect(source, options(1, 1000));

    assert.deepEqual(crop, { left: 600, top: 0, width: 1, height: 800 });
    assertCropInside(crop, source);
  });

  it('handles an extreme panorama source', () => {
    const source = { width: 1600, height: 200 };
    const crop = computeCropRect(source, options(400, 100));

    assert.deepEqual(crop, { left: 400, top: 0, width: 800, height: 200 });
    assertCropInside(crop, source);
  });

  it('handles an extreme tall source', () => {
    const source = { width: 200, height: 1600 };
    const crop = computeCropRect(source, options(400, 300));

    assert.deepEqual(crop, { left: 0, top: 725, width: 200, height: 150 });
    assertCropInside(crop, source);
  });

  it('moves a landscape crop toward a normalized focal point', () => {
    const source = { width: 1200, height: 800 };
    const crop = computeCropRect(
      source,
      options(300, 400, { x: 0.7, y: 0.5 }),
    );

    assert.deepEqual(crop, { left: 540, top: 0, width: 600, height: 800 });
    assertCropInside(crop, source);
  });

  it('moves a portrait crop toward a normalized focal point', () => {
    const source = { width: 800, height: 1200 };
    const crop = computeCropRect(
      source,
      options(400, 400, { x: 0.5, y: 2 / 3 }),
    );

    assert.deepEqual(crop, { left: 0, top: 400, width: 800, height: 800 });
    assertCropInside(crop, source);
  });

  it('keeps horizontal focal points at the image edges inside the source', () => {
    const source = { width: 1200, height: 800 };
    const leftEdge = computeCropRect(
      source,
      options(300, 400, { x: 0, y: 0.5 }),
    );
    const rightEdge = computeCropRect(
      source,
      options(300, 400, { x: 1, y: 0.5 }),
    );

    assert.deepEqual(leftEdge, { left: 0, top: 0, width: 600, height: 800 });
    assert.deepEqual(rightEdge, {
      left: 600,
      top: 0,
      width: 600,
      height: 800,
    });
    assertCropInside(leftEdge, source);
    assertCropInside(rightEdge, source);
  });

  it('keeps vertical focal points at the image edges inside the source', () => {
    const source = { width: 200, height: 1600 };
    const topEdge = computeCropRect(
      source,
      options(400, 400, { x: 0.5, y: 0 }),
    );
    const bottomEdge = computeCropRect(
      source,
      options(400, 400, { x: 0.5, y: 1 }),
    );

    assert.deepEqual(topEdge, { left: 0, top: 0, width: 200, height: 200 });
    assert.deepEqual(bottomEdge, {
      left: 0,
      top: 1400,
      width: 200,
      height: 200,
    });
    assertCropInside(topEdge, source);
    assertCropInside(bottomEdge, source);
  });

  it('treats a missing focal point like 0.5, 0.5', () => {
    const source = { width: 1200, height: 800 };
    const centered = computeCropRect(source, options(320, 180));
    const explicitCenter = computeCropRect(
      source,
      options(320, 180, { x: 0.5, y: 0.5 }),
    );

    assert.deepEqual(centered, explicitCenter);
  });
});
