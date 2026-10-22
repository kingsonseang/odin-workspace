import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  processBatch,
  type BatchSummary,
  type FailedFileResult,
  type ProcessedFileResult,
} from '../src/processor.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const fixturesInput = path.join(repoRoot, 'fixtures', 'input');
const fixturesOutput = path.join(repoRoot, 'fixtures', 'output');

const temporaryDirectories: string[] = [];

interface Workspace {
  root: string;
  inputDir: string;
  outputDir: string;
}

async function makeWorkspace(
  inputFileNames: string[],
  copyPreexistingOutputs: boolean,
): Promise<Workspace> {
  const root = await mkdtemp(path.join(tmpdir(), 'batch-img-acceptance-'));
  temporaryDirectories.push(root);

  const inputDir = path.join(root, 'input');
  const outputDir = path.join(root, 'output');
  await mkdir(inputDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  for (const fileName of inputFileNames) {
    await copyFile(path.join(fixturesInput, fileName), path.join(inputDir, fileName));
  }

  if (copyPreexistingOutputs) {
    const outputEntries = await readdir(fixturesOutput, { withFileTypes: true });
    for (const entry of outputEntries) {
      if (entry.isFile()) {
        await copyFile(
          path.join(fixturesOutput, entry.name),
          path.join(outputDir, entry.name),
        );
      }
    }
  }

  return { root, inputDir, outputDir };
}

function batchOptions(inputDir: string, outputDir: string) {
  return {
    inputDir,
    outputDir,
    width: 200,
    height: 150,
    fit: 'inside' as const,
    format: 'jpeg' as const,
    quality: 82,
  };
}

async function listRelativeFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string, prefix: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`;
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await walk(root, '');
  return files.sort();
}

async function digestFiles(root: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (const relativePath of await listRelativeFiles(root)) {
    const contents = await readFile(path.join(root, relativePath));
    result.set(relativePath, createHash('sha256').update(contents).digest('hex'));
  }

  return result;
}

function processedResults(summary: BatchSummary): ProcessedFileResult[] {
  return summary.results.filter(
    (result): result is ProcessedFileResult => result.status === 'processed',
  );
}

function failedResults(summary: BatchSummary): FailedFileResult[] {
  return summary.results.filter(
    (result): result is FailedFileResult => result.status === 'failed',
  );
}

function outputNames(summary: BatchSummary): string[] {
  return processedResults(summary)
    .map((result) =>
      path.relative(summary.outputDir, result.outputPath).split(path.sep).join('/'),
    )
    .sort();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fileStats = await stat(filePath);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('batch workflow acceptance', () => {
  it('processes every valid image and continues after an unsupported image', async () => {
    const { inputDir, outputDir } = await makeWorkspace(
      [
        '01-valid.png',
        '02-shared.png',
        '02-shared.jpg',
        '03-broken.jpg',
        '04-late-valid.png',
        'notes.txt',
      ],
      false,
    );

    const summary = await processBatch(batchOptions(inputDir, outputDir));

    expect(summary.totalFiles).toBe(5);
    expect(summary.processed).toBe(4);
    expect(summary.skipped).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.results).toHaveLength(5);

    const processed = processedResults(summary);
    expect(
      processed
        .map((result) => path.basename(result.inputPath))
        .sort(),
    ).toEqual([
      '01-valid.png',
      '02-shared.jpg',
      '02-shared.png',
      '04-late-valid.png',
    ]);

    const failures = failedResults(summary);
    expect(failures).toHaveLength(1);
    expect(path.resolve(failures[0]!.inputPath)).toBe(
      path.join(inputDir, '03-broken.jpg'),
    );
    expect(failures[0]!.error.trim().length).toBeGreaterThan(0);

    for (const result of processed) {
      expect(await fileExists(result.outputPath), `missing output ${result.outputPath}`).toBe(
        true,
      );

      const metadata = await sharp(result.outputPath).metadata();
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBeLessThanOrEqual(200);
      expect(metadata.height).toBeLessThanOrEqual(150);
    }
  });

  it('preserves every file that already exists in the output directory', async () => {
    const { inputDir, outputDir } = await makeWorkspace(
      ['01-valid.png', '02-shared.png', '02-shared.jpg'],
      true,
    );

    const before = await digestFiles(outputDir);
    expect(before.size).toBeGreaterThan(0);

    const summary = await processBatch(batchOptions(inputDir, outputDir));

    expect(summary.processed).toBe(3);
    expect(summary.failed).toBe(0);

    const after = await digestFiles(outputDir);
    for (const [fileName, digest] of before) {
      expect(
        after.get(fileName),
        `pre-existing output "${fileName}" was modified or removed`,
      ).toBe(digest);
    }
  });

  it('gives duplicate base names distinct, stable output names', async () => {
    const first = await makeWorkspace(['02-shared.png', '02-shared.jpg'], true);
    const firstSummary = await processBatch(batchOptions(first.inputDir, first.outputDir));
    const firstProcessed = processedResults(firstSummary);

    expect(firstProcessed).toHaveLength(2);
    expect(new Set(firstProcessed.map((result) => result.outputPath)).size).toBe(2);

    for (const result of firstProcessed) {
      expect(await fileExists(result.outputPath)).toBe(true);
    }

    const second = await makeWorkspace(['02-shared.png', '02-shared.jpg'], true);
    const secondSummary = await processBatch(batchOptions(second.inputDir, second.outputDir));

    expect(outputNames(secondSummary)).toEqual(outputNames(firstSummary));
  });

  it('reports counts and output paths that match the files on disk', async () => {
    const { inputDir, outputDir } = await makeWorkspace(
      [
        '01-valid.png',
        '02-shared.png',
        '02-shared.jpg',
        '03-broken.jpg',
        '04-late-valid.png',
        'notes.txt',
      ],
      true,
    );

    const filesBefore = new Set(await listRelativeFiles(outputDir));
    const summary = await processBatch(batchOptions(inputDir, outputDir));

    expect(summary.totalFiles).toBe(5);
    expect(summary.processed).toBe(4);
    expect(summary.skipped).toBe(0);
    expect(summary.failed).toBe(1);
    expect(summary.results).toHaveLength(5);

    const processed = processedResults(summary);
    const outputs = outputNames(summary);

    expect(new Set(outputs).size).toBe(summary.processed);
    expect(processed).toHaveLength(summary.processed);
    expect(failedResults(summary)).toHaveLength(summary.failed);

    for (const outputName of outputs) {
      expect(await fileExists(path.join(outputDir, outputName))).toBe(true);
    }

    const filesAfter = await listRelativeFiles(outputDir);
    const newlyCreatedFiles = filesAfter.filter((fileName) => !filesBefore.has(fileName));

    expect(newlyCreatedFiles.sort()).toEqual(outputs);
  });
});
