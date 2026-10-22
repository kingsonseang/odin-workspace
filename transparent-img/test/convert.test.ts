import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { convertImage } from '../src/convert.js';

type Rgba = readonly [red: number, green: number, blue: number, alpha: number];
type Rgb = readonly [red: number, green: number, blue: number];

interface CliResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface AlphaFixture {
  readonly name: string;
  readonly path: string;
  readonly alpha: number;
  readonly rgb?: Rgb;
}

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_DIR = join(PROJECT_ROOT, 'fixtures');
const CONVERT_SCRIPT = join(PROJECT_ROOT, 'src', 'convert.ts');
const TEMP_DIR = await mkdtemp(join(tmpdir(), 'transparent-img-'));

let outputCounter = 0;

const ALPHA_FIXTURES: readonly AlphaFixture[] = [
  {
    name: 'fully transparent',
    path: join(FIXTURE_DIR, 'transparent.png'),
    alpha: 0,
  },
  {
    name: 'partially transparent',
    path: join(FIXTURE_DIR, 'semi-transparent.png'),
    alpha: 128,
    rgb: [0, 80, 255],
  },
  {
    name: 'opaque',
    path: join(FIXTURE_DIR, 'opaque.png'),
    alpha: 255,
    rgb: [0, 140, 255],
  },
];

const TRANSPARENT_FIXTURE = join(FIXTURE_DIR, 'transparent.png');
const SEMI_TRANSPARENT_FIXTURE = join(FIXTURE_DIR, 'semi-transparent.png');
const OPAQUE_FIXTURE = join(FIXTURE_DIR, 'opaque.png');

function tempOutput(extension: string): string {
  outputCounter += 1;
  return join(TEMP_DIR, `output-${outputCounter}.${extension}`);
}

function readByte(data: Buffer, index: number): number {
  const value = data[index];

  if (value === undefined) {
    throw new Error(`Pixel byte ${index} was outside the decoded image buffer`);
  }

  return value;
}

async function readPixel(
  imagePath: string,
  x = 4,
  y = 4,
): Promise<Rgba> {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(info.channels, 4, 'expected an RGBA image buffer');

  const offset = (y * info.width + x) * info.channels;

  return [
    readByte(data, offset),
    readByte(data, offset + 1),
    readByte(data, offset + 2),
    readByte(data, offset + 3),
  ];
}

async function assertImageMetadata(
  imagePath: string,
  format: 'png' | 'jpeg' | 'webp',
): Promise<void> {
  const metadata = await sharp(imagePath).metadata();

  assert.equal(metadata.format, format);
  assert.equal(metadata.width, 8);
  assert.equal(metadata.height, 8);
}

function assertRgbNear(
  actual: Rgba,
  expected: Rgb,
  tolerance: number,
  context: string,
): void {
  assert.ok(
    Math.abs(actual[0] - expected[0]) <= tolerance,
    `${context}: expected red near ${expected[0]}, received ${actual[0]}`,
  );
  assert.ok(
    Math.abs(actual[1] - expected[1]) <= tolerance,
    `${context}: expected green near ${expected[1]}, received ${actual[1]}`,
  );
  assert.ok(
    Math.abs(actual[2] - expected[2]) <= tolerance,
    `${context}: expected blue near ${expected[2]}, received ${actual[2]}`,
  );
}

async function runCli(args: readonly string[]): Promise<CliResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', CONVERT_SCRIPT, ...args],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}

after(async () => {
  await rm(TEMP_DIR, { recursive: true, force: true });
});

