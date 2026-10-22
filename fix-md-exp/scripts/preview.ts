import { createReadStream } from "node:fs";
import { rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { exportMarkdown } from "../src/export.js";

const PROJECT_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PREVIEW_ROOT = path.join(PROJECT_ROOT, "preview");
const SOURCE_DIR = path.join(PROJECT_ROOT, "examples", "docs");
const OUTPUT_DIR = path.join(PREVIEW_ROOT, "site");
const HOST = "127.0.0.1";

const MIME_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      port: { type: "string" },
    },
  });

  const port = values.port === undefined ? 4173 : Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port: ${values.port ?? ""}`);
  }

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  const result = await exportMarkdown({ source: SOURCE_DIR, output: OUTPUT_DIR });
  console.log(`Exported ${result.documents.length} document(s) to preview/site.`);

  const landingPage = path.join(PREVIEW_ROOT, "index.html");
  const landingStats = await stat(landingPage);
  if (!landingStats.isFile()) {
    throw new Error(`Preview landing page is not a file: ${landingPage}`);
  }

  const server = createServer((request, response) => {
    void serve(request, response).catch((error: unknown) => {
      console.error("Preview server error:", error);
      if (!response.headersSent) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      }
      response.end("Internal preview server error\n");
    });
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Try: npm run preview -- --port ${port + 1}`,
      );
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });

  server.listen(port, HOST, () => {
    const url = `http://${HOST}:${port}/`;
    console.log(`Preview: ${url}`);
    console.log("Open that URL in Firefox. Press Ctrl+C to stop.");
    if (process.platform === "darwin") {
      console.log(`macOS shortcut: open -a Firefox ${url}`);
    }
  });
}

async function serve(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, {
      "Allow": "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Method not allowed\n");
    return;
  }

  let pathname: string;
  try {
    const host = request.headers.host ?? `${HOST}`;
    pathname = decodeURIComponent(new URL(request.url ?? "/", `http://${host}`).pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request\n");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(PREVIEW_ROOT, relativePath);

  if (!isInside(PREVIEW_ROOT, filePath)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden\n");
    return;
  }

  const fileStats = await stat(filePath).catch(() => undefined);
  if (fileStats === undefined || !fileStats.isFile()) {
    console.log(`404 ${request.method ?? "GET"} ${pathname}`);
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Not found: ${pathname}\n`);
    return;
  }

  console.log(`200 ${request.method ?? "GET"} ${pathname}`);
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Length": fileStats.size,
    "Content-Type":
      MIME_TYPES[path.extname(filePath).toLowerCase()] ??
      "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
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

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
