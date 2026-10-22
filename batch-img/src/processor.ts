import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const SUPPORTED_INPUT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const OUTPUT_FORMATS = ['jpeg', 'png', 'webp'] as const;
export const RESIZE_FITS = ['cover', 'contain', 'fill', 'inside', 'outside'] as const;

export const DEFAULT_FORMAT: OutputFormat = 'jpeg';
export const DEFAULT_FIT: ResizeFit = 'inside';
export const DEFAULT_QUALITY = 80;

export const OUTPUT_EXTENSION_BY_FORMAT: Readonly<Record<OutputFormat, string>> = {
  jpeg: '.jpg',
  png: '.png',
  webp: '.webp',
};

export type OutputFormat = (typeof OUTPUT_FORMATS)[number];
export type ResizeFit = (typeof RESIZE_FITS)[number];
export type SupportedInputExtension = (typeof SUPPORTED_INPUT_EXTENSIONS)[number];

export interface ResizeOptions {
  width: number;
  height: number;
  fit?: ResizeFit;
  format?: OutputFormat;
  quality?: number;
}

export interface ImageInfo {
  width: number;
  height: number;
  format: string;
}

export interface ProcessedImage {
  inputPath: string;
  outputPath: string;
  source: ImageInfo;
  output: ImageInfo;
  bytes: number;
}

export interface ProcessedFileResult {
  status: 'processed';
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
  bytes: number;
}

export interface SkippedFileResult {
  status: 'skipped';
  inputPath: string;
  outputPath: string;
  reason: 'output-exists';
}

export interface FailedFileResult {
  status: 'failed';
  inputPath: string;
  error: string;
}

export type BatchFileResult = ProcessedFileResult | SkippedFileResult | FailedFileResult;

export interface BatchOptions extends ResizeOptions {
  inputDir: string;
  outputDir: string;
}

export interface BatchSummary {
  inputDir: string;
  outputDir: string;
  totalFiles: number;
  processed: number;
  skipped: number;
  failed: number;
  results: BatchFileResult[];
}

export class ImageProcessingError extends Error {
  readonly inputPath: string;

  constructor(inputPath: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ImageProcessingError';
    this.inputPath = inputPath;
  }
}

const SUPPORTED_EXTENSION_SET: ReadonlySet<string> = new Set(SUPPORTED_INPUT_EXTENSIONS);

function isSupportedInputName(fileName: string): boolean {
  return SUPPORTED_EXTENSION_SET.has(path.extname(fileName).toLowerCase());
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertResizeOptions(options: ResizeOptions): void {
  assertPositiveInteger('width', options.width);
  assertPositiveInteger('height', options.height);

  const quality = options.quality ?? DEFAULT_QUALITY;
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new RangeError('quality must be an integer between 1 and 100');
  }

  if (options.fit !== undefined && !RESIZE_FITS.includes(options.fit)) {
    throw new RangeError(`fit must be one of: ${RESIZE_FITS.join(', ')}`);
  }

  if (options.format !== undefined && !OUTPUT_FORMATS.includes(options.format)) {
    throw new RangeError(`format must be one of: ${OUTPUT_FORMATS.join(', ')}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Resize one image to the requested output path.
 *
 * The output path is explicit, so writing to an existing path replaces that
 * file. This is the single-image primitive; batch-level collision and
 * overwrite policy belongs to the caller.
 */
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  options: ResizeOptions,
): Promise<ProcessedImage> {
  assertResizeOptions(options);

  const fit = options.fit ?? DEFAULT_FIT;
  const format = options.format ?? DEFAULT_FORMAT;
  const quality = options.quality ?? DEFAULT_QUALITY;

  try {
    const sourceMetadata = await sharp(inputPath, { failOn: 'error' }).metadata();

    if (sourceMetadata.width === undefined || sourceMetadata.height === undefined) {
      throw new ImageProcessingError(inputPath, `Could not read image dimensions from "${inputPath}"`);
    }

    await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });

    const pipeline = sharp(inputPath, { failOn: 'error' })
      .rotate()
      .resize({
        width: options.width,
        height: options.height,
        fit,
        withoutEnlargement: true,
      });

    switch (format) {
      case 'jpeg':
        pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline.png({ compressionLevel: 9 });
        break;
      case 'webp':
        pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(outputPath);

    const [outputMetadata, outputStats] = await Promise.all([
      sharp(outputPath).metadata(),
      stat(outputPath),
    ]);

    if (outputMetadata.width === undefined || outputMetadata.height === undefined) {
      throw new ImageProcessingError(inputPath, `Could not read dimensions from "${outputPath}"`);
    }

    return {
      inputPath,
      outputPath,
      source: {
        width: sourceMetadata.width,
        height: sourceMetadata.height,
        format: sourceMetadata.format ?? 'unknown',
      },
      output: {
        width: outputMetadata.width,
        height: outputMetadata.height,
        format: outputMetadata.format ?? format,
      },
      bytes: outputStats.size,
    };
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }

    throw new ImageProcessingError(
      inputPath,
      `Could not process "${inputPath}": ${errorMessage(error)}`,
      { cause: error },
    );
  }
}

/**
 * List supported image file names in deterministic order. Non-image files and
 * directories are ignored.
 */
export async function discoverImageFiles(inputDir: string): Promise<string[]> {
  const entries = await readdir(inputDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && isSupportedInputName(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function batchOutputPathFor(
  inputFileName: string,
  outputDir: string,
  format: OutputFormat,
): string {
  const stem = path.parse(inputFileName).name;
  return path.join(outputDir, `${stem}${OUTPUT_EXTENSION_BY_FORMAT[format]}`);
}

/**
 * Resize every supported image in an input directory.
 *
 * This implementation walks the sorted list sequentially and writes one result
 * per input. See README.md for the current batch contract and known gaps.
 */
export async function processBatch(options: BatchOptions): Promise<BatchSummary> {
  const { inputDir, outputDir } = options;
  const format = options.format ?? DEFAULT_FORMAT;

  await mkdir(outputDir, { recursive: true });

  const inputFiles = await discoverImageFiles(inputDir);
  const results: BatchFileResult[] = [];

  for (const inputFile of inputFiles) {
    const inputPath = path.join(inputDir, inputFile);
    const outputPath = batchOutputPathFor(inputFile, outputDir, format);
    const processed = await resizeImage(inputPath, outputPath, options);

    results.push({
      status: 'processed',
      inputPath,
      outputPath,
      width: processed.output.width,
      height: processed.output.height,
      bytes: processed.bytes,
    });
  }

  return {
    inputDir,
    outputDir,
    totalFiles: inputFiles.length,
    processed: results.filter((result) => result.status === 'processed').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
  };
}
