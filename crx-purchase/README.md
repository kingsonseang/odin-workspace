# FauxPay Webhook Idempotency Starter

A small, self-contained TypeScript exercise about duplicate payment side effects
caused by webhook redelivery.

## Scenario

FauxPay is a fictional payment provider. It sends JSON events to a merchant
webhook endpoint. It uses at-least-once delivery: when a success response is not
received in time, it retries the same event.

This repository contains a webhook handler and a small in-memory payment ledger.
A successful `payment.succeeded` event records one ledger operation. A
`payment.failed` event is ignored because the exercise only models the
successful-payment side effect.

No real payment provider, credentials, database, or network access is involved.
All event IDs and payment data are synthetic.

## The starter defect

`WebhookHandler` validates each delivery and then records every
`payment.succeeded` event in the ledger. It does not track provider event IDs.
Delivering the same event twice therefore records the payment operation twice.

The handler is intentionally imperfect. The failing regression test in
`test/webhook-handler.test.ts` is the starting point for the investigation. Do
not edit the test to match the broken behavior.

## Expected behavior

After the fix:

- Each unique `payment.succeeded` event ID produces at most one ledger operation.
- Redelivering an already processed event is acknowledged without repeating the
  business effect. The intended result is
  `{ status: "duplicate", eventId, operationId }`, using the original operation
  ID.
- Different synthetic event IDs are processed independently. The fixture
  contains several successful events to prevent a blanket "reject everything
  after the first delivery" solution.
- Malformed JSON and structurally invalid events are rejected without ledger
  writes.
- `payment.failed` events are ignored without ledger writes.
- A retry after a transient failure can succeed without creating a duplicate or
  phantom operation.
- TypeScript type-checking passes.

## Setup

Prerequisites:

- Bun 1.4 or newer. Bun is the runtime, package manager, and test runner for
  this exercise.

There are no runtime dependencies and no external services to start.

```bash
bun install
```

No additional test configuration is required. Bun discovers
`test/*.test.ts` automatically.

## Commands

```bash
# Type-check in strict mode
bun run typecheck

# Run the full deterministic test suite
bun test

# Run only the webhook handler tests
bun test test/webhook-handler.test.ts

# Type-check and test together
bun run check
```

`bun test` and `bun run check` are expected to exit non-zero on the starter
because of the known failing regression test below. They should pass after the
defect is fixed.

### Known expected failing test

- `KNOWN DEFECT: duplicate delivery must not repeat the payment operation`
  in `test/webhook-handler.test.ts`

The starter records a second ledger operation for a redelivered event. This
failure is intentional and is not an environment or setup problem. Do not skip,
delete, or weaken the test; fix the implementation.

## Project layout

```text
.
├── .gitignore
├── README.md
├── bun.lock
├── package.json
├── tsconfig.json
├── fixtures/
│   └── events.json
├── docs/
│   └── engineering-notes-template.md
├── src/
│   ├── types.ts
│   ├── payment-ledger.ts
│   └── webhook-handler.ts
└── test/
    └── webhook-handler.test.ts
```

## What this local harness can verify

- Sequential duplicate delivery to one handler instance in one process.
- Multiple distinct event IDs being processed independently.
- Rejection of malformed input without a ledger write.
- Ignoring non-actionable events.
- A retry after a simulated failure that occurs before the ledger write.

## What this local harness cannot verify

The ledger and any handler-local cache are in memory. They are not a durable or
shared idempotency store.

An in-memory `Set` or `Map`:

- does not survive process restarts;
- is not shared across multiple processes, workers, or replicas;
- does not make the deduplication decision and ledger write atomic;
- does not provide exactly-once delivery.

This exercise therefore cannot prove durable idempotency, cross-process
concurrency safety, or recovery from an ambiguous commit. A production solution
would need a persistent idempotency record with a unique key on the provider and
event ID, ideally committed in the same transaction as the business effect. It
would also need a defined behavior for conflicting payloads, retention and
cleanup, and provider signature verification.

Webhook delivery is at-least-once. The realistic goal is an effectively-once
business effect, not exactly-once network delivery.

## Acceptance criteria

- The known-defect test passes, and no test is skipped or weakened.
- `bun run typecheck` passes.
- `bun test` passes once the implementation is fixed.
- A redelivered event produces exactly one ledger operation and a `duplicate`
  result containing the original operation ID.
- Distinct event IDs still each produce one ledger operation.
- Malformed input and `payment.failed` events produce no ledger operation.
- The retry test still passes.
- `docs/engineering-notes-template.md` is completed with the observed defect,
  chosen strategy, verified guarantees, assumptions, and limitations.
- Any durability claim is backed by a persistent design, not an in-memory cache.

## Notes for the investigator

The starter is deliberately small: there is no web framework, database, payment
SDK, signature verification, or network code. Keep the fix similarly focused.
Use the fixture data, inspect the ledger through its public read-only accessors,
and document the boundary between what the tests prove and what would be needed
in production.
