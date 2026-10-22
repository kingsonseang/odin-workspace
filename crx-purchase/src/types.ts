export const PROVIDER = "fauxpay" as const;
export type Provider = typeof PROVIDER;

export const CURRENCIES = ["USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface PaymentSucceededEvent {
  readonly id: string;
  readonly provider: Provider;
  readonly type: "payment.succeeded";
  readonly createdAt: string;
  readonly data: {
    readonly paymentId: string;
    readonly amountCents: number;
    readonly currency: Currency;
  };
}

export interface PaymentFailedEvent {
  readonly id: string;
  readonly provider: Provider;
  readonly type: "payment.failed";
  readonly createdAt: string;
  readonly data: {
    readonly paymentId: string;
    readonly amountCents: number;
    readonly currency: Currency;
    readonly failureCode: string;
  };
}

export type WebhookEvent = PaymentSucceededEvent | PaymentFailedEvent;

export type RejectionReason = "invalid_json" | "invalid_event";

export type ProcessWebhookResult =
  | {
      readonly status: "processed";
      readonly eventId: string;
      readonly operationId: string;
    }
  | {
      readonly status: "duplicate";
      readonly eventId: string;
      readonly operationId: string;
    }
  | {
      readonly status: "ignored";
      readonly eventId: string;
      readonly reason: "non_actionable_event";
    }
  | {
      readonly status: "rejected";
      readonly reason: RejectionReason;
    };
