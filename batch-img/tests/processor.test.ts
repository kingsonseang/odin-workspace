import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ImageProcessingError, resizeImage } from '../src/processor.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const fixturesInput = path.join(repoRoot, 'fixtures', 'input');

const temporaryDirectories: string[] = [];

async function makeTempDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'batch-img-single-'));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('resizeImage', () => {
  it('resizes a supported image within the requested bounds', async () => {
    const directory = await makeTempDirectory();
    const inputPath = path.join(fixturesInput, '01-valid.png');
    const outputPath = path.join(directory, 'resized.jpg');

    const result = await resizeImage(inputPath, outputPath, {
      width: 200,
      height: 150,
      fit: 'inside',
      format: 'jpeg',
      quality: 82,
    });

    expect(result.inputPath).toBe(inputPath);
    expect(result.outputPath).toBe(outputPath);
    expect(result.source).toMatchObject({ width: 640, height: 480, format: 'png' });
    expect(result.output).toMatchObject({ width: 200, height: 150, format: 'jpeg' });
    expect(result.bytes).toBeGreaterThan(0);

    const metadata = await sharp(outputPath).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(150);

    const outputStats = await stat(outputPath);
    expect(outputStats.isFile()).toBe(true);
    expect(outputStats.size).toBe(result.bytes);
  });

  it('rejects a corrupt image and does not create an output file', async () => {
    const directory = await makeTempDirectory();
    const inputPath = path.join(fixturesInput, '03-broken.jpg');
    const outputPath = path.join(directory, 'should-not-exist.jpg');

    await expect(
      resizeImage(inputPath, outputPath, {
        width: 100,
        height: 100,
        format: 'jpeg',
      }),
    ).rejects.toBeInstanceOf(ImageProcessingError);

    await expect(stat(outputPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects invalid resize bounds before touching the filesystem', async () => {
    const directory = await makeTempDirectory();
    const inputPath = path.join(fixturesInput, '01-valid.png');
    const outputPath = path.join(directory, 'invalid.jpg');

    await expect(
      resizeImage(inputPath, outputPath, {
        width: 0,
        height: 100,
        format: 'jpeg',
      }),
    ).rejects.toThrow(/width must be a positive integer/);
  });
});
