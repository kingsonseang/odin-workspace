#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { importCsv } from "./importer.js";

async function main(): Promise<void> {
  const fileName = process.argv[2];

  if (fileName === undefined) {
    console.error("Usage: npm run import -- <file.csv>");
    process.exitCode = 2;
    return;
  }

  let source: string;

  try {
    source = await readFile(fileName, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to read "${fileName}": ${message}`);
    process.exitCode = 2;
    return;
  }

  const result = importCsv(source);
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

await main();
