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

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * max);
  return String(num).padStart(length, "0");
}
