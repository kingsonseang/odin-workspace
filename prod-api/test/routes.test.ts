import assert from "node:assert/strict";
import { test } from "node:test";

import { loadConfig } from "../src/config.js";
import {
  seedRecords,
  type RecordItem,
} from "../src/routes/records.js";
import { createApp } from "../src/server.js";

interface RecordListBody {
  data: RecordItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

const config = loadConfig({
  NODE_ENV: "test",
  HOST: "127.0.0.1",
  PORT: "3000",
  DEFAULT_PAGE_SIZE: "20",
  MAX_PAGE_SIZE: "100",
});

function makeApp(records: readonly RecordItem[] = seedRecords) {
  return createApp({ config, records });
}

test("GET /health reports the current service checks", async () => {
  const response = await makeApp().request("/health");
  const body = (await response.json()) as {
    status: string;
    service: string;
    uptimeSeconds: number;
    checks: { records: string };
  };

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "records-api");
  assert.equal(body.checks.records, "ok");
  assert.equal(typeof body.uptimeSeconds, "number");
});

test("GET /records returns the configured default page", async () => {
  const response = await makeApp().request("/records");
  const body = (await response.json()) as RecordListBody;

  assert.equal(response.status, 200);
  assert.equal(body.data.length, seedRecords.length);
  assert.deepEqual(body.data, seedRecords);
  assert.deepEqual(body.meta, {
    total: seedRecords.length,
    limit: 20,
    offset: 0,
  });
});

test("GET /records supports limit and offset pagination", async () => {
  const response = await makeApp().request("/records?limit=2&offset=1");
  const body = (await response.json()) as RecordListBody;

  assert.equal(response.status, 200);
  assert.deepEqual(body.data, seedRecords.slice(1, 3));
  assert.deepEqual(body.meta, {
    total: seedRecords.length,
    limit: 2,
    offset: 1,
  });
});

test("GET /records/:id returns a known record", async () => {
  const record = seedRecords[1];
  assert.ok(record);

  const response = await makeApp().request(`/records/${record.id}`);
  const body = (await response.json()) as { data: RecordItem };

  assert.equal(response.status, 200);
  assert.deepEqual(body.data, record);
});

test("GET /records rejects a non-numeric limit", async () => {
  const response = await makeApp().request("/records?limit=not-a-number");

  assert.equal(response.status, 400);
});
