import { statSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Marked } from "marked";
import type { Token, Tokens } from "marked";

const MARKDOWN_EXTENSION = /\.(?:md|markdown)$/i;
const URL_SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const ALLOWED_EXTERNAL_SCHEMES = new Set(["http", "https", "mailto", "tel"]);

export type LinkPolicyCode =
  | "outside-root"
  | "unsupported-scheme"
  | "unsupported-target"
  | "missing-target";

export class MarkdownExportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class LinkPolicyError extends MarkdownExportError {
  readonly code: LinkPolicyCode;
  readonly href: string;
  readonly sourceFile: string;
  readonly reason: string;

  constructor(options: {
    code: LinkPolicyCode;
    href: string;
    sourceFile: string;
    reason: string;
  }) {
    super(
      `Cannot export link "${options.href}" in ${options.sourceFile}: ${options.reason} ` +
        `(policy code: ${options.code})`,
    );
    this.code = options.code;
    this.href = options.href;
    this.sourceFile = options.sourceFile;
    this.reason = options.reason;
  }
}

export interface ExportOptions {
  /** A Markdown file or a directory containing Markdown files. */
  readonly source: string;
  /** Destination directory. The source tree is mirrored below this directory. */
  readonly output: string;
  /**
   * The boundary for relative link resolution.
   *
   * Defaults to the source directory, or the source file's containing
   * directory for single-file exports.
   */
  readonly documentRoot?: string;
}

export interface ExportedDocument {
  readonly sourceFile: string;
  readonly outputFile: string;
}

export interface ExportResult {
  readonly documentRoot: string;
  readonly outputDir: string;
  readonly documents: readonly ExportedDocument[];
}

interface LinkContext {
  readonly sourceFile: string;
  readonly outputFile: string;
  readonly outputDir: string;
  readonly documentRoot: string;
}

interface DocumentPlan {
  readonly sourceFile: string;
  readonly outputFile: string;
}

/**
 * Exports a Markdown file or tree to standalone HTML files.
 *
 * Every document is rendered before the first file is written. A link policy
 * failure therefore aborts the export without producing a partial tree.
 */
export async function exportMarkdown(options: ExportOptions): Promise<ExportResult> {
  const sourcePath = path.resolve(options.source);
  const outputDir = path.resolve(options.output);
  const sourceStats = await stat(sourcePath).catch((error: unknown) => {
    throw new MarkdownExportError(
      `Source does not exist or cannot be read: ${sourcePath}`,
      { cause: error },
    );
  });

  const documentRoot = path.resolve(
    options.documentRoot ??
      (sourceStats.isDirectory() ? sourcePath : path.dirname(sourcePath)),
  );
  const rootStats = await stat(documentRoot).catch((error: unknown) => {
    throw new MarkdownExportError(
      `Document root does not exist or cannot be read: ${documentRoot}`,
      { cause: error },
    );
  });

  if (!rootStats.isDirectory()) {
    throw new MarkdownExportError(`Document root is not a directory: ${documentRoot}`);
  }

  if (!isInside(documentRoot, sourcePath)) {
    throw new MarkdownExportError(
      `Source ${sourcePath} is outside the document root ${documentRoot}.`,
    );
  }

  const sourceFiles = sourceStats.isDirectory()
    ? await collectMarkdownFiles(sourcePath)
    : isMarkdownFile(sourcePath)
      ? [sourcePath]
      : [];

  if (sourceFiles.length === 0) {
    throw new MarkdownExportError(`No Markdown files found in ${sourcePath}.`);
  }

  const plans = sourceFiles.map((sourceFile) => {
    const relativeSource = path.relative(documentRoot, sourceFile);
    const relativeOutput = relativeSource.replace(MARKDOWN_EXTENSION, ".html");
    return {
      sourceFile,
      outputFile: path.join(outputDir, relativeOutput),
    } satisfies DocumentPlan;
  });

  assertUniqueOutputs(plans);

  const rendered = new Map<string, string>();
  for (const plan of plans) {
    const html = await renderDocument(plan, outputDir, documentRoot);
    rendered.set(plan.outputFile, html);
  }

  await mkdir(outputDir, { recursive: true });
  for (const [outputFile, html] of rendered) {
    await mkdir(path.dirname(outputFile), { recursive: true });
    await writeFile(outputFile, html, "utf8");
  }

  return {
    documentRoot,
    outputDir,
    documents: plans,
  };
}

