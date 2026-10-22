import sharp from 'sharp';

import type {
  CropRectangle,
  FocalPoint,
  ImageDimensions,
  ResolvedThumbnailOptions,
  ThumbnailOptions,
  ThumbnailResult,
} from './types.js';

const DEFAULT_FOCAL_POINT: FocalPoint = Object.freeze({ x: 0.5, y: 0.5 });

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}

export function validateDimensions(width: number, height: number): void {
  assertPositiveInteger(width, 'width');
  assertPositiveInteger(height, 'height');
}

export function validateFocalPoint(point: FocalPoint): void {
  if (typeof point !== 'object' || point === null) {
    throw new TypeError('focalPoint must be an object with numeric x and y values');
  }

  for (const axis of ['x', 'y'] as const) {
    const value = point[axis];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new RangeError(`focalPoint.${axis} must be a finite number`);
    }
    if (value < 0 || value > 1) {
      throw new RangeError(`focalPoint.${axis} must be between 0 and 1`);
    }
  }
}

export function resolveThumbnailOptions(
  options: ThumbnailOptions,
): ResolvedThumbnailOptions {
  validateDimensions(options.width, options.height);

  const focalPoint = options.focalPoint ?? DEFAULT_FOCAL_POINT;
  validateFocalPoint(focalPoint);

  return {
    width: options.width,
    height: options.height,
    focalPoint,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Calculate the source region used for a thumbnail.
 *
 * The returned rectangle is always an integer rectangle inside `source`.
 * Positioning currently uses the center of the source; the focal point is
 * validated by `resolveThumbnailOptions` but is not applied here yet.
 */
export function computeCropRect(
  source: ImageDimensions,
  options: ThumbnailOptions,
): CropRectangle {
  validateDimensions(source.width, source.height);
  const resolved = resolveThumbnailOptions(options);

  const targetAspect = resolved.width / resolved.height;

  // Starter implementation: both axes are scaled by the target aspect.
  // This produces a valid rectangle, but not always one with the requested
  // aspect ratio, so several portrait/landscape combinations are squashed.
  const cropWidth = Math.min(
    source.width,
    Math.max(1, Math.round(source.height * targetAspect)),
  );
  const cropHeight = Math.min(
    source.height,
    Math.max(1, Math.round(source.width * targetAspect)),
  );

  const left = clamp(
    Math.round((source.width - cropWidth) / 2),
    0,
    source.width - cropWidth,
  );
  const top = clamp(
    Math.round((source.height - cropHeight) / 2),
    0,
    source.height - cropHeight,
  );

  return {
    left,
    top,
    width: cropWidth,
    height: cropHeight,
  };
}

async function readSourceDimensions(
  input: string | Buffer,
): Promise<ImageDimensions> {
  const metadata = await sharp(input).metadata();
  const width = metadata.autoOrient?.width ?? metadata.width;
  const height = metadata.autoOrient?.height ?? metadata.height;

  if (width === undefined || height === undefined) {
    throw new Error('Could not determine the source image dimensions');
  }

  validateDimensions(width, height);
  return { width, height };
}

/**
 * Crop and resize an image, writing the result to `outputPath`.
 *
 * The output format is inferred by Sharp from the output file extension.
 */
export async function generateThumbnail(
  input: string | Buffer,
  outputPath: string,
  options: ThumbnailOptions,
): Promise<ThumbnailResult> {
  const resolved = resolveThumbnailOptions(options);
  const source = await readSourceDimensions(input);
  const crop = computeCropRect(source, resolved);

  const info = await sharp(input)
    .autoOrient()
    .extract({
      left: crop.left,
      top: crop.top,
      width: crop.width,
      height: crop.height,
    })
    .resize({
      width: resolved.width,
      height: resolved.height,
      fit: 'fill',
    })
    .toFile(outputPath);

  if (info.width !== resolved.width || info.height !== resolved.height) {
    throw new Error(
      `Sharp wrote ${info.width}x${info.height}, expected ${resolved.width}x${resolved.height}`,
    );
  }

  return {
    outputPath,
    source,
    crop,
    output: {
      width: info.width,
      height: info.height,
    },
  };
}
