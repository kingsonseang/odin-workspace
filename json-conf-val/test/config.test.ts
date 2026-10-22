import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ConfigError, loadConfig } from "../src/config.js";

const PROJECT_ROOT = fileURLToPath(new URL("../", import.meta.url));

function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

function captureConfigError(run: () => unknown): ConfigError {
  try {
    run();
  } catch (error) {
    if (error instanceof ConfigError) {
      return error;
    }

    const actual =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    assert.fail(`Expected ConfigError, received ${actual}`);
  }

  assert.fail("Expected loadConfig to throw ConfigError, but it returned a value.");
}

function issuePaths(error: ConfigError): string[] {
  return error.issues.map((issue) => issue.path).sort();
}

function assertIssuesHaveMessages(error: ConfigError): void {
  for (const issue of error.issues) {
    assert.ok(issue.message.trim().length > 0, `Empty message for ${issue.path}`);
  }
}

describe("loadConfig", () => {
  it("loads the valid sample configuration", () => {
    const config = loadConfig(`${PROJECT_ROOT}config/service.config.json`);

    assert.deepEqual(config, {
      serviceName: "billing-api",
      port: 8080,
      environment: "development",
    });
  });

  it("reports every missing required field", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("missing-required.json")),
    );

    assert.deepEqual(issuePaths(error), ["environment", "serviceName"]);
    assert.match(error.message, /serviceName/);
    assert.match(error.message, /environment/);
    assertIssuesHaveMessages(error);
  });

  it("reports all fields with the wrong types", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("wrong-types.json")),
    );

    assert.deepEqual(issuePaths(error), ["environment", "port", "serviceName"]);
    assertIssuesHaveMessages(error);
  });

  it("rejects a negative port", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("invalid-port-negative.json")),
    );

    assert.deepEqual(issuePaths(error), ["port"]);
    assertIssuesHaveMessages(error);
  });

  it("rejects a port above 65535", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("invalid-port-out-of-range.json")),
    );

    assert.deepEqual(issuePaths(error), ["port"]);
    assertIssuesHaveMessages(error);
  });

  it("rejects an unsupported environment", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("invalid-environment.json")),
    );

    assert.deepEqual(issuePaths(error), ["environment"]);
    assertIssuesHaveMessages(error);
  });

  it("rejects unknown fields and names each one", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("unknown-field.json")),
    );

    assert.deepEqual(issuePaths(error), ["retries", "timeoutMs"]);
    assertIssuesHaveMessages(error);
  });

  it("reports malformed JSON with file context", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("malformed.json")),
    );

    assert.match(error.message, /malformed\.json/);
    assert.match(error.message, /JSON/i);
  });

  it("collects all issues instead of returning a partially valid config", () => {
    const error = captureConfigError(() =>
      loadConfig(fixture("partial-invalid.json")),
    );

    assert.deepEqual(issuePaths(error), ["environment", "port"]);
    assertIssuesHaveMessages(error);
  });
});
