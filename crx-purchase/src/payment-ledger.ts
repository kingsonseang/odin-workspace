import type { Currency, PaymentSucceededEvent } from "./types";

export interface PaymentOperation {
  readonly operationId: string;
  readonly eventId: string;
  readonly paymentId: string;
  readonly amountCents: number;
  readonly currency: Currency;
}

/**
 * Small in-memory stand-in for the business ledger.
 *
 * This is deliberately process-local. It is not a durable store and provides
 * no atomicity or uniqueness guarantees outside this process.
 */
export class PaymentLedger {
  readonly #operations: PaymentOperation[] = [];
  #nextSequence = 1;

  recordPayment(event: PaymentSucceededEvent): PaymentOperation {
    const operation: PaymentOperation = {
      operationId: `op_fauxpay_${String(this.#nextSequence).padStart(4, "0")}`,
      eventId: event.id,
      paymentId: event.data.paymentId,
      amountCents: event.data.amountCents,
      currency: event.data.currency,
    };

    this.#nextSequence += 1;
    this.#operations.push(operation);
    return operation;
  }

  get operations(): readonly PaymentOperation[] {
    return [...this.#operations];
  }

  operationsForEvent(eventId: string): readonly PaymentOperation[] {
    return this.#operations.filter((operation) => operation.eventId === eventId);
  }
}
