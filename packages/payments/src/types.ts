import type { PaymentMethod, PaymentStatus } from "@ilanhub/shared";

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  userId: string;
  listingId?: string;
  callbackUrl: string;
  redirectUrl: string;
}

export interface PaymentInvoice {
  externalId: string;
  paymentUrl: string;
  reference: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  expiresAt?: Date;
}

export interface WebhookPayload {
  externalId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  createPayment(input: CreatePaymentInput): Promise<PaymentInvoice>;
  verifyWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<WebhookPayload>;
}

export interface BankTransferReference {
  reference: string;
  amount: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface BankTransferTimeoutResult {
  reference: string;
  expired: boolean;
  expiresAt: Date;
}
