import sharp from "sharp";

export const DEFAULT_THUMBNAIL_WIDTH = 60;
export const DEFAULT_THUMBNAIL_HEIGHT = 60;
export const DEFAULT_JPEG_QUALITY = 90;

export interface ThumbnailOptions {
  readonly width?: number;
  readonly height?: number;
  readonly quality?: number;
}

export interface ThumbnailResult {
  readonly width: number;
  readonly height: number;
  readonly format: string;
  readonly size: number;
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer; received ${value}`);
  }
}

/**
 * Creates a centre-cropped JPEG thumbnail.
 *
 * Metadata policy for generated files:
 * - All source metadata (EXIF, GPS, XMP, IPTC and ICC) is removed.
 * - No EXIF orientation tag is written; visible pixels must be display-ready.
 *
 * STARTER BUG (intentional): EXIF orientation is never normalized before
 * resizing and cropping. The source pixels are processed in their stored
 * coordinate space, so rotated and mirrored fixtures produce thumbnails that
 * appear incorrectly oriented. The tests exercise this bug.
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {},
): Promise<ThumbnailResult> {
  const width = options.width ?? DEFAULT_THUMBNAIL_WIDTH;
  const height = options.height ?? DEFAULT_THUMBNAIL_HEIGHT;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;

  assertPositiveInteger("width", width);
  assertPositiveInteger("height", height);

  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new RangeError(`quality must be an integer from 1 to 100; received ${quality}`);
  }

  const info = await sharp(inputPath, { failOn: "error" })
    // Deliberately missing source-orientation normalization before this step.
    // Correct behavior requires orientation to be applied before resizing and
    // cropping; this starter processes the stored pixels as-is.
    .resize({
      width,
      height,
      fit: "cover",
      position: "centre",
    })
    // Sharp removes metadata by default. No EXIF orientation is retained,
    // which is only safe when the visible orientation has been normalized.
    .jpeg({
      quality,
      chromaSubsampling: "4:4:4",
    })
    .toFile(outputPath);

  return {
    width: info.width,
    height: info.height,
    format: info.format,
    size: info.size,
  };
}
