import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const SUPPORTED_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const;

export type OutputFormat = (typeof SUPPORTED_OUTPUT_FORMATS)[number];

const FORMAT_BY_EXTENSION: Readonly<Record<string, OutputFormat>> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
};

export class UnsupportedOutputFormatError extends Error {
  constructor(extension: string) {
    super(
      `Unsupported output format "${extension || '(none)'}". ` +
        'Use .png, .jpg, .jpeg, or .webp.',
    );
    this.name = 'UnsupportedOutputFormatError';
  }
}

/**
 * Resolve the requested image format from the output filename.
 *
 * The caller chooses a format by choosing an output extension. Unsupported
 * extensions are rejected before Sharp is invoked.
 */
export function resolveOutputFormat(outputPath: string): OutputFormat {
  const extension = extname(outputPath).toLowerCase();
  const format = FORMAT_BY_EXTENSION[extension];

  if (format === undefined) {
    throw new UnsupportedOutputFormatError(extension);
  }

  return format;
}

/**
 * Convert an image between the supported output formats.
 *
 * PNG and WebP outputs keep their alpha channel. JPEG output is deliberately
 * left without explicit transparency handling in this seeded exercise.
 */
export async function convertImage(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const format = resolveOutputFormat(outputPath);
  let pipeline = sharp(inputPath, { failOn: 'error' });

  switch (format) {
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality: 90,
        chromaSubsampling: '4:4:4',
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({ lossless: true });
      break;
  }

  await pipeline.toFile(outputPath);
}

const USAGE = [
  'Usage: npm run convert -- <input> <output>',
  '',
  'Output format is inferred from the output extension:',
  '  .png   PNG with transparency',
  '  .jpg   JPEG',
  '  .jpeg  JPEG',
  '  .webp  WebP with transparency',
].join('\n');

async function main(args: readonly string[]): Promise<void> {
  const inputPath = args[0];
  const outputPath = args[1];

  if (args.length !== 2 || inputPath === undefined || outputPath === undefined) {
    throw new Error(USAGE);
  }

  await convertImage(inputPath, outputPath);
  console.log(`Converted ${inputPath} -> ${outputPath}`);
}

function isDirectExecution(): boolean {
  const entryPoint = process.argv[1];
  return (
    entryPoint !== undefined &&
    import.meta.url === pathToFileURL(resolve(entryPoint)).href
  );
}

if (isDirectExecution()) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
