# Production readiness checklist

This checklist accompanies the records API starter. It defines a bounded set of
acceptance criteria for the exercise and provides a place to record evidence for
each operational requirement.

The starter is expected to fail several checks initially. Do not mark an item as
verified because the code "looks reasonable"; record the command, observation,
test name, or source reference that supports the result.

## Scope

The implementation scope for the focused exercise is AC-1 through AC-4.
AC-5 covers evidence-only review of logging and deployment assumptions. It does
not require a real deployment, cloud credentials, a database, or an external
service, and it should not trigger broad rewrites of the application.

Out of scope unless explicitly selected as a small supporting fix:

- persistence, authentication, authorization, or rate limiting;
- new record write endpoints or domain features;
- container orchestration, infrastructure as code, or load testing;
- monitoring or logging vendor integrations.

## Bounded acceptance criteria

### AC-1: Configuration is validated and consistent

- Documented local defaults still apply when optional environment variables are
  unset.
- Invalid or contradictory configuration stops startup before the server begins
  listening, exits non-zero, and produces an actionable message that names the
  bad setting without printing secrets or the entire environment.
- The accepted configuration enforces these rules:
  - `NODE_ENV` is one of `development`, `test`, or `production`;
  - `HOST` is a non-empty bind address;
  - `PORT` is an integer from 1 through 65535;
  - `DEFAULT_PAGE_SIZE` and `MAX_PAGE_SIZE` are positive integers;
  - `DEFAULT_PAGE_SIZE` is less than or equal to `MAX_PAGE_SIZE`.
- The records endpoint honors `MAX_PAGE_SIZE`; configuration that is merely
  parsed but ignored does not satisfy this criterion.
- Automated tests cover valid configuration, invalid values, and the
  cross-field page-size constraint.

### AC-2: Request validation and API errors are deterministic

- `GET /records` retains its existing successful response behavior.
- When `limit` is supplied it must be an integer from 1 through
  `MAX_PAGE_SIZE`, inclusive. When omitted, the configured default is used.
- When `offset` is supplied it must be an integer greater than or equal to zero.
- Invalid `limit` or `offset` values return HTTP `400`, do not return record
  data, and do not become HTTP `500` errors.
- An unknown record ID returns HTTP `404`.
- An unknown route returns an HTTP `404` JSON response rather than a framework
  text response.
- All API error responses share one documented JSON envelope containing a stable
  machine-readable code and a human-readable message, with
  `Content-Type: application/json`.
- Internal exception details and stack traces are not exposed to clients.
- Automated tests assert the documented error envelope and status for invalid
  input and missing resources.

### AC-3: Liveness and readiness are distinct

- Liveness is exposed at `GET /healthz`. It returns HTTP `200` while the process
  can serve HTTP, and its result does not depend on the availability of records.
- Readiness is exposed at `GET /readyz`. It returns HTTP `200` only when the
  instance can serve records, and HTTP `503` with a JSON body identifying the
  failed check when it cannot.
- Aliases are allowed if their behavior is documented, but one endpoint must
  not silently combine a meaningful readiness failure with an unconditional
  HTTP `200`.
- The not-ready condition must be reproducible in an automated test without
  editing production code for the test, contacting an external service, or
  requiring a real deployment.
- The semantics, endpoints, and relevant success/failure status codes are
  documented in the README.
- The previous `/health` behavior may be replaced or retained as a documented
  alias; tests and documentation must reflect the final contract.

### AC-4: Failure conditions are covered by tests

- `npm test` runs the complete suite deterministically and offline. Tests must
  not require an already-running server, external services, credentials, or
  the public network.
- Tests cover successful list pagination and record lookup.
- Tests cover invalid, non-integer, zero, negative, and over-limit query values,
  the configured default page size, and both kinds of `404`.
- Tests assert the consistent error envelope and content type for client errors.
- Tests cover configuration failures and the cross-field page-size rule.
- Tests cover both liveness and readiness, including a readiness failure and the
  fact that liveness remains available during that failure.
- A regression test is added for every behavior changed during the exercise.

### AC-5: Logging and deployment evidence

- Review the existing logging behavior for secrets, request bodies, headers,
  query strings, and personal data. Record evidence rather than assuming.
- Record whether local startup, shutdown, bind address, port selection, and the
  in-memory single-instance limitation are documented and reproducible.
- A real deployment is not required. Any item that cannot be demonstrated
  locally must be marked **Not verified**, with the reason recorded.

