# Engineering Notes

## Observed Defect

Describe how the defect was reproduced, the expected result, the actual result,
and which code path caused it. Include the relevant test name and ledger state.

## Chosen Strategy

Explain the idempotency key, where the processed-event record is stored, how a
concurrent claim is handled, and how the idempotency decision relates to the
ledger write. State what happens for duplicate events, failed attempts, and
malformed input.

## Verified Guarantees

List only behavior demonstrated by this repository's tests. Keep the scope
explicit (for example, sequential deliveries within one process). Do not claim
exactly-once delivery or durability that the harness does not prove.

## Assumptions

Record assumptions such as stable provider event IDs, at-least-once delivery,
identical payloads for redeliveries, and any preconditions required by the
chosen strategy.

## Limitations

Describe what remains unproven or unsupported, including process restarts,
multiple processes or replicas, concurrent requests, ambiguous commits, retention
and cleanup of idempotency records, and signature verification. Explain what a
production implementation would require, such as a persistent unique constraint
or a transaction spanning the idempotency record and the business effect.
