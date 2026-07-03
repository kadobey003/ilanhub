import { createHmac } from "node:crypto";
import { PaymentMethod, PaymentStatus } from "@ilanhub/shared";
import type {
  CreatePaymentInput,
  PaymentInvoice,
  PaymentProvider,
  WebhookPayload,
} from "./types.js";

export interface PortmoneConfig {
  payeeId: string;
  login: string;
  password?: string;
  signatureKey: string;
  gatewayUrl?: string;
}

function formatDt(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

function toHexUpper(value: string): string {
  return Buffer.from(value, "utf8").toString("hex").toUpperCase();
}

export function buildPortmoneSignature(opts: {
  payeeId: string;
  login: string;
  shopOrderNumber: string;
  billAmount: string;
  key: string;
  dt: string;
}): string {
  const base = `${opts.payeeId}${opts.dt}${toHexUpper(opts.shopOrderNumber)}${opts.billAmount}`.toUpperCase();
  const str = `${base}${toHexUpper(opts.login)}`;
  return createHmac("sha256", opts.key).update(str).digest("hex").toUpperCase();
}

function formatBillAmount(amount: number): string {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(2);
}

export class PortmoneProvider implements PaymentProvider {
  readonly method = PaymentMethod.PORTMONE;

  constructor(private readonly config: PortmoneConfig) {}

  async createPayment(input: CreatePaymentInput): Promise<PaymentInvoice> {
    const dt = formatDt();
    const billAmount = formatBillAmount(input.amount);
    const signature = buildPortmoneSignature({
      payeeId: this.config.payeeId,
      login: this.config.login,
      shopOrderNumber: input.reference,
      billAmount,
      key: this.config.signatureKey,
      dt,
    });

    const body = {
      method: "createLinkPayment",
      paymentTypes: {
        card: "Y",
        portmone: "Y",
        gpay: "Y",
        applepay: "Y",
      },
      priorityPaymentTypes: {
        card: "1",
        portmone: "2",
        gpay: "3",
        applepay: "4",
      },
      payee: {
        payeeId: this.config.payeeId,
        login: this.config.login,
        dt,
        signature,
      },
      order: {
        description: input.description,
        shopOrderNumber: input.reference,
        billAmount,
        successUrl: input.callbackUrl,
        failureUrl: input.redirectUrl,
        billCurrency: input.currency || "UAH",
        preauthFlag: "N",
      },
      payer: { lang: "uk" },
      token: { tokenFlag: "N", returnToken: "N" },
    };

    const gatewayUrl =
      this.config.gatewayUrl ?? "https://www.portmone.com.ua/gateway/";
    const res = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      linkPayment?: string;
      error?: string;
      errorCode?: string;
    };

    if (!res.ok) {
      throw new Error(data.error ?? `Portmone HTTP ${res.status}`);
    }
    if (data.errorCode && data.errorCode !== "0") {
      throw new Error(data.error ?? "Portmone link creation failed");
    }
    if (!data.linkPayment) {
      throw new Error("Portmone did not return payment link");
    }

    return {
      externalId: input.reference,
      paymentUrl: data.linkPayment,
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      method: this.method,
    };
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookPayload> {
    const payload = body as Record<string, unknown>;
    const reference = String(
      payload.shop_order_number ??
        payload.shopOrderNumber ??
        payload.SHOPORDERNUMBER ??
        "",
    );
    if (!reference) {
      throw new Error("Portmone callback missing order reference");
    }

    const status = String(
      payload.status ?? payload.STATUS ?? payload.result ?? "",
    ).toUpperCase();
    const externalId = String(
      payload.shop_bill_id ?? payload.shopBillId ?? payload.SHOPBILLID ?? "",
    );
    const amount = Number(
      payload.bill_amount ?? payload.billAmount ?? payload.BILL_AMOUNT ?? 0,
    );

    const statusMap: Record<string, PaymentStatus> = {
      PAYED: PaymentStatus.COMPLETED,
      SUCCESS: PaymentStatus.COMPLETED,
      REJECTED: PaymentStatus.FAILED,
      CREATED: PaymentStatus.PENDING,
    };

    return {
      externalId,
      reference,
      status: statusMap[status] ?? PaymentStatus.PENDING,
      amount,
      currency: String(payload.bill_currency ?? payload.billCurrency ?? "UAH"),
      raw: payload,
    };
  }
}

export async function createPayment(
  config: PortmoneConfig,
  input: CreatePaymentInput,
): Promise<PaymentInvoice> {
  const provider = new PortmoneProvider(config);
  return provider.createPayment(input);
}
