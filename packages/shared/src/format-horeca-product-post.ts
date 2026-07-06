export interface HorecaProductDisplay {
  title: string;
  price?: string;
  condition?: string;
  description?: string;
}

export interface HorecaProductPostInput {
  businessType?: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  contactPhone?: string | null;
  products: HorecaProductDisplay[];
  siteUrl?: string | null;
}

export interface HorecaProductSection {
  title: string;
  lines: string[];
}

export interface HorecaProductPostSections {
  header: string;
  venue: string;
  address: string;
  intro: string;
  products: HorecaProductSection[];
  contact: { label: string; phone: string } | null;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Map DB position row to product display fields */
export function parseStoredProduct(row: {
  title: string;
  salary?: string | null;
  workingHours?: string | null;
  description?: string | null;
}): HorecaProductDisplay {
  let price = row.salary?.trim() ?? undefined;
  if (price) {
    price = price.replace(/^💰\s*/, "").replace(/^З\/п\s*💵\s*/i, "").trim();
  }

  let condition = row.workingHours?.trim() ?? undefined;
  if (condition) {
    condition = condition.replace(/^📦\s*Стан:\s*/i, "").trim();
  }

  return {
    title: row.title,
    price: price || undefined,
    condition: condition || undefined,
    description: row.description?.trim() || undefined,
  };
}

function venueLine(input: HorecaProductPostInput, html: boolean): string {
  const type = (input.businessType ?? "").trim().toLowerCase();
  let name = input.title.trim();
  name = name.replace(/^(ресторан|бар|кафе|готель|кальянна|паб)\s+/i, "");
  name = name.replace(/^«(.+)»$/, "$1").trim() || input.title.trim();

  const locative: Record<string, string> = {
    ресторан: "ресторані",
    бар: "барі",
    кафе: "кафе",
    готель: "готелі",
    кальянна: "кальянній",
    паб: "пабі",
  };

  const place = locative[type];
  const line = place ? `В ${place} «${name}»` : `В закладі «${name}»`;
  return html ? `<b>${esc(line)}</b>` : line;
}

function addressLine(input: HorecaProductPostInput, html: boolean): string {
  const parts = [
    input.address?.trim(),
    input.district?.trim(),
    input.city?.trim(),
  ].filter(Boolean);
  if (!parts.length) return "";
  const addr = parts.join(", ");
  return html ? esc(addr) : addr;
}

function fmtPhone(phone: string | null | undefined, html: boolean): string {
  if (!phone?.trim()) return "";
  const p = phone.trim();
  const line1 = "Звертатися за тел.:";
  const line2 = p.startsWith("📲") ? p : `📲 ${p}`;
  return html ? `${esc(line1)}\n${esc(line2)}` : `${line1}\n${line2}`;
}

function productLines(p: HorecaProductDisplay): string[] {
  const lines: string[] = [];
  if (p.price) {
    const raw = p.price.trim();
    const priceLine = /^💰|^₴/i.test(raw) ? raw : `💰 ${raw} ₴`;
    lines.push(priceLine.replace(/₴\s*₴/, "₴"));
  }
  if (p.condition) {
    const c = p.condition.trim();
    lines.push(/^📦/.test(c) ? c : `📦 Стан: ${c}`);
  }
  if (p.description?.trim()) {
    lines.push(...p.description.split("\n").map((l) => l.trim()).filter(Boolean));
  }
  return lines;
}

function fmtProductBlock(p: HorecaProductDisplay, html: boolean): string {
  const lines: string[] = [];
  lines.push(html ? `• <b>${esc(p.title)}</b>` : `• ${p.title}`);
  for (const line of productLines(p)) {
    lines.push(html ? esc(line) : line);
  }
  return lines.join("\n");
}

export function buildHorecaProductPostSections(
  input: HorecaProductPostInput,
): HorecaProductPostSections {
  const phoneRaw = input.contactPhone?.trim();
  const phone = phoneRaw
    ? {
        label: "Звертатися за тел.:",
        phone: phoneRaw.startsWith("📲") ? phoneRaw : `📲 ${phoneRaw}`,
      }
    : null;

  return {
    header: "🏪 Продаж б/в обладнання",
    venue: venueLine(input, false),
    address: addressLine(input, false),
    intro: "продається:",
    products: input.products.map((p) => ({
      title: p.title,
      lines: productLines(p),
    })),
    contact: phone,
  };
}

export function formatHorecaProductPostPlain(input: HorecaProductPostInput): string {
  const blocks: string[] = [];

  blocks.push("🏪 Продаж б/в обладнання");
  blocks.push(venueLine(input, false));
  const addr = addressLine(input, false);
  if (addr) blocks.push(addr);
  blocks.push("продається:");

  const productBlocks = input.products.map((p) => fmtProductBlock(p, false));
  blocks.push(productBlocks.join("\n\n"));

  const phone = fmtPhone(input.contactPhone, false);
  if (phone) blocks.push(phone);

  if (input.siteUrl) {
    blocks.push(`🔗 ${input.siteUrl}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}

export function formatHorecaProductPostHtml(input: HorecaProductPostInput): string {
  const blocks: string[] = [];

  blocks.push(`<b>${esc("🏪 Продаж б/в обладнання")}</b>`);
  blocks.push(venueLine(input, true));
  const addr = addressLine(input, true);
  if (addr) blocks.push(addr);
  blocks.push("продається:");

  const productBlocks = input.products.map((p) => fmtProductBlock(p, true));
  blocks.push(productBlocks.join("\n\n"));

  const phone = fmtPhone(input.contactPhone, true);
  if (phone) blocks.push(phone);

  if (input.siteUrl) {
    blocks.push(`🔗 <a href="${input.siteUrl}">Детальніше</a>`);
  }

  const text = blocks.filter(Boolean).join("\n\n");
  return text.length > 1020 ? `${text.slice(0, 1017)}…` : text;
}

export function formatHorecaProductPreview(
  input: HorecaProductPostInput,
  adminFooter?: string[],
): string {
  const body = formatHorecaProductPostPlain(input);
  if (!adminFooter?.length) return body;
  return `${body}\n\n──────────\n${adminFooter.join("\n")}`;
}
