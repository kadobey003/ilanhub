/** Normalize to E.164 Ukraine format (+380XXXXXXXXX) */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("380")) {
    normalized = normalized;
  } else if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = `38${normalized}`;
  } else if (normalized.length === 9) {
    normalized = `380${normalized}`;
  }

  if (!/^380\d{9}$/.test(normalized)) return null;
  return `+${normalized}`;
}

export type ParsedPhone = {
  phone: string;
  isUkraine: boolean;
};

/** Ukraine first, then international E.164 for auth flows. */
export function parsePhoneInput(input: string): ParsedPhone | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ua = normalizePhone(trimmed);
  if (ua) return { phone: ua, isUkraine: true };

  const foreign = normalizeForeignPhone(trimmed);
  if (foreign) return { phone: foreign, isUkraine: false };

  return null;
}

export function normalizeAuthPhone(input: string): string | null {
  return parsePhoneInput(input)?.phone ?? null;
}

function normalizeForeignPhone(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;

  if (!hasPlus && digits.length === 9) return null;
  if (!hasPlus && digits.length === 10 && digits.startsWith("0")) return null;
  if (digits.startsWith("380")) return null;

  if (hasPlus || digits.length >= 10) return `+${digits}`;
  return null;
}

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * max);
  return String(num).padStart(length, "0");
}
