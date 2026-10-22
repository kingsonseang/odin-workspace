import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { exportMarkdown, LinkPolicyError } from "../src/export.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FIXTURE_DIR = path.join(PROJECT_ROOT, "examples", "docs");

describe("Markdown export", () => {
  const pages = new Map<string, string>();
  let outputDir = "";
  let documentPaths: string[] = [];

  before(async () => {
    outputDir = await mkdtemp(path.join(os.tmpdir(), "markdown-export-"));
    const result = await exportMarkdown({
      source: FIXTURE_DIR,
      output: outputDir,
    });

    documentPaths = result.documents
      .map((document) =>
        toPosixPath(path.relative(outputDir, document.outputFile)),
      )
      .sort();

    for (const document of result.documents) {
      const relativePath = toPosixPath(
        path.relative(outputDir, document.outputFile),
      );
      pages.set(relativePath, await readFile(document.outputFile, "utf8"));
    }
  });

  after(async () => {
    if (outputDir !== "") {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("mirrors the Markdown tree with .html extensions", () => {
    assert.deepEqual(documentPaths, [
      "about.html",
      "guide/advanced/configuration.html",
      "guide/index.html",
      "guide/setup.html",
      "index.html",
      "reference/api.html",
    ]);
  });

  test("rewrites root-level Markdown links", () => {
    const html = page(pages, "index.html");

    assert.equal(hrefFor(html, "Root sibling link"), "about.html");
    assert.equal(hrefFor(html, "Nested guide link"), "guide/index.html");
    assert.equal(
      hrefFor(html, "Deep configuration link"),
      "guide/advanced/configuration.html",
    );
    assert.equal(hrefFor(html, "API reference"), "reference/api.html");
  });

  test("rewrites a nested sibling link relative to the nested document", () => {
    assert.equal(
      hrefFor(page(pages, "guide/index.html"), "Nested sibling setup link"),
      "setup.html",
    );
    assert.equal(
      hrefFor(page(pages, "guide/setup.html"), "Back to guide index"),
      "index.html",
    );
  });

  test("rewrites nested child links without prefixing the export root", () => {
    assert.equal(
      hrefFor(
        page(pages, "guide/index.html"),
        "Nested child configuration link",
      ),
      "advanced/configuration.html",
    );
    assert.equal(
      hrefFor(page(pages, "guide/setup.html"), "Configuration below setup"),
      "advanced/configuration.html",
    );
  });

  test("rewrites parent-directory links relative to the nested document", () => {
    const html = page(pages, "guide/index.html");

    assert.equal(hrefFor(html, "Nested parent about link"), "../about.html");
    assert.equal(
      hrefFor(html, "Nested parent team anchor"),
      "../about.html#team",
    );
    assert.equal(hrefFor(html, "Nested root link"), "../index.html");
  });

  test("rewrites parent links from a deeply nested document", () => {
    const html = page(pages, "guide/advanced/configuration.html");

    assert.equal(hrefFor(html, "Parent setup guide"), "../setup.html");
    assert.equal(hrefFor(html, "Project root"), "../../index.html");
    assert.equal(
      hrefFor(html, "Parent about team"),
      "../../about.html#team",
    );
    assert.equal(hrefFor(html, "Guide index"), "../index.html");

    assert.equal(
      hrefFor(page(pages, "reference/api.html"), "Root document"),
      "../index.html",
    );
    assert.equal(
      hrefFor(page(pages, "reference/api.html"), "Guide from reference"),
      "../guide/index.html",
    );
  });

  test("preserves external URLs and anchors", () => {
    assert.equal(
      hrefFor(page(pages, "index.html"), "External HTTPS link"),
      "https://commonmark.org/",
    );
    assert.equal(
      hrefFor(page(pages, "guide/index.html"), "Nested external HTTPS link"),
      "https://commonmark.org/",
    );
    assert.equal(
      hrefFor(page(pages, "index.html"), "Page anchor link"),
      "#overview",
    );
    assert.equal(
      hrefFor(page(pages, "guide/index.html"), "Nested page anchor link"),
      "#guide-overview",
    );
  });

  test("leaves headings and ordinary text unchanged", () => {
    const root = page(pages, "index.html");
    assert.ok(root.includes("<h1>Markdown Export Fixtures</h1>"));
    assert.ok(root.includes("<h2>Working links</h2>"));
    assert.ok(
      root.includes(
        "<p>Ordinary paragraph text must survive the link rewrite.</p>",
      ),
    );

    const guide = page(pages, "guide/index.html");
    assert.ok(guide.includes("<h1>Guide</h1>"));
    assert.ok(guide.includes("<h2>Overview</h2>"));
    assert.ok(
      guide.includes("<p>The guide checks links from a nested document.</p>"),
    );
  });
});

describe("link policy", () => {
  test("rejects unsupported URL schemes before writing output", async () => {
    for (const destination of [
      "javascript:void(0)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "ftp://example.com/file.md",
    ]) {
      await withTempTree(
        { "docs/page.md": `# Page\n\n[Bad link](${destination})\n` },
        async (treeRoot) => {
          const source = path.join(treeRoot, "docs");
          const output = path.join(treeRoot, "out");

          await assert.rejects(
            exportMarkdown({ source, output }),
            (error: unknown) =>
              error instanceof LinkPolicyError &&
              error.code === "unsupported-scheme",
          );
          await assert.rejects(access(output), { code: "ENOENT" });
        },
      );
    }
  });

  test("rejects server-root-relative and protocol-relative links", async () => {
    for (const destination of ["/about.md", "//example.com/about.md"]) {
      await withTempTree(
        { "docs/page.md": `# Page\n\n[Bad link](${destination})\n` },
        async (treeRoot) => {
          await assert.rejects(
            exportMarkdown({
              source: path.join(treeRoot, "docs"),
              output: path.join(treeRoot, "out"),
            }),
            (error: unknown) =>
              error instanceof LinkPolicyError &&
              error.code === "unsupported-target",
          );
        },
      );
    }
  });

  test("rejects relative links that escape the document root", async () => {
    await withTempTree(
      {
        "docs/guide/page.md": "# Page\n\n[Outside](../../outside.md)\n",
        "outside.md": "# Outside\n",
      },
      async (treeRoot) => {
        const output = path.join(treeRoot, "out");

        await assert.rejects(
          exportMarkdown({
            source: path.join(treeRoot, "docs"),
            output,
          }),
          (error: unknown) =>
            error instanceof LinkPolicyError && error.code === "outside-root",
        );
        await assert.rejects(access(output), { code: "ENOENT" });
      },
    );
  });

  test("rejects relative non-Markdown and missing targets", async () => {
    await withTempTree(
      { "docs/page.md": "# Page\n\n[Text](notes.txt)\n" },
      async (treeRoot) => {
        await assert.rejects(
          exportMarkdown({
            source: path.join(treeRoot, "docs"),
            output: path.join(treeRoot, "out"),
          }),
          (error: unknown) =>
            error instanceof LinkPolicyError &&
            error.code === "unsupported-target",
        );
      },
    );

    await withTempTree(
      { "docs/page.md": "# Page\n\n[Missing](missing.md)\n" },
      async (treeRoot) => {
        await assert.rejects(
          exportMarkdown({
            source: path.join(treeRoot, "docs"),
            output: path.join(treeRoot, "out"),
          }),
          (error: unknown) =>
            error instanceof LinkPolicyError && error.code === "missing-target",
        );
      },
    );
  });

  test("preserves allowed external schemes", async () => {
    await withTempTree(
      {
        "docs/page.md": [
          "# Links",
          "",
          "[HTTP link](http://example.com/docs)",
          "[Mail link](mailto:docs@example.com)",
          "[Phone link](tel:+15551234567)",
          "",
        ].join("\n"),
      },
      async (treeRoot) => {
        const output = path.join(treeRoot, "out");
        await exportMarkdown({
          source: path.join(treeRoot, "docs"),
          output,
        });
        const html = await readFile(path.join(output, "page.html"), "utf8");

        assert.equal(hrefFor(html, "HTTP link"), "http://example.com/docs");
        assert.equal(hrefFor(html, "Mail link"), "mailto:docs@example.com");
        assert.equal(hrefFor(html, "Phone link"), "tel:+15551234567");
      },
    );
  });
});

function page(pages: ReadonlyMap<string, string>, relativePath: string): string {
  const html = pages.get(relativePath);
  if (html === undefined) {
    throw new Error(`Expected exported page was not read: ${relativePath}`);
  }
  return html;
}

function hrefFor(html: string, label: string): string | undefined {
  const pattern = new RegExp(
    `<a\\s+href="([^"]*)"[^>]*>${escapeRegExp(label)}</a>`,
  );
  return pattern.exec(html)?.[1];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

async function withTempTree(
  files: Readonly<Record<string, string>>,
  run: (treeRoot: string) => Promise<void>,
): Promise<void> {
  const treeRoot = await mkdtemp(path.join(os.tmpdir(), "markdown-policy-"));
  try {
    for (const [relativePath, contents] of Object.entries(files)) {
      const filePath = path.join(treeRoot, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, contents, "utf8");
    }
    await run(treeRoot);
  } finally {
    await rm(treeRoot, { recursive: true, force: true });
  }
}
