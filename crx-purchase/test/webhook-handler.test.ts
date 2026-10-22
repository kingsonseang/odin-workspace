import { describe, expect, test } from "bun:test";
import eventsFixture from "../fixtures/events.json";
import { PaymentLedger, type PaymentOperation } from "../src/payment-ledger";
import { WebhookHandler } from "../src/webhook-handler";
import type {
  PaymentFailedEvent,
  PaymentSucceededEvent,
  WebhookEvent,
} from "../src/types";

const events = eventsFixture as unknown as readonly WebhookEvent[];

const successfulEvents = events.filter(
  (event): event is PaymentSucceededEvent => event.type === "payment.succeeded",
);

function firstSuccessfulEvent(): PaymentSucceededEvent {
  const event = successfulEvents[0];

  if (!event) {
    throw new Error("Fixture must contain at least one successful event.");
  }

  return event;
}

function firstFailedEvent(): PaymentFailedEvent {
  const event = events.find(
    (candidate): candidate is PaymentFailedEvent =>
      candidate.type === "payment.failed",
  );

  if (!event) {
    throw new Error("Fixture must contain at least one failed event.");
  }

  return event;
}

function setup(): { ledger: PaymentLedger; handler: WebhookHandler } {
  const ledger = new PaymentLedger();
  return { ledger, handler: new WebhookHandler(ledger) };
}

function body(event: unknown): string {
  return JSON.stringify(event);
}

class FailOnceBeforeWriteLedger extends PaymentLedger {
  #remainingFailures = 1;

  override recordPayment(event: PaymentSucceededEvent): PaymentOperation {
    if (this.#remainingFailures > 0) {
      this.#remainingFailures -= 1;
      throw new Error("simulated ledger outage");
    }

    return super.recordPayment(event);
  }
}

describe("baseline webhook processing", () => {
  test("processes several distinct event IDs exactly once each", () => {
    const { ledger, handler } = setup();

    for (const event of successfulEvents) {
      const result = handler.handle(body(event));
      expect(result.status).toBe("processed");
    }

    expect(ledger.operations.map((operation) => operation.eventId)).toEqual(
      successfulEvents.map((event) => event.id),
    );
  });

  test("ignores payment.failed without recording a ledger operation", () => {
    const { ledger, handler } = setup();
    const event = firstFailedEvent();

    const result = handler.handle(body(event));

    expect(result).toEqual({
      status: "ignored",
      eventId: event.id,
      reason: "non_actionable_event",
    });
    expect(ledger.operations).toHaveLength(0);
  });

  test("rejects malformed JSON without writing to the ledger", () => {
    const { ledger, handler } = setup();

    const result = handler.handle('{"id":');

    expect(result).toEqual({ status: "rejected", reason: "invalid_json" });
    expect(ledger.operations).toHaveLength(0);
  });

  test("rejects a structurally invalid event without writing to the ledger", () => {
    const { ledger, handler } = setup();
    const event = firstSuccessfulEvent();
    const malformedEvent = {
      ...event,
      data: { ...event.data, amountCents: "2500" },
    };

    const result = handler.handle(body(malformedEvent));

    expect(result).toEqual({ status: "rejected", reason: "invalid_event" });
    expect(ledger.operations).toHaveLength(0);
  });

  test("supports a retry after a transient ledger failure", () => {
    const event = firstSuccessfulEvent();
    const ledger = new FailOnceBeforeWriteLedger();
    const handler = new WebhookHandler(ledger);

    try {
      handler.handle(body(event));
    } catch {
      // The first attempt is expected to fail before the ledger write.
    }

    expect(ledger.operationsForEvent(event.id)).toHaveLength(0);

    const retry = handler.handle(body(event));

    expect(retry.status).toBe("processed");
    expect(ledger.operationsForEvent(event.id)).toHaveLength(1);
  });
});

describe("known defect", () => {
  test("KNOWN DEFECT: duplicate delivery must not repeat the payment operation", () => {
    const { ledger, handler } = setup();
    const event = firstSuccessfulEvent();

    const first = handler.handle(body(event));
    const duplicate = handler.handle(body(event));

    if (first.status !== "processed") {
      throw new Error(
        `Expected the first delivery to be processed, received ${first.status}.`,
      );
    }

    expect(ledger.operations).toHaveLength(1);
    expect(duplicate).toEqual({
      status: "duplicate",
      eventId: event.id,
      operationId: first.operationId,
    });
  });
});

// MISSING REGRESSION COVERAGE (intentionally absent from the starter):
//
// 1. Concurrent deliveries, whether in one process or across processes.
//    Proving this requires serialization or an atomic shared store.
// 2. Deduplication across restarts.
//    Both the ledger and any in-memory handler state disappear on restart.
// 3. Ambiguous commits, where the ledger write succeeds but the response is lost.
//    Proving this requires an idempotent ledger write or a transaction spanning
//    the idempotency record and the business side effect.
// 4. The same event ID with a different payload.
//    The fixture only covers byte-for-byte redelivery.
