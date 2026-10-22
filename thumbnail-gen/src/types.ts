/**
 * Dimensions in pixels. Values are always positive safe integers after validation.
 */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * A point in normalized image coordinates.
 *
 * `x = 0` is the left edge and `x = 1` is the right edge.
 * `y = 0` is the top edge and `y = 1` is the bottom edge.
 */
export interface FocalPoint {
  readonly x: number;
  readonly y: number;
}

export interface ThumbnailOptions {
  /** Requested output width in pixels. */
  readonly width: number;
  /** Requested output height in pixels. */
  readonly height: number;
  /**
   * Optional normalized focal point.
   *
   * The value is part of the public contract and is validated, but the starter
   * still centers every crop. See the README for the intended behavior.
   */
  readonly focalPoint?: FocalPoint;
}

export interface ResolvedThumbnailOptions extends ThumbnailOptions {
  readonly focalPoint: FocalPoint;
}

/**
 * An integer crop rectangle whose origin is the top-left of the source image.
 */
export interface CropRectangle {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface ThumbnailResult {
  /** Path passed to Sharp's `toFile`. */
  readonly outputPath: string;
  /** Dimensions of the source after EXIF auto-orientation. */
  readonly source: ImageDimensions;
  /** Crop applied before resizing. */
  readonly crop: CropRectangle;
  /** Actual dimensions reported by Sharp for the written file. */
  readonly output: ImageDimensions;
}
