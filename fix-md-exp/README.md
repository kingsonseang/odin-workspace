# Markdown link export

A small, strict TypeScript utility that converts Markdown files into standalone
HTML documents while enforcing a deliberate policy for links. It is intentionally
not a documentation-site generator: there is no router, search, navigation
generation, or server-side rendering.

The repository includes a **seeded relative-link bug** for a bug-fixing exercise.
The test suite describes the correct behavior and is expected to fail until the
bug is fixed. See [Seeded bug](#seeded-bug).

## Requirements

- Node.js **20.11 or newer**
- npm 10 or newer

## Quick start

```bash
npm install
npm run build
npm test          # intentionally fails before the bug fix
npm run preview   # exports examples/docs and serves preview/
```

`npm run preview` prints a local URL, by default:

```text
http://127.0.0.1:4173/
```

Open it in Firefox. On macOS:

```bash
open -a Firefox http://127.0.0.1:4173/
```

Stop the preview server with `Ctrl+C`. You can choose another port with:

```bash
npm run preview -- --port 5000
```

The preview server serves only the `preview/` directory with Node's built-in
`node:http`. It does not rewrite routes. `preview/index.html` is a static landing
page that links to the generated files; `preview/site/` is produced by the
exporter and is ignored by git.

You can also generate the sample files and open the landing page directly:

```bash
npm run export:sample
open -a Firefox preview/index.html
```

The HTTP preview is preferred because the server logs the 404s caused by the
seeded bug.

## Commands

| Command | Purpose |
|---|---|
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run typecheck` | Run the compiler without emitting files |
| `npm test` | Build and run the acceptance/policy tests |
| `npm run export -- <source> <output>` | Export any Markdown file or directory |
| `npm run export:sample` | Export `examples/docs` to `preview/site` |
| `npm run preview [-- --port 5000]` | Build, export the sample, and serve `preview/` |

CLI usage:

```bash
npm run export -- examples/docs build/docs
npm run export -- examples/docs/guide/setup.md build/one --root examples/docs
```

The first form mirrors the source tree. The second exports one file, using
`examples/docs` as the document root, so the output is
`build/one/guide/setup.html`.

## Project layout

```text
src/export.ts                 Exporter, rendering, link policy
src/cli.ts                    Small CLI wrapper
scripts/preview.ts            Sample exporter plus static preview server
tests/export.test.ts          Acceptance and link-policy tests
examples/docs/                Nested sample Markdown documents
preview/index.html            Static preview landing page
preview/site/                 Generated sample output (ignored)
dist/                         Compiled JavaScript (ignored)
```

## Markdown and HTML behavior

- Uses [`marked`](https://marked.js.org/) 18.x with GFM enabled.
- Preserves the source directory structure and changes `.md` / `.markdown`
  extensions to `.html`.
- Renders each page as a complete standalone HTML document with a small inline
  stylesheet.
- Link rewriting is limited to Markdown link tokens. Heading rendering,
  emphasis, lists, code blocks, and ordinary paragraph text stay on the parser's
  normal path.
- Output is written only after every document has rendered successfully, so a
  link-policy error cannot leave a partially written export.
- Existing output files are overwritten. Stale files are not deleted by the
  exporter; `npm run preview` clears `preview/site` before regenerating it.
- Raw HTML and image `src` attributes are outside the link policy. The exporter
  is intended for trusted Markdown, not as an HTML sanitizer.

## Link policy

Relative links are resolved against the **source document's directory**. They are
never resolved against the output directory or `process.cwd()`.

| Link form | Result |
|---|---|
| `https://...`, `http://...` | Preserved exactly |
| `mailto:...`, `tel:...` | Preserved exactly |
| `#section` | Preserved exactly |
| `about.md`, `./setup.md`, `../about.md`, `advanced/config.md` | Resolve against the source document, require an existing Markdown file, and rewrite to the corresponding `.html` path |
| `../about.md#team` | Rewritten path with the fragment preserved |
| `?` / `#` suffix on a relative Markdown link | Suffix preserved |
| `/absolute/site/path.md` | Rejected |
| `//example.com/page.md` | Rejected as protocol-relative |
| `javascript:`, `data:`, `file:`, `ftp:`, `vbscript:`, other schemes | Rejected as unsupported |
| Relative links to non-Markdown files | Rejected |
| Missing Markdown target | Rejected |
| Path escaping the allowed document root | Rejected |
| Empty href | Rejected |

Rejected links throw a typed `LinkPolicyError` with a machine-readable `code`:

- `unsupported-scheme`
- `unsupported-target`
- `outside-root`
- `missing-target`

The export aborts before writing files. This fail-fast policy keeps unsafe or
ambiguous URLs out of the generated HTML and makes failures visible during the
build.

### Document root

By default the document root is:

- the source directory, when exporting a directory; or
- the source file's containing directory, when exporting a single file.

Use `--root <dir>` (CLI) or `documentRoot` (API) to widen or change that boundary.
Every relative Markdown target must remain inside it, both for security and to
keep generated links inside the exported tree.

Generated hrefs are canonical: no leading `./` is added. For example, a sibling
link becomes `setup.html`, a parent link becomes `../about.html`, and a nested
link from the root becomes `guide/setup.html`.

## Seeded bug

`src/export.ts` contains one deliberate defect: after resolving and validating a
Markdown target correctly, it calculates the final href relative to the **export
root**:

```ts
const relativeHref = path.relative(context.outputDir, targetOutputFile);
```

The href should instead be relative to the **current output document's
directory**:

```ts
const relativeHref = path.relative(
  path.dirname(context.outputFile),
  targetOutputFile,
);
```

Consequences:

| Source | Source link | Correct href | Seeded href |
|---|---|---|---|
| `guide/index.md` | `setup.md` | `setup.html` | `guide/setup.html` |
| `guide/index.md` | `advanced/configuration.md` | `advanced/configuration.html` | `guide/advanced/configuration.html` |
| `guide/index.md` | `../about.md` | `../about.html` | `about.html` |
| `guide/advanced/configuration.md` | `../../index.md` | `../../index.html` | `index.html` |

Root-level documents look correct, which makes the defect easy to miss in a
quick preview. External HTTPS links and anchors are unaffected, and target
validation/root containment continue to work.

`npm test` fails on the nested-link assertions. The fixtures, tests, README, and
preview page should not be weakened to make the suite pass; fix the resolution
behavior in `src/export.ts`.

## Tests

The suite uses Node's built-in test runner and `node:test` assertions. It checks:

- exact generated href values for root siblings, nested siblings, nested
  children, parent directories, deep parents, external HTTPS URLs, and anchors;
- unchanged heading and plain paragraph HTML;
- preservation of `http`, `https`, `mailto`, and `tel` URLs;
- rejection of unsupported schemes, root-relative and protocol-relative links,
  non-Markdown targets, missing targets, and paths escaping the document root;
- that a policy failure writes no output directory.

Before the fix, run:

```bash
npm test
```

The current suite has 13 tests: 9 pass and 4 fail. All four failures are
nested-link assertions that expose the seeded bug. After changing the href base
and rebuilding, all 13 should pass alongside the existing rendering and policy
tests.

## Programmatic use

```ts
import { exportMarkdown } from "./dist/src/export.js";

const result = await exportMarkdown({
  source: "examples/docs",
  output: "build/docs",
  // documentRoot: "examples/docs",
});

console.log(result.documents);
```
