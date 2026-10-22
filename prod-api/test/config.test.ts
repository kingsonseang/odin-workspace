import assert from "node:assert/strict";
import { test } from "node:test";

import { loadConfig } from "../src/config.js";

test("loadConfig applies documented local defaults when values are unset", () => {
  const config = loadConfig({});

  assert.deepEqual(config, {
    nodeEnv: "development",
    host: "127.0.0.1",
    port: 3000,
    defaultPageSize: 20,
    maxPageSize: 100,
  });
});

test("loadConfig reads explicit environment overrides", () => {
  const config = loadConfig({
    NODE_ENV: "production",
    HOST: "0.0.0.0",
    PORT: "8080",
    DEFAULT_PAGE_SIZE: "10",
    MAX_PAGE_SIZE: "50",
  });

  assert.deepEqual(config, {
    nodeEnv: "production",
    host: "0.0.0.0",
    port: 8080,
    defaultPageSize: 10,
    maxPageSize: 50,
  });
});
