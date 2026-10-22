import { Hono } from "hono";

import type { AppConfig } from "../config.js";
import { notFoundResponse } from "../errors.js";

export type RecordStatus = "active" | "paused" | "archived";

export interface RecordItem {
  id: string;
  name: string;
  owner: string;
  status: RecordStatus;
  updatedAt: string;
}

export const seedRecords: readonly RecordItem[] = [
  {
    id: "rec_001",
    name: "Quarterly access review",
    owner: "Security",
    status: "active",
    updatedAt: "2026-09-18T14:05:00.000Z",
  },
  {
    id: "rec_002",
    name: "Checkout latency investigation",
    owner: "Storefront",
    status: "active",
    updatedAt: "2026-09-22T08:40:00.000Z",
  },
  {
    id: "rec_003",
    name: "Vendor renewal",
    owner: "Finance",
    status: "paused",
    updatedAt: "2026-08-30T17:15:00.000Z",
  },
  {
    id: "rec_004",
    name: "Data export request",
    owner: "Privacy",
    status: "active",
    updatedAt: "2026-09-27T11:20:00.000Z",
  },
  {
    id: "rec_005",
    name: "Legacy endpoint retirement",
    owner: "Platform",
    status: "archived",
    updatedAt: "2026-07-11T09:00:00.000Z",
  },
  {
    id: "rec_006",
    name: "On-call handover notes",
    owner: "Reliability",
    status: "active",
    updatedAt: "2026-10-02T16:45:00.000Z",
  },
];

export interface RecordsRouterOptions {
  config: AppConfig;
  records: readonly RecordItem[];
}

export function createRecordsRouter({ config, records }: RecordsRouterOptions): Hono {
  const router = new Hono();

  router.get("/", (c) => {
    const rawLimit = c.req.query("limit");
    const limit = rawLimit === undefined ? config.defaultPageSize : Number(rawLimit);

    if (Number.isNaN(limit)) {
      return c.json({ error: "limit must be a number" }, 400);
    }

    let offset = 0;
    if (c.req.query("offset") !== undefined) {
      offset = Number(c.req.query("offset"));

      if (!Number.isInteger(offset) || offset < 0) {
        return c.json({ message: "offset must be a non-negative integer" }, 400);
      }
    }

    return c.json({
      data: records.slice(offset, offset + limit),
      meta: {
        total: records.length,
        limit,
        offset,
      },
    });
  });

  router.get("/:id", (c) => {
    const id = c.req.param("id");
    const record = records.find((candidate) => candidate.id === id);

    if (record === undefined) {
      return c.json(notFoundResponse("Record", id), 404);
    }

    return c.json({ data: record });
  });

  return router;
}
