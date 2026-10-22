import { serve } from "@hono/node-server";
import { config as loadDotenv } from "dotenv";
import { Hono } from "hono";
import { pathToFileURL } from "node:url";

import { loadConfig, type AppConfig } from "./config.js";
import { internalErrorResponse } from "./errors.js";
import {
  createRecordsRouter,
  seedRecords,
  type RecordItem,
} from "./routes/records.js";

export interface CreateAppOptions {
  config?: AppConfig;
  records?: readonly RecordItem[];
}

export function createApp(options: CreateAppOptions = {}): Hono {
  const config = options.config ?? loadConfig();
  const records = options.records ?? seedRecords;
  const app = new Hono();

  if (config.nodeEnv !== "test") {
    app.use("*", async (c, next) => {
      const startedAt = Date.now();
      await next();

      console.info(
        JSON.stringify({
          level: "info",
          event: "request_completed",
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: Date.now() - startedAt,
        }),
      );
    });
  }

  app.onError((error, c) => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "request_failed",
        method: c.req.method,
        path: c.req.path,
        name: error.name,
        message: error.message,
      }),
    );

    return c.json(internalErrorResponse(), 500);
  });

  app.get("/health", (c) => {
    const recordsStatus = records.length > 0 ? "ok" : "degraded";

    return c.json({
      status: recordsStatus,
      service: "records-api",
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        records: recordsStatus,
      },
    });
  });

  app.route("/records", createRecordsRouter({ config, records }));

  return app;
}

function startServer(): void {
  loadDotenv({ quiet: true });

  const config = loadConfig();
  const app = createApp({ config });

  const server = serve(
    {
      fetch: app.fetch,
      hostname: config.host,
      port: config.port,
    },
    (info) => {
      console.info(
        JSON.stringify({
          level: "info",
          event: "server_started",
          host: config.host,
          port: info.port,
          environment: config.nodeEnv,
        }),
      );
    },
  );

  const shutdown = (signal: string): void => {
    console.info(
      JSON.stringify({
        level: "info",
        event: "shutdown_started",
        signal,
      }),
    );

    server.close((error) => {
      if (error !== undefined) {
        console.error(
          JSON.stringify({
            level: "error",
            event: "shutdown_failed",
            message: error.message,
          }),
        );
        process.exitCode = 1;
        return;
      }

      console.info(
        JSON.stringify({
          level: "info",
          event: "shutdown_complete",
        }),
      );
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

const entrypoint = process.argv[1];

if (entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href) {
  startServer();
}
