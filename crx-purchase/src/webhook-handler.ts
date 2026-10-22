import { PaymentLedger } from "./payment-ledger";
import {
  CURRENCIES,
  PROVIDER,
  type Currency,
  type ProcessWebhookResult,
  type RejectionReason,
  type WebhookEvent,
} from "./types";

const CURRENCY_SET = new Set<string>(CURRENCIES);

interface CommonEventFields {
  readonly id: string;
  readonly provider: typeof PROVIDER;
  readonly createdAt: string;
  readonly paymentId: string;
  readonly amountCents: number;
  readonly currency: Currency;
  readonly data: Record<string, unknown>;
}

type ParseResult =
  | { readonly ok: true; readonly event: WebhookEvent }
  | { readonly ok: false; readonly reason: RejectionReason };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && CURRENCY_SET.has(value);
}

function readCommonFields(
  value: Record<string, unknown>,
): CommonEventFields | null {
  const { id, provider, createdAt, data } = value;

  if (
    !isNonEmptyString(id) ||
    !id.startsWith("evt_fauxpay_") ||
    provider !== PROVIDER ||
    !isNonEmptyString(createdAt) ||
    Number.isNaN(Date.parse(createdAt)) ||
    !isRecord(data)
  ) {
    return null;
  }

  const { paymentId, amountCents, currency } = data;

  if (
    !isNonEmptyString(paymentId) ||
    !paymentId.startsWith("pay_fauxpay_") ||
    typeof amountCents !== "number" ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !isCurrency(currency)
  ) {
    return null;
  }

  return {
    id,
    provider: PROVIDER,
    createdAt,
    paymentId,
    amountCents,
    currency,
    data,
  };
}

function parseWebhookEvent(rawBody: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: "invalid_event" };
  }

  const common = readCommonFields(parsed);
  if (!common) {
    return { ok: false, reason: "invalid_event" };
  }

  if (parsed.type === "payment.succeeded") {
    return {
      ok: true,
      event: {
        id: common.id,
        provider: common.provider,
        type: "payment.succeeded",
        createdAt: common.createdAt,
        data: {
          paymentId: common.paymentId,
          amountCents: common.amountCents,
          currency: common.currency,
        },
      },
    };
  }

  if (parsed.type === "payment.failed") {
    const failureCode = common.data.failureCode;

    if (!isNonEmptyString(failureCode)) {
      return { ok: false, reason: "invalid_event" };
    }

    return {
      ok: true,
      event: {
        id: common.id,
        provider: common.provider,
        type: "payment.failed",
        createdAt: common.createdAt,
        data: {
          paymentId: common.paymentId,
          amountCents: common.amountCents,
          currency: common.currency,
          failureCode,
        },
      },
    };
  }

  return { ok: false, reason: "invalid_event" };
}

export class WebhookHandler {
  constructor(private readonly ledger: PaymentLedger) {}

  handle(rawBody: string): ProcessWebhookResult {
    const parsed = parseWebhookEvent(rawBody);

    if (!parsed.ok) {
      return { status: "rejected", reason: parsed.reason };
    }

    const { event } = parsed;

    if (event.type === "payment.failed") {
      return {
        status: "ignored",
        eventId: event.id,
        reason: "non_actionable_event",
      };
    }

    // Starter defect: every valid delivery reaches the ledger. Redeliveries
    // are not tracked by provider event ID, so the side effect can repeat.
    const operation = this.ledger.recordPayment(event);

    return {
      status: "processed",
      eventId: event.id,
      operationId: operation.operationId,
    };
  }
}
