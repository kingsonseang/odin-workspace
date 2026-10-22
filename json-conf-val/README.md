# JSON Configuration Validation Starter

> **Warning:** This is an intentionally incomplete starter, not production-ready
> code. The loader trusts a TypeScript type assertion instead of validating the
> parsed JSON. The acceptance tests are meant to fail until runtime validation
> is implemented.

This project loads a JSON service configuration and is meant to demonstrate why
TypeScript types cannot protect a runtime trust boundary. `loadConfig()` claims
to return a `ServiceConfig`, but the data comes from a file and is not checked.

## Requirements

- Node.js 20.11 or newer
- npm

## Setup

```sh
npm install
```

## Commands

```sh
npm start                                  # load config/service.config.json
npm start -- path/to/config.json           # load a specific file
npm run typecheck                          # strict TypeScript check
npm run build                              # compile to dist/
npm test                                   # acceptance tests
```

`npm run typecheck` and `npm run build` pass against the starter. `npm test`
does **not** pass yet: the valid-configuration test passes, while the remaining
eight tests reproduce the defects described below. This is expected.

## Configuration contract

The JSON document must be an object with exactly these fields:

| Field         | Required | Rule                                                        |
| ------------- | -------- | ----------------------------------------------------------- |
| `serviceName` | yes      | Non-empty string; whitespace-only values are invalid         |
| `port`        | yes      | Integer from `1` through `65535`, inclusive                  |
| `environment` | yes      | Exactly `development`, `test`, or `production` (case-sensitive) |

**Unknown fields are rejected.** An unknown top-level field must be reported by
name rather than silently accepted or ignored.

A valid sample is provided at [`config/service.config.json`](./config/service.config.json):

```json
{
  "serviceName": "billing-api",
  "port": 8080,
  "environment": "development"
}
```

The root value must be a JSON object. The loader must not return a partially
valid configuration: if any field is invalid, no configuration is returned.

## Error contract

When loading fails, `loadConfig()` should throw `ConfigError` with:

- A readable `message` that includes the affected file and all validation
  problems. Parse failures should mention that the JSON is malformed.
- An `issues` array containing one entry per invalid field, with a `path`
  identifying the field and an actionable `message`.

Example target shape:

```text
Invalid configuration in "config/service.config.json":
  - serviceName: Required field is missing.
  - port: Must be an integer between 1 and 65535; received -1.
  - retries: Unknown field.
```

Validation problems must be collected and reported together rather than failing
at the first field. The loader should only construct and return a
`ServiceConfig` after the complete input has passed validation.

## Intentional starter defects

`src/config.ts` currently does this:

```ts
const parsed = JSON.parse(contents) as ServiceConfig;
return parsed;
```

Because TypeScript types are erased at runtime, the assertion checks nothing.

| Defect | Current behavior | Required behavior |
| --- | --- | --- |
| Missing fields | Values become `undefined`; downstream code can throw a confusing `TypeError` | Reject with issues naming every missing field |
| Wrong field types | Values pass through unchanged | Reject with an issue for each wrong type |
| Missing port validation | Negative and out-of-range ports are accepted | Require an integer from 1 through 65535 |
| Missing environment validation | Any string is accepted | Require one of the three supported environments |
| Unknown fields | Silently carried through | Reject and name every unknown field |
| Malformed JSON | Raw `SyntaxError` escapes without file context | Throw `ConfigError` with the file and parse problem |
| Missing file | Raw filesystem error escapes | Fail with a clear error that identifies the file |
| Partial results | Invalid data is returned as if valid | Validate everything before returning anything |

## Reproduce the defects

Run the sample to see the happy path:

```sh
npm start
```

Then try the broken inputs:

```sh
npm start -- test/fixtures/missing-required.json
# Cannot read properties of undefined (reading 'toUpperCase')

npm start -- test/fixtures/invalid-port-negative.json
# Succeeds and prints "Port: -1"

npm start -- test/fixtures/unknown-field.json
# Succeeds while silently accepting "retries" and "timeoutMs"

npm start -- test/fixtures/malformed.json
# Raw JSON SyntaxError without the file path
```

The CLI deliberately calls `config.serviceName.toUpperCase()` to show how an
unvalidated configuration fails later, far away from the actual source of the
bad data.

## Tests

The suite in [`test/config.test.ts`](./test/config.test.ts) is the acceptance
specification. Current starter result: **1 passing, 8 failing**.

| Test | Fixture | Expected behavior |
| --- | --- | --- |
| Loads valid configuration | sample config | Returns the validated object |
| Reports missing fields | `missing-required.json` | Issues for `serviceName` and `environment` |
| Reports wrong types | `wrong-types.json` | Issues for all three fields |
| Rejects negative port | `invalid-port-negative.json` | Issue for `port` |
| Rejects out-of-range port | `invalid-port-out-of-range.json` | Issue for `port` |
| Rejects unsupported environment | `invalid-environment.json` | Issue for `environment` |
| Rejects unknown fields | `unknown-field.json` | Issues for `retries` and `timeoutMs` |
| Reports malformed JSON | `malformed.json` | `ConfigError` with the file and JSON context |
| Never returns a partial config | `partial-invalid.json` | Issues for `environment` and `port`; no result returned |

The fixture directory also contains the intentionally invalid JSON needed to
exercise these cases.

## Your task

Implement runtime validation in `src/config.ts` so the acceptance suite passes:

1. Treat `JSON.parse()` output as `unknown`; do not use type assertions to
   create a `ServiceConfig`.
2. Validate the complete document: required fields, types, port range and
   integer constraint, environment allow-list, and unknown fields.
3. Collect all validation issues and throw one `ConfigError` naming every
   affected field. Do not return a partial configuration.
4. Wrap file/read and JSON parse failures in clear `ConfigError` messages that
   identify the file and the problem.
5. Keep the project dependency-free at runtime. Do not add a validation
   framework; plain TypeScript checks are sufficient for this schema.
6. Keep the existing tests and schema contract intact.

Small helper modules or functions are fine, but `loadConfig()` remains the
public entry point.

## Project layout

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── config/
│   └── service.config.json
├── src/
│   ├── cli.ts
│   ├── config.ts        # loadConfig() and ConfigError
│   └── types.ts         # schema types and supported values
└── test/
    ├── config.test.ts
    └── fixtures/
        ├── invalid-environment.json
        ├── invalid-port-negative.json
        ├── invalid-port-out-of-range.json
        ├── malformed.json
        ├── missing-required.json
        ├── partial-invalid.json
        ├── unknown-field.json
        └── wrong-types.json
```

## Notes

- No `.env.example` is included. Configuration is loaded from an explicit JSON
  file path (or the checked-in sample), and the project does not read secrets or
  environment variables.
- The project uses Node's built-in test runner through `tsx`; no test framework
  is required.
