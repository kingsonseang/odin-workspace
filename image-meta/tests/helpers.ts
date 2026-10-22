import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(TESTS_DIR, "..");
export const FIXTURE_DIR = join(PROJECT_ROOT, "test", "fixtures");

export type Orientation = 1 | 2 | 6 | 8;

export interface FixtureManifestEntry {
  readonly fileName: string;
  readonly orientation: Orientation;
  readonly description: string;
}

export interface FixtureManifest {
  readonly fixtures: readonly FixtureManifestEntry[];
}

interface Rgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

const PALETTE = [
  { name: "red", red: 220, green: 32, blue: 40 },
  { name: "green", red: 32, green: 160, blue: 76 },
  { name: "blue", red: 32, green: 84, blue: 220 },
  { name: "yellow", red: 244, green: 196, blue: 32 },
] as const;

type PaletteColorName = (typeof PALETTE)[number]["name"];

const EXPECTED_QUADRANTS = [
  { label: "top-left", xFraction: 0.25, yFraction: 0.25, expected: "red" },
  { label: "top-right", xFraction: 0.75, yFraction: 0.25, expected: "green" },
  { label: "bottom-left", xFraction: 0.25, yFraction: 0.75, expected: "blue" },
  { label: "bottom-right", xFraction: 0.75, yFraction: 0.75, expected: "yellow" },
] as const satisfies readonly {
  readonly label: string;
  readonly xFraction: number;
  readonly yFraction: number;
  readonly expected: PaletteColorName;
}[];

export async function loadFixtureManifest(): Promise<FixtureManifest> {
  const raw = await readFile(join(FIXTURE_DIR, "manifest.json"), "utf8");
  const manifest = JSON.parse(raw) as FixtureManifest;

  if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length === 0) {
    throw new Error("Fixture manifest does not contain any fixtures");
  }

  return manifest;
}

export function fixturePath(fixture: FixtureManifestEntry): string {
  return join(FIXTURE_DIR, fixture.fileName);
}

export function findFixture(
  manifest: FixtureManifest,
  orientation: Orientation,
): FixtureManifestEntry {
  const fixture = manifest.fixtures.find((entry) => entry.orientation === orientation);
  assert.ok(fixture, `Fixture manifest is missing EXIF orientation ${orientation}`);
  return fixture;
}

export async function assertJpegDimensions(
  filePath: string,
  expectedWidth: number,
  expectedHeight: number,
): Promise<void> {
  const metadata = await sharp(filePath).metadata();

  assert.equal(metadata.format, "jpeg", `${filePath} should be a JPEG`);
  assert.equal(metadata.width, expectedWidth, `${filePath} metadata width`);
  assert.equal(metadata.height, expectedHeight, `${filePath} metadata height`);

  const { info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, expectedWidth, `${filePath} decoded width`);
  assert.equal(info.height, expectedHeight, `${filePath} decoded height`);
}

function pixelAt(
  data: Buffer,
  width: number,
  channels: number,
  x: number,
  y: number,
): Rgb {
  const offset = (y * width + x) * channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];

  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Could not read RGB pixel at (${x}, ${y})`);
  }

  return { red, green, blue };
}

function nearestPaletteColor(pixel: Rgb): PaletteColorName {
  let nearestName: PaletteColorName = PALETTE[0].name;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const entry of PALETTE) {
    const distance =
      (pixel.red - entry.red) ** 2 +
      (pixel.green - entry.green) ** 2 +
      (pixel.blue - entry.blue) ** 2;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestName = entry.name;
    }
  }

  return nearestName;
}

/**
 * Inspects decoded pixels rather than trusting filenames or EXIF tags.
 * A correctly normalized image always has the same quadrant layout.
 */
export async function assertUprightQuadrants(filePath: string, context: string): Promise<void> {
  const { data, info } = await sharp(filePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(info.channels, 3, `${context}: expected RGB output`);

  for (const probe of EXPECTED_QUADRANTS) {
    const x = Math.floor(info.width * probe.xFraction);
    const y = Math.floor(info.height * probe.yFraction);
    const pixel = pixelAt(data, info.width, info.channels, x, y);
    const actual = nearestPaletteColor(pixel);

    assert.equal(
      actual,
      probe.expected,
      `${context}: ${probe.label} at (${x}, ${y}) decoded as ${actual} ` +
        `(rgb ${pixel.red}, ${pixel.green}, ${pixel.blue}); expected ${probe.expected}`,
    );
  }
}
