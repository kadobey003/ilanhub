import {
  BANK_TRANSFER_TIMEOUT_HOURS,
  PaymentMethod,
  generatePaymentReference,
} from "@ilanhub/shared";
import type { BankTransferReference, BankTransferTimeoutResult } from "./types.js";

export interface BankTransferInput {
  listingId: string;
  amount: number;
  currency?: string;
}

export function createReference(input: BankTransferInput): BankTransferReference {
  const reference = generatePaymentReference(input.listingId);
  const createdAt = new Date();
  const expiresAt = new Date(
    createdAt.getTime() + BANK_TRANSFER_TIMEOUT_HOURS * 60 * 60 * 1000,
  );

  return {
    reference,
    amount: input.amount,
    currency: input.currency ?? "UAH",
    createdAt,
    expiresAt,
  };
}

export function checkTimeout(
  reference: BankTransferReference,
  now: Date = new Date(),
): BankTransferTimeoutResult {
  return {
    reference: reference.reference,
    expired: now > reference.expiresAt,
    expiresAt: reference.expiresAt,
  };
}

export const bankTransferMethod = PaymentMethod.BANK_TRANSFER;

export const BANK_TRANSFER_TIMEOUT_MS =
  BANK_TRANSFER_TIMEOUT_HOURS * 60 * 60 * 1000;
