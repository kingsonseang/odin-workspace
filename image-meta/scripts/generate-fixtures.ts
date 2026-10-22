import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import exifReader from "exif-reader";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const FIXTURE_DIR = join(PROJECT_ROOT, "test", "fixtures");

const DISPLAY_WIDTH = 90;
const DISPLAY_HEIGHT = 60;
const FIXTURE_QUALITY = 95;

type Orientation = 1 | 2 | 6 | 8;
type StorageRotation = 0 | 90 | 270;

interface FixtureSpec {
  readonly fileName: string;
  readonly orientation: Orientation;
  readonly storageRotation: StorageRotation;
  readonly mirrorHorizontally: boolean;
  readonly description: string;
}

const FIXTURES: readonly FixtureSpec[] = [
  {
    fileName: "orientation-1-normal.jpg",
    orientation: 1,
    storageRotation: 0,
    mirrorHorizontally: false,
    description: "Normal orientation; stored pixels already match the intended display.",
  },
  {
    fileName: "orientation-2-mirrored.jpg",
    orientation: 2,
    storageRotation: 0,
    mirrorHorizontally: true,
    description: "Mirrored horizontally; EXIF orientation 2 mirrors the stored pixels for display.",
  },
  {
    fileName: "orientation-6-rotate-90-cw.jpg",
    orientation: 6,
    storageRotation: 270,
    mirrorHorizontally: false,
    description: "Stored rotated counter-clockwise; EXIF orientation 6 rotates 90 degrees clockwise for display.",
  },
  {
    fileName: "orientation-8-rotate-270-cw.jpg",
    orientation: 8,
    storageRotation: 90,
    mirrorHorizontally: false,
    description: "Stored rotated clockwise; EXIF orientation 8 rotates 270 degrees clockwise for display.",
  },
];

const XMP = `<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description
      rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <dc:creator>
        <rdf:Seq>
          <rdf:li>Fixture Person</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <xmp:CreatorTool>image-meta fixture generator</xmp:CreatorTool>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;

interface Rgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

// The intended display layout. These quadrants make mirrored and rotated
// outputs detectable from decoded pixels alone.
const QUADRANTS = {
  topLeft: { red: 220, green: 32, blue: 40 },
  topRight: { red: 32, green: 160, blue: 76 },
  bottomLeft: { red: 32, green: 84, blue: 220 },
  bottomRight: { red: 244, green: 196, blue: 32 },
} satisfies Record<string, Rgb>;

function createDisplayPixels(): Buffer {
  const buffer = Buffer.alloc(DISPLAY_WIDTH * DISPLAY_HEIGHT * 3);

  for (let y = 0; y < DISPLAY_HEIGHT; y += 1) {
    for (let x = 0; x < DISPLAY_WIDTH; x += 1) {
      const color =
        y < DISPLAY_HEIGHT / 2
          ? x < DISPLAY_WIDTH / 2
            ? QUADRANTS.topLeft
            : QUADRANTS.topRight
          : x < DISPLAY_WIDTH / 2
            ? QUADRANTS.bottomLeft
            : QUADRANTS.bottomRight;

      const offset = (y * DISPLAY_WIDTH + x) * 3;
      buffer[offset] = color.red;
      buffer[offset + 1] = color.green;
      buffer[offset + 2] = color.blue;
    }
  }

  return buffer;
}

async function createStoredPixels(spec: FixtureSpec): Promise<Buffer> {
  let pipeline = sharp(createDisplayPixels(), {
    raw: {
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
      channels: 3,
    },
  });

  if (spec.mirrorHorizontally) {
    pipeline = pipeline.flop();
  }

  if (spec.storageRotation !== 0) {
    pipeline = pipeline.rotate(spec.storageRotation);
  }

  return pipeline
    .jpeg({
      quality: FIXTURE_QUALITY,
      chromaSubsampling: "4:4:4",
    })
    .toBuffer();
}

async function writeFixture(spec: FixtureSpec): Promise<void> {
  const storedPixels = await createStoredPixels(spec);
  const outputPath = join(FIXTURE_DIR, spec.fileName);

  await sharp(storedPixels)
    .withExif({
      IFD0: {
        Make: "Fixture Camera Co.",
        Model: "Orientation Fixture 9000",
        Software: "image-meta fixture generator",
        ImageDescription: `Synthetic EXIF orientation ${spec.orientation} fixture`,
        Artist: "Fixture Person",
        Copyright: "Synthetic fixture; not a real person or place",
      },
      IFD3: {
        GPSLatitudeRef: "N",
        GPSLatitude: "37/1 46/1 3000/100",
        GPSLongitudeRef: "W",
        GPSLongitude: "122/1 25/1 1200/100",
        GPSAltitudeRef: "0",
        GPSAltitude: "1500/100",
      },
    })
    .withXmp(XMP)
    .withMetadata({ orientation: spec.orientation })
    .jpeg({
      quality: FIXTURE_QUALITY,
      chromaSubsampling: "4:4:4",
    })
    .toFile(outputPath);

  const metadata = await sharp(outputPath).metadata();

  if (metadata.orientation !== spec.orientation) {
    throw new Error(
      `Fixture ${spec.fileName} has EXIF orientation ${String(metadata.orientation)}; expected ${spec.orientation}`,
    );
  }

  if (metadata.exif === undefined) {
    throw new Error(`Fixture ${spec.fileName} is missing EXIF data`);
  }

  const parsedExif = exifReader(metadata.exif);

  if (parsedExif.GPSInfo?.GPSLatitude === undefined) {
    throw new Error(`Fixture ${spec.fileName} is missing GPS metadata`);
  }

  if (metadata.xmp === undefined) {
    throw new Error(`Fixture ${spec.fileName} is missing XMP metadata`);
  }

  console.log(
    `wrote ${spec.fileName} (${metadata.width}x${metadata.height}, orientation ${spec.orientation})`,
  );
}

async function main(): Promise<void> {
  await rm(FIXTURE_DIR, { recursive: true, force: true });
  await mkdir(FIXTURE_DIR, { recursive: true });

  for (const spec of FIXTURES) {
    await writeFixture(spec);
  }

  const manifest = {
    generatedBy: "scripts/generate-fixtures.ts",
    display: {
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
      quadrants: QUADRANTS,
    },
    fixtures: FIXTURES.map((spec) => ({
      fileName: spec.fileName,
      orientation: spec.orientation,
      description: spec.description,
    })),
  };

  await writeFile(
    join(FIXTURE_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log(`wrote ${FIXTURES.length} fixtures to ${FIXTURE_DIR}`);
}

await main();
