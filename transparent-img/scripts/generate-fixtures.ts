import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTH = 8;
const HEIGHT = 8;

const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
);
const FIXTURE_DIR = resolve(PROJECT_ROOT, 'fixtures');

interface FixtureDefinition {
  readonly fileName: string;
  readonly rgba: readonly [red: number, green: number, blue: number, alpha: number];
}

const FIXTURES: readonly FixtureDefinition[] = [
  {
    fileName: 'transparent.png',
    rgba: [255, 0, 0, 0],
  },
  {
    fileName: 'semi-transparent.png',
    rgba: [0, 80, 255, 128],
  },
  {
    fileName: 'opaque.png',
    rgba: [0, 140, 255, 255],
  },
];

function createSolidRgbaBuffer(
  [red, green, blue, alpha]: FixtureDefinition['rgba'],
): Buffer {
  const data = Buffer.alloc(WIDTH * HEIGHT * 4);

  for (let pixel = 0; pixel < WIDTH * HEIGHT; pixel += 1) {
    const offset = pixel * 4;
    data.writeUInt8(red, offset);
    data.writeUInt8(green, offset + 1);
    data.writeUInt8(blue, offset + 2);
    data.writeUInt8(alpha, offset + 3);
  }

  return data;
}

async function main(): Promise<void> {
  await mkdir(FIXTURE_DIR, { recursive: true });

  for (const fixture of FIXTURES) {
    const outputPath = resolve(FIXTURE_DIR, fixture.fileName);
    const data = createSolidRgbaBuffer(fixture.rgba);

    await sharp(data, {
      raw: { width: WIDTH, height: HEIGHT, channels: 4 },
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    const [red, green, blue, alpha] = fixture.rgba;
    console.log(
      `Generated ${fixture.fileName} (${WIDTH}x${HEIGHT}, ` +
        `rgba(${red}, ${green}, ${blue}, ${alpha}))`,
    );
  }
}

await main();
