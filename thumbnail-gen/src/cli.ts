import { parseArgs } from 'node:util';

import { generateThumbnail, resolveThumbnailOptions } from './crop.js';
import type { ThumbnailOptions } from './types.js';

const USAGE = `Usage:
  npm run thumbnail -- <input> <output> --width <px> --height <px> [options]

Options:
  --width <px>       Required positive output width
  --height <px>      Required positive output height
  --focal-x <0..1>   Optional normalized focal point x coordinate
  --focal-y <0..1>   Optional normalized focal point y coordinate
  --help             Show this help

Both --focal-x and --focal-y must be provided together.`;

function parseNumber(raw: string, name: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: 'string' },
      height: { type: 'string' },
      'focal-x': { type: 'string' },
      'focal-y': { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const [input, output, ...extra] = positionals;
  if (input === undefined || output === undefined || extra.length > 0) {
    throw new Error(`Expected exactly one input and one output path.\n\n${USAGE}`);
  }
  if (values.width === undefined || values.height === undefined) {
    throw new Error(`--width and --height are required.\n\n${USAGE}`);
  }

  const focalX = values['focal-x'];
  const focalY = values['focal-y'];
  if ((focalX === undefined) !== (focalY === undefined)) {
    throw new Error('--focal-x and --focal-y must be provided together');
  }

  const options: ThumbnailOptions =
    focalX !== undefined && focalY !== undefined
      ? {
          width: parseNumber(values.width, '--width'),
          height: parseNumber(values.height, '--height'),
          focalPoint: {
            x: parseNumber(focalX, '--focal-x'),
            y: parseNumber(focalY, '--focal-y'),
          },
        }
      : {
          width: parseNumber(values.width, '--width'),
          height: parseNumber(values.height, '--height'),
        };

  const resolved = resolveThumbnailOptions(options);
  const result = await generateThumbnail(input, output, resolved);

  process.stdout.write(
    `${JSON.stringify(
      {
        ...result,
        focalPoint: resolved.focalPoint,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`thumbnail: ${message}\n`);
  process.exitCode = 1;
});
