export type PaymentIntentInput = {
  amountCents: number;
  currency: string;
  customerId: string;
};

export type PaymentIntentResult = {
  id: string;
  status: "requires_confirmation" | "succeeded" | "failed";
  clientSecret?: string;
};

export type PaymentProvider = {
  createPaymentIntent: (input: PaymentIntentInput) => Promise<PaymentIntentResult>;
  confirmPayment: (intentId: string) => Promise<PaymentIntentResult>;
  refund: (intentId: string) => Promise<{ ok: boolean }>;
  handleWebhook: (payload: unknown) => Promise<{ ok: boolean }>;
};

export class StubProvider implements PaymentProvider {
  async createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    return {
      id: `stub_${input.customerId}_${Date.now()}`,
      status: "requires_confirmation",
      clientSecret: `stub_secret_${Math.random().toString(36).slice(2)}`
    };
  }

  async confirmPayment(intentId: string): Promise<PaymentIntentResult> {
    return {
      id: intentId,
      status: "succeeded"
    };
  }

  async refund(_intentId: string): Promise<{ ok: boolean }> {
    return { ok: true };
  }

  async handleWebhook(_payload: unknown): Promise<{ ok: boolean }> {
    return { ok: true };
  }
}