## How to use this checklist

- Put the command, test name, observed status/body, or file reference under
  **Evidence**. A short summary is sufficient.
- Tick exactly one status for each item: **Verified**, **Not verified**, or
  **N/A**. Do not tick **N/A** only because an item is difficult.
- If a check fails, leave it unverified and record the failure as evidence. Add
  new work to the exercise scope only if it supports AC-1 through AC-4.
- Re-run the relevant checks after changing behavior; do not reuse evidence from
  an earlier revision.

## Checklist

### Configuration

#### CFG-1 — Defaults are explicit and usable

**Check:** With optional environment variables unset, the service starts with
the values documented in the README and `.env.example`, and the records endpoint
uses `DEFAULT_PAGE_SIZE`.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### CFG-2 — Invalid configuration fails fast

**Check:** Invalid `NODE_ENV`, empty `HOST`, non-integer or out-of-range `PORT`,
non-positive page sizes, and `DEFAULT_PAGE_SIZE > MAX_PAGE_SIZE` each prevent
startup with a non-zero exit and an actionable, non-secret-bearing message.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### CFG-3 — Configured limits are enforced

**Check:** `MAX_PAGE_SIZE` is enforced by `GET /records`, and a request cannot
exceed the configured limit or cause an unvalidated configuration value to
change response behavior.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Request validation

#### VAL-1 — Query parameters have complete rules

**Check:** `limit` and `offset` follow the rules in AC-2 for missing, malformed,
non-integer, zero, negative, and over-limit input. Unknown routes and record IDs
are handled as specified.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### VAL-2 — Invalid input has no partial effect

**Check:** Invalid requests return the documented `400` response without record
data, and invalid input never results in a `500` response. Valid requests retain
pagination metadata and preserve record order.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Error handling

#### ERR-1 — One documented client-error contract

**Check:** Validation failures, unknown records, and unknown routes all use the
same documented JSON envelope, stable codes, status semantics, and
`application/json` content type.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### ERR-2 — Internal errors are contained

**Check:** Unexpected failures return a generic JSON `500` response without
stack traces, internal messages, or partial data, while useful diagnostic
context is retained server-side.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Automated tests

#### TST-1 — The suite is deterministic and offline

**Check:** `npm test` requires no running server, external service, network
access, credentials, or mutable shared state, and repeated runs produce the same
result.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### TST-2 — Successful behavior is protected

**Check:** Tests cover health success, record listing, pagination, the configured
default page size, and lookup of a known record.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### TST-3 — Invalid input is covered

**Check:** Tests cover each query boundary, unknown record IDs, unknown routes,
the shared error envelope, and response content type.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### TST-4 — Failure and configuration paths are covered

**Check:** Tests cover invalid configuration, the cross-field page-size rule,
readiness failure, and liveness remaining healthy during readiness failure.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Health checks

#### HLTH-1 — Liveness reflects process health only

**Check:** Liveness is available at the documented endpoint, returns HTTP `200`
while the process is serving requests, and is not coupled to the records data.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### HLTH-2 — Readiness reflects serving capability

**Check:** Readiness has a documented not-ready state that returns HTTP `503`
with a JSON reason, and returns HTTP `200` when the records subsystem is
available. The failure state is exercised locally.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Safe logging

#### LOG-1 — Request logging excludes sensitive material

**Check:** Logs do not contain request bodies, authorization or cookie headers,
environment secrets, or unreviewed personal data. Inspect a representative
request and startup/shutdown log.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### LOG-2 — Errors are diagnosable without leaking details

**Check:** Server-side error logs retain enough context to investigate a
failure, while client responses do not disclose stacks or internal exception
messages.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

### Deployment assumptions

#### DEP-1 — Local lifecycle is documented and reproducible

**Check:** A clean checkout can be installed, tested, built, and started using
the exact commands in the README. The configured host and port are documented.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### DEP-2 — Shutdown behavior is understood

**Check:** SIGTERM and SIGINT stop the local process without an unhandled error,
and the documented behavior is appropriate for the intended local exercise.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A

#### DEP-3 — Runtime assumptions are explicit

**Check:** The README states that records are in memory, all instances start with
the same seed data, data resets on restart, and no external runtime dependency or
production secret is required. Production deployment remains explicitly out of
scope.

- Evidence:
- Status: [ ] Verified  [ ] Not verified  [ ] N/A