describe('working format conversions', () => {
  it('converts PNG to PNG and preserves transparency', async () => {
    for (const fixture of ALPHA_FIXTURES) {
      const output = tempOutput('png');
      await convertImage(fixture.path, output);

      await assertImageMetadata(output, 'png');

      if (fixture.alpha < 255) {
        const metadata = await sharp(output).metadata();
        assert.equal(metadata.hasAlpha, true);
      }

      const pixel = await readPixel(output);
      assert.equal(
        pixel[3],
        fixture.alpha,
        `${fixture.name} alpha changed during PNG conversion`,
      );

      if (fixture.rgb !== undefined) {
        assertRgbNear(
          pixel,
          fixture.rgb,
          2,
          `${fixture.name} pixel in PNG output`,
        );
      }
    }
  });

  it('converts PNG to WebP and preserves transparency', async () => {
    for (const fixture of ALPHA_FIXTURES) {
      const output = tempOutput('webp');
      await convertImage(fixture.path, output);

      await assertImageMetadata(output, 'webp');

      if (fixture.alpha < 255) {
        const metadata = await sharp(output).metadata();
        assert.equal(metadata.hasAlpha, true);
      }

      const pixel = await readPixel(output);
      assert.equal(
        pixel[3],
        fixture.alpha,
        `${fixture.name} alpha changed during WebP conversion`,
      );

      if (fixture.rgb !== undefined) {
        assertRgbNear(
          pixel,
          fixture.rgb,
          2,
          `${fixture.name} pixel in WebP output`,
        );
      }
    }
  });

  it('converts an opaque PNG to JPEG with the expected format and size', async () => {
    const output = tempOutput('jpg');
    await convertImage(OPAQUE_FIXTURE, output);

    await assertImageMetadata(output, 'jpeg');

    const pixel = await readPixel(output);
    assertRgbNear(pixel, [0, 140, 255], 12, 'opaque JPEG pixel');
  });

  it('reads WebP and JPEG inputs', async () => {
    const webpIntermediate = tempOutput('webp');
    await convertImage(OPAQUE_FIXTURE, webpIntermediate);

    const pngFromWebp = tempOutput('png');
    await convertImage(webpIntermediate, pngFromWebp);
    await assertImageMetadata(pngFromWebp, 'png');
    assertRgbNear(
      await readPixel(pngFromWebp),
      [0, 140, 255],
      2,
      'PNG decoded from WebP',
    );

    const jpegIntermediate = tempOutput('jpeg');
    await convertImage(OPAQUE_FIXTURE, jpegIntermediate);

    const pngFromJpeg = tempOutput('png');
    await convertImage(jpegIntermediate, pngFromJpeg);
    await assertImageMetadata(pngFromJpeg, 'png');
    assertRgbNear(
      await readPixel(pngFromJpeg),
      [0, 140, 255],
      12,
      'PNG decoded from JPEG',
    );
  });

  it('rejects an unsupported requested output format', async () => {
    const output = tempOutput('gif');

    await assert.rejects(
      () => convertImage(OPAQUE_FIXTURE, output),
      /Unsupported output format/,
    );
    await assert.rejects(() => access(output));
  });

  it('reports an unsupported requested format from the CLI', async () => {
    const output = tempOutput('gif');
    const result = await runCli([OPAQUE_FIXTURE, output]);

    assert.equal(result.code, 1, 'the CLI should exit with a failure status');
    assert.match(result.stderr, /Unsupported output format/i);
    await assert.rejects(() => access(output));
  });
});

/**
 * These tests define the target contract. They are expected to fail in the
 * seeded state because background handling is intentionally not implemented.
 */
describe('target contract: JPEG background handling', () => {
  it('composites fully transparent pixels onto white by default', async () => {
    const output = tempOutput('jpg');
    await convertImage(TRANSPARENT_FIXTURE, output);

    await assertImageMetadata(output, 'jpeg');
    assertRgbNear(
      await readPixel(output),
      [255, 255, 255],
      4,
      'fully transparent pixel with the default JPEG background',
    );
  });

  it('composites partially transparent pixels onto white by default', async () => {
    const output = tempOutput('jpg');
    await convertImage(SEMI_TRANSPARENT_FIXTURE, output);

    await assertImageMetadata(output, 'jpeg');
    assertRgbNear(
      await readPixel(output),
      [127, 167, 255],
      12,
      'semi-transparent pixel with the default JPEG background',
    );
  });

  it('accepts a configurable background color', async () => {
    const output = tempOutput('jpg');
    const result = await runCli([
      TRANSPARENT_FIXTURE,
      output,
      '--background',
      '#ff0000',
    ]);

    assert.equal(
      result.code,
      0,
      `expected a successful conversion, received:\n${result.stderr}`,
    );
    await assertImageMetadata(output, 'jpeg');
    assertRgbNear(
      await readPixel(output),
      [255, 0, 0],
      8,
      'fully transparent pixel with a red JPEG background',
    );
  });

  for (const invalidColor of ['#12345', '#gggggg', 'red']) {
    it(`rejects the invalid background color "${invalidColor}"`, async () => {
      const output = tempOutput('jpg');
      const result = await runCli([
        OPAQUE_FIXTURE,
        output,
        '--background',
        invalidColor,
      ]);

      assert.equal(result.code, 1, 'invalid colors must fail the CLI');
      assert.match(result.stderr, /invalid background color/i);
      await assert.rejects(() => access(output));
    });
  }
});