async function collectMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  const files: string[] = [];
  for (const entry of entries) {
    // Symlinked directories are deliberately not followed: they can escape the
    // document root without appearing to do so in the Markdown source.
    if (entry.isSymbolicLink()) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }
      files.push(...(await collectMarkdownFiles(entryPath)));
    } else if (entry.isFile() && isMarkdownFile(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function assertUniqueOutputs(plans: readonly DocumentPlan[]): void {
  const seen = new Set<string>();
  for (const plan of plans) {
    if (seen.has(plan.outputFile)) {
      throw new MarkdownExportError(
        `Multiple source documents map to the same output file: ${plan.outputFile}`,
      );
    }
    seen.add(plan.outputFile);
  }
}

async function renderDocument(
  plan: DocumentPlan,
  outputDir: string,
  documentRoot: string,
): Promise<string> {
  const markdown = await readFile(plan.sourceFile, "utf8");
  const context: LinkContext = {
    sourceFile: plan.sourceFile,
    outputFile: plan.outputFile,
    outputDir,
    documentRoot,
  };

  const marked = new Marked({ gfm: true });
  const tokens = marked.lexer(markdown);
  const title = findTitle(tokens, path.basename(plan.sourceFile, path.extname(plan.sourceFile)));

  marked.walkTokens(tokens, (token) => {
    if (token.type === "link") {
      const link = token as Tokens.Link;
      link.href = rewriteHref(link.href, context);
    }
  });

  const body = marked.parser(tokens);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0 auto;
      max-width: 70ch;
      padding: 2rem 1.25rem 4rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      line-height: 1.65;
    }
    a { color: #0b66c3; }
    code { font-size: 0.92em; }
    @media (prefers-color-scheme: dark) {
      a { color: #7ab8ff; }
    }
  </style>
</head>
<body>
<main>
${body}</main>
</body>
</html>
`;
}

function rewriteHref(rawHref: string, context: LinkContext): string {
  const href = rawHref.trim();

  if (href === "") {
    throw new LinkPolicyError({
      code: "unsupported-target",
      href: rawHref,
      sourceFile: context.sourceFile,
      reason: "empty link destinations are not supported",
    });
  }

  if (href.startsWith("#")) {
    return href;
  }

  if (href.startsWith("//")) {
    throw new LinkPolicyError({
      code: "unsupported-target",
      href,
      sourceFile: context.sourceFile,
      reason: "protocol-relative URLs are not supported",
    });
  }

  const schemeMatch = URL_SCHEME.exec(href);
  if (schemeMatch !== null) {
    const scheme = schemeMatch[1]?.toLowerCase() ?? "";
    if (ALLOWED_EXTERNAL_SCHEMES.has(scheme)) {
      return href;
    }
    throw new LinkPolicyError({
      code: "unsupported-scheme",
      href,
      sourceFile: context.sourceFile,
      reason: `the "${scheme}" URL scheme is not allowed`,
    });
  }

  if (href.startsWith("/") || path.isAbsolute(href)) {
    throw new LinkPolicyError({
      code: "unsupported-target",
      href,
      sourceFile: context.sourceFile,
      reason: "server-root-relative and absolute filesystem paths are not supported",
    });
  }

  const suffixIndex = href.search(/[?#]/);
  const targetPart = suffixIndex === -1 ? href : href.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex);

  if (targetPart === "" || !MARKDOWN_EXTENSION.test(targetPart)) {
    throw new LinkPolicyError({
      code: "unsupported-target",
      href,
      sourceFile: context.sourceFile,
      reason: "relative links must point to a .md or .markdown file",
    });
  }

  // Relative targets are anchored to the document that contains the link, not
  // to the output directory or the process working directory.
  const targetFile = path.resolve(path.dirname(context.sourceFile), targetPart);

  if (!isInside(context.documentRoot, targetFile)) {
    throw new LinkPolicyError({
      code: "outside-root",
      href,
      sourceFile: context.sourceFile,
      reason: `the target resolves outside the document root ${context.documentRoot}`,
    });
  }

  let targetIsFile: boolean;
  try {
    targetIsFile = statSync(targetFile).isFile();
  } catch {
    throw new LinkPolicyError({
      code: "missing-target",
      href,
      sourceFile: context.sourceFile,
      reason: `the target file does not exist at ${targetFile}`,
    });
  }

  if (!targetIsFile) {
    throw new LinkPolicyError({
      code: "unsupported-target",
      href,
      sourceFile: context.sourceFile,
      reason: "the link target is not a regular file",
    });
  }

  const targetRelativeToRoot = path.relative(context.documentRoot, targetFile);
  const targetRelativeHtml = targetRelativeToRoot.replace(MARKDOWN_EXTENSION, ".html");
  const targetOutputFile = path.join(context.outputDir, targetRelativeHtml);

  // Seeded defect: hrefs are calculated from the export root. This is correct
  // for root-level documents but wrong for every nested source document.
  const relativeHref = path.relative(context.outputDir, targetOutputFile);

  return `${toPosixPath(relativeHref)}${suffix}`;
}

function findTitle(tokens: readonly Token[], fallback: string): string {
  for (const token of tokens) {
    if (token.type === "heading") {
      const heading = token as Tokens.Heading;
      if (heading.depth === 1) {
        const text = heading.text.trim();
        if (text !== "") {
          return text;
        }
      }
    }
  }
  return fallback;
}

function isMarkdownFile(file: string): boolean {
  return MARKDOWN_EXTENSION.test(file);
}

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}
