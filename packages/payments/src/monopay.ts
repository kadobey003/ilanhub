import { PaymentMethod, PaymentStatus } from "@ilanhub/shared";
import type {
  CreatePaymentInput,
  PaymentInvoice,
  PaymentProvider,
  WebhookPayload,
} from "./types.js";

export interface MonopayConfig {
  token: string;
  apiUrl?: string;
}

export class MonopayProvider implements PaymentProvider {
  readonly method = PaymentMethod.MONOPAY;

  constructor(private readonly config: MonopayConfig) {}

  async createPayment(input: CreatePaymentInput): Promise<PaymentInvoice> {
    const apiUrl = this.config.apiUrl ?? "https://api.monobank.ua/api/merchant";
    const amountKopiyky = input.amount * 100;

    const response = await fetch(`${apiUrl}/invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": this.config.token,
      },
      body: JSON.stringify({
        amount: amountKopiyky,
        ccy: 980,
        merchantPaymInfo: {
          reference: input.reference,
          destination: input.description,
        },
        redirectUrl: input.redirectUrl,
        webHookUrl: input.callbackUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Monopay invoice creation failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      invoiceId: string;
      pageUrl: string;
    };

    return {
      externalId: data.invoiceId,
      paymentUrl: data.pageUrl,
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      method: this.method,
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookPayload> {
    const signature = headers["x-sign"] ?? headers["X-Sign"];
    if (!signature) {
      throw new Error("Monopay webhook missing signature");
    }

    const payload = body as {
      invoiceId: string;
      reference: string;
      status: string;
      amount: number;
      ccy: number;
    };

    const statusMap: Record<string, PaymentStatus> = {
      success: PaymentStatus.COMPLETED,
      failure: PaymentStatus.FAILED,
      processing: PaymentStatus.PENDING,
      created: PaymentStatus.PENDING,
    };

    return {
      externalId: payload.invoiceId,
      reference: payload.reference,
      status: statusMap[payload.status] ?? PaymentStatus.PENDING,
      amount: Math.round(payload.amount / 100),
      currency: "UAH",
      raw: payload as unknown as Record<string, unknown>,
    };
  }
}

export async function createInvoice(
  config: MonopayConfig,
  input: CreatePaymentInput,
): Promise<PaymentInvoice> {
  const provider = new MonopayProvider(config);
  return provider.createPayment(input);
}

export async function verifyWebhook(
  config: MonopayConfig,
  headers: Record<string, string>,
  body: unknown,
): Promise<WebhookPayload> {
  const provider = new MonopayProvider(config);
  return provider.verifyWebhook(headers, body);
}
