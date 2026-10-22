#!/usr/bin/env node

import path from "node:path";
import { parseArgs } from "node:util";
import { exportMarkdown, MarkdownExportError } from "./export.js";

const HELP = `Usage:
  npm run export -- <source.md|source-dir> <output-dir> [--root <document-root>]

Examples:
  npm run export -- examples/docs build/docs
  npm run export -- examples/docs/guide/setup.md build/one --root examples/docs

Options:
  --root <dir>   Boundary used to validate and rewrite relative links.
  -h, --help     Show this message.
`;

interface CliArguments {
  values: {
    root?: string;
    help?: boolean;
  };
  positionals: string[];
}

async function main(): Promise<void> {
  let parsed: CliArguments;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        root: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    }) as CliArguments;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${message}\n\n${HELP}`);
    process.exitCode = 2;
    return;
  }

  if (parsed.values.help === true) {
    console.log(HELP);
    return;
  }

  const [source, output, ...extra] = parsed.positionals;
  if (source === undefined || output === undefined || extra.length > 0) {
    console.error(`Expected exactly two positional arguments.\n\n${HELP}`);
    process.exitCode = 2;
    return;
  }

  try {
    const result = await exportMarkdown({
      source,
      output,
      ...(parsed.values.root === undefined
        ? {}
        : { documentRoot: parsed.values.root }),
    });
    const relativeOutput = path.relative(process.cwd(), result.outputDir);
    console.log(
      `Exported ${result.documents.length} document(s) to ${relativeOutput || "."}.`,
    );
  } catch (error: unknown) {
    if (error instanceof MarkdownExportError) {
      console.error(error.message);
    } else if (error instanceof Error) {
      console.error(error.stack ?? error.message);
    } else {
      console.error(String(error));
    }
    process.exitCode = 1;
  }
}

void main();
