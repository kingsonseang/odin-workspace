import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

type Rgb = readonly [red: number, green: number, blue: number];
type FixtureFormat = 'png' | 'jpeg';

interface ImageFixture {
  relativePath: string;
  width: number;
  height: number;
  from: Rgb;
  to: Rgb;
  format: FixtureFormat;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(repoRoot, 'fixtures', 'input');
const outputDir = path.join(repoRoot, 'fixtures', 'output');

const imageFixtures: ImageFixture[] = [
  {
    relativePath: 'input/01-valid.png',
    width: 640,
    height: 480,
    from: [18, 94, 98],
    to: [76, 201, 176],
    format: 'png',
  },
  {
    relativePath: 'input/02-shared.png',
    width: 480,
    height: 320,
    from: [31, 64, 143],
    to: [91, 145, 255],
    format: 'png',
  },
  {
    relativePath: 'input/02-shared.jpg',
    width: 360,
    height: 480,
    from: [41, 104, 63],
    to: [140, 205, 96],
    format: 'jpeg',
  },
  {
    relativePath: 'input/04-late-valid.png',
    width: 800,
    height: 200,
    from: [128, 65, 24],
    to: [245, 171, 62],
    format: 'png',
  },
  {
    relativePath: 'output/01-valid.jpg',
    width: 40,
    height: 30,
    from: [112, 19, 38],
    to: [201, 55, 76],
    format: 'jpeg',
  },
  {
    relativePath: 'output/02-shared.jpg',
    width: 40,
    height: 30,
    from: [71, 31, 112],
    to: [136, 74, 191],
    format: 'jpeg',
  },
];

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function createPixels(width: number, height: number, from: Rgb, to: Rgb): Buffer {
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const progress = (x / Math.max(1, width - 1) + y / Math.max(1, height - 1)) / 2;
      const stripe = (x + y) % 64 < 12 ? -26 : 0;
      const offset = (y * width + x) * channels;

      pixels[offset] = clampChannel(from[0] + (to[0] - from[0]) * progress + stripe);
      pixels[offset + 1] = clampChannel(from[1] + (to[1] - from[1]) * progress + stripe);
      pixels[offset + 2] = clampChannel(from[2] + (to[2] - from[2]) * progress + stripe);
    }
  }

  return pixels;
}

async function writeImageFixture(fixture: ImageFixture): Promise<void> {
  const targetPath = path.join(repoRoot, 'fixtures', fixture.relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });

  const image = sharp(createPixels(fixture.width, fixture.height, fixture.from, fixture.to), {
    raw: {
      width: fixture.width,
      height: fixture.height,
      channels: 3,
    },
  });

  if (fixture.format === 'png') {
    await image.png({ compressionLevel: 9 }).toFile(targetPath);
  } else {
    await image
      .jpeg({ quality: 91, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(targetPath);
  }
}

async function writeTextFixtures(): Promise<string[]> {
  const notesPath = path.join(inputDir, 'notes.txt');
  const brokenPath = path.join(inputDir, '03-broken.jpg');
  const keepPath = path.join(outputDir, 'keep-me.txt');

  await writeFile(
    notesPath,
    'This text file is not an image and must be ignored by image discovery.\n',
    'utf8',
  );
  await writeFile(
    brokenPath,
    [
      'This file has a .jpg extension but deliberately contains no image data.',
      'Sharp must fail to decode it.',
      'It is present so the batch workflow can be tested against a bad input.',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    keepPath,
    'Pre-existing non-image output sentinel. It must remain byte-for-byte unchanged.\n',
    'utf8',
  );

  return [notesPath, brokenPath, keepPath];
}

async function main(): Promise<void> {
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const writtenPaths: string[] = [];

  for (const fixture of imageFixtures) {
    await writeImageFixture(fixture);
    writtenPaths.push(path.join(repoRoot, 'fixtures', fixture.relativePath));
  }

  writtenPaths.push(...(await writeTextFixtures()));

  for (const writtenPath of writtenPaths.sort()) {
    console.log(`generated ${path.relative(repoRoot, writtenPath)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
