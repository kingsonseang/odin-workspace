#!/usr/bin/env node

import path from 'node:path';
import {
  DEFAULT_FIT,
  DEFAULT_FORMAT,
  DEFAULT_QUALITY,
  OUTPUT_FORMATS,
  RESIZE_FITS,
  processBatch,
  resizeImage,
  type BatchSummary,
  type OutputFormat,
  type ResizeFit,
  type ResizeOptions,
} from './processor.js';

const USAGE = `Usage:
  npm run resize -- <input-file> <output-file> [options]
  npm run batch  -- <input-dir>  <output-dir>  [options]

Options:
  --width <pixels>       Maximum output width (default: 320)
  --height <pixels>      Maximum output height (default: 240)
  --fit <mode>           ${RESIZE_FITS.join(' | ')} (default: ${DEFAULT_FIT})
  --format <format>      ${OUTPUT_FORMATS.join(' | ')} (default: ${DEFAULT_FORMAT})
  --quality <1-100>      JPEG/WebP quality (default: ${DEFAULT_QUALITY})
  -h, --help             Show this help

Examples:
  npm run resize -- fixtures/input/01-valid.png /tmp/01-valid.jpg --width 200 --height 150
  npm run batch  -- fixtures/input /tmp/batch-output --width 200 --height 150 --format jpeg
`;

interface CliOptions extends Required<ResizeOptions> {}

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

function parsePositiveInteger(flag: string, rawValue: string): number {
  if (!/^[1-9]\d*$/.test(rawValue)) {
    throw new UsageError(`${flag} requires a positive integer, received "${rawValue}"`);
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value)) {
    throw new UsageError(`${flag} is too large`);
  }

  return value;
}

function parseFlags(args: string[]): { positionals: string[]; options: CliOptions } {
  const positionals: string[] = [];
  const options: CliOptions = {
    width: 320,
    height: 240,
    fit: DEFAULT_FIT,
    format: DEFAULT_FORMAT,
    quality: DEFAULT_QUALITY,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === undefined) {
      continue;
    }

    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }

    const equalsIndex = argument.indexOf('=');
    const flag = equalsIndex === -1 ? argument : argument.slice(0, equalsIndex);

    let rawValue: string | undefined;
    if (equalsIndex !== -1) {
      rawValue = argument.slice(equalsIndex + 1);
    } else {
      index += 1;
      rawValue = args[index];
    }

    if (rawValue === undefined || rawValue.length === 0) {
      throw new UsageError(`${flag} requires a value`);
    }

    switch (flag) {
      case '--width':
        options.width = parsePositiveInteger(flag, rawValue);
        break;
      case '--height':
        options.height = parsePositiveInteger(flag, rawValue);
        break;
      case '--quality': {
        const quality = parsePositiveInteger(flag, rawValue);
        if (quality > 100) {
          throw new UsageError('--quality must be between 1 and 100');
        }
        options.quality = quality;
        break;
      }
      case '--fit':
        if (!(RESIZE_FITS as readonly string[]).includes(rawValue)) {
          throw new UsageError(`--fit must be one of: ${RESIZE_FITS.join(', ')}`);
        }
        options.fit = rawValue as ResizeFit;
        break;
      case '--format':
        if (!(OUTPUT_FORMATS as readonly string[]).includes(rawValue)) {
          throw new UsageError(`--format must be one of: ${OUTPUT_FORMATS.join(', ')}`);
        }
        options.format = rawValue as OutputFormat;
        break;
      default:
        throw new UsageError(`Unknown option: ${flag}`);
    }
  }

  return { positionals, options };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function printBatchSummary(summary: BatchSummary): void {
  console.log(`Input:   ${summary.inputDir}`);
  console.log(`Output:  ${summary.outputDir}`);
  console.log('');

  for (const result of summary.results) {
    const inputName = path.basename(result.inputPath);

    switch (result.status) {
      case 'processed': {
        const outputName = path.relative(summary.outputDir, result.outputPath);
        console.log(
          `processed  ${inputName} -> ${outputName} (${result.width}x${result.height}, ${formatBytes(result.bytes)})`,
        );
        break;
      }
      case 'skipped': {
        const outputName = path.relative(summary.outputDir, result.outputPath);
        console.log(`skipped    ${inputName} (${result.reason}: ${outputName})`);
        break;
      }
      case 'failed':
        console.log(`failed     ${inputName}: ${result.error}`);
        break;
    }
  }

  if (summary.results.length > 0) {
    console.log('');
  }

  console.log(
    `Summary: ${summary.totalFiles} image file(s), ` +
      `${summary.processed} processed, ${summary.skipped} skipped, ${summary.failed} failed`,
  );
}

async function main(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return;
  }

  const command = argv[0];
  if (command !== 'resize' && command !== 'batch') {
    throw new UsageError(`Unknown command: ${String(command)}`);
  }

  const { positionals, options } = parseFlags(argv.slice(1));
  const inputPath = positionals[0];
  const outputPath = positionals[1];

  if (
    positionals.length !== 2 ||
    inputPath === undefined ||
    outputPath === undefined
  ) {
    throw new UsageError('Expected exactly two paths. Run with --help for usage.');
  }

  if (command === 'resize') {
    const result = await resizeImage(inputPath, outputPath, options);
    console.log(
      `Resized ${result.inputPath} -> ${result.outputPath} ` +
        `(${result.output.width}x${result.output.height}, ${formatBytes(result.bytes)})`,
    );
    return;
  }

  const summary = await processBatch({
    inputDir: inputPath,
    outputDir: outputPath,
    ...options,
  });
  printBatchSummary(summary);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
