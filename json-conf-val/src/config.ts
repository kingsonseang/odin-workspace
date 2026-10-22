import { readFileSync } from "node:fs";

import type { ConfigIssue, ServiceConfig } from "./types.js";

/**
 * Intended public error shape for configuration failures.
 *
 * The starter declares the class but does not use it yet. The loader currently
 * lets raw filesystem and JSON parsing errors escape.
 */
export class ConfigError extends Error {
  readonly issues: readonly ConfigIssue[];

  constructor(message: string, issues: readonly ConfigIssue[] = []) {
    super(message);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

/**
 * Load a JSON service configuration.
 *
 * Intentional starter defect: a TypeScript type assertion provides no runtime
 * validation. Missing fields, wrong types, invalid ports, invalid
 * environments, and unknown fields all pass through unchanged.
 */
export function loadConfig(filePath: string): ServiceConfig {
  const contents = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(contents) as ServiceConfig;
  return parsed;
}
