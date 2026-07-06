import type { VacancyDisplay } from "./format-vacancy.js";

export interface HorecaPostInput {
  businessType?: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  contactPhone?: string | null;
  /** Listing-level benefits (bullet list) */
  benefits?: string | null;
  positions: VacancyDisplay[];
  siteUrl?: string | null;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Split stored DB position into display fields */
export function parseStoredPosition(row: {
  title: string;
  salary?: string | null;
  workingHours?: string | null;
  description?: string | null;
}): VacancyDisplay {
  let experience: string | undefined;
  let extraDesc: string | undefined;
  const rawDesc = row.description?.trim() ?? "";

  if (rawDesc.startsWith("Досвід:")) {
    const parts = rawDesc.split("\n");
    experience = parts[0]?.replace(/^Досвід:\s*/, "").trim();
    extraDesc = parts.slice(1).join("\n").trim() || undefined;
  } else {
    extraDesc = rawDesc || undefined;
  }

  let schedule: string | undefined;
  let workTime: string | undefined;
  const wh = row.workingHours?.trim() ?? "";
  if (wh.includes(",")) {
    const parts = wh.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /годин/i.test(last)) {
      workTime = last;
      schedule = parts.slice(0, -1).join(", ") || undefined;
    } else if (parts.length >= 2) {
      workTime = last;
      schedule = parts.slice(0, -1).join(", ");
    } else {
      schedule = wh;
    }
  } else if (wh) {
    if (/^\d{1,2}[:.]\d{2}/.test(wh) || /до\s+\d/i.test(wh)) {
      workTime = wh;
    } else {
      schedule = wh;
    }
  }

  return {
    title: row.title,
    experience,
    salary: row.salary ?? undefined,
    schedule,
    workTime,
    description: extraDesc,
    workingHours: row.workingHours ?? undefined,
  };
}

function fmtExperience(v: VacancyDisplay): string | null {
  const raw = v.experience?.trim();
  if (!raw) return null;
  if (/^досвід/i.test(raw)) return raw;
  return `Досвід роботи ${raw}`;
}

function fmtSalary(v: VacancyDisplay): string[] {
  const raw = v.salary?.trim();
  if (!raw) return [];
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const first = lines[0]!;
  const head = /^з\/п|^💵/i.test(first) ? first : `З/п 💵 ${first}`;
  return [head, ...lines.slice(1)];
}

function fmtSchedule(v: VacancyDisplay): string | null {
  const raw = v.schedule?.trim();
  if (!raw) return null;
  if (/графік/i.test(raw)) return raw.startsWith("🗓") ? raw : `🗓 ${raw}`;
  return `🗓 Графік роботи ${raw}`;
}

function fmtWorkTime(v: VacancyDisplay): string | null {
  const raw = v.workTime?.trim();
  if (!raw) return null;
  if (raw.startsWith("⏰")) return raw;
  if (/годин/i.test(raw)) return `⏰ ${raw}`;
  return `⏰ ${raw}`;
}

function fmtVacancyExtra(v: VacancyDisplay): string[] {
  if (!v.description?.trim()) return [];
  return v.description
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function fmtVacancyBlock(v: VacancyDisplay, html: boolean): string {
  const lines: string[] = [];
  lines.push(html ? `• <b>${esc(v.title)}</b>` : `• ${v.title}`);

  for (const line of [
    fmtExperience(v),
    ...fmtSalary(v),
    fmtSchedule(v),
    fmtWorkTime(v),
    ...fmtVacancyExtra(v),
  ]) {
    if (line) lines.push(html ? esc(line) : line);
  }
  return lines.join("\n");
}

export function extractBenefitItems(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const skip = /^(📌|🔁|📅)/;
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !skip.test(l))
    .map((l) => (l.startsWith("-") ? l.slice(1).trim() : l));
}

function fmtBenefits(text: string | null | undefined, html: boolean): string {
  const items = extractBenefitItems(text);
  if (!items.length) return "";

  return items
    .map((l) => {
      const item = `- ${l}`;
      return html ? esc(item) : item;
    })
    .join("\n");
}

export function extractListingBenefits(
  text: string | null | undefined,
): string[] {
  return extractBenefitItems(text);
}

export interface HorecaVacancySection {
  title: string;
  lines: string[];
}

export interface HorecaPostSections {
  venue: string;
  address: string;
  intro: string;
  vacancies: HorecaVacancySection[];
  benefits: string[];
  contact: { label: string; phone: string } | null;
}

function vacancyLines(v: VacancyDisplay): string[] {
  return [
    fmtExperience(v),
    ...fmtSalary(v),
    fmtSchedule(v),
    fmtWorkTime(v),
    ...fmtVacancyExtra(v),
  ].filter((line): line is string => Boolean(line));
}

export function buildHorecaPostSections(
  input: HorecaPostInput,
): HorecaPostSections {
  const venue = venueLine(input, false);
  const address = addressLine(input, false);
  const phoneRaw = input.contactPhone?.trim();
  const phone = phoneRaw
    ? {
        label: "Звертатися за тел.:",
        phone: phoneRaw.startsWith("📲") ? phoneRaw : `📲 ${phoneRaw}`,
      }
    : null;

  return {
    venue,
    address,
    intro: "потрібен:",
    vacancies: input.positions.map((p) => ({
      title: p.title,
      lines: vacancyLines(p),
    })),
    benefits: extractBenefitItems(input.benefits),
    contact: phone,
  };
}

function fmtPhone(phone: string | null | undefined, html: boolean): string {
  if (!phone?.trim()) return "";
  const p = phone.trim();
  const line1 = "Звертатися за тел.:";
  const line2 = p.startsWith("📲") ? p : `📲 ${p}`;
  return html
    ? `${esc(line1)}\n${esc(line2)}`
    : `${line1}\n${line2}`;
}

function venueLine(input: HorecaPostInput, html: boolean): string {
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

function addressLine(input: HorecaPostInput, html: boolean): string {
  const parts = [
    input.address?.trim(),
    input.district?.trim(),
    input.city?.trim(),
  ].filter(Boolean);
  if (!parts.length) return "";
  const addr = parts.join(", ");
  return html ? esc(addr) : addr;
}

export function formatHorecaPostPlain(input: HorecaPostInput): string {
  const blocks: string[] = [];

  blocks.push(venueLine(input, false));
  const addr = addressLine(input, false);
  if (addr) blocks.push(addr);
  blocks.push("потрібен:");

  const vacancyBlocks = input.positions.map((p) => fmtVacancyBlock(p, false));
  blocks.push(vacancyBlocks.join("\n\n"));

  const benefits = fmtBenefits(input.benefits, false);
  if (benefits) blocks.push(benefits);

  const phone = fmtPhone(input.contactPhone, false);
  if (phone) blocks.push(phone);

  if (input.siteUrl) {
    blocks.push(`🔗 ${input.siteUrl}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}

export function formatHorecaPostHtml(input: HorecaPostInput): string {
  const blocks: string[] = [];

  blocks.push(venueLine(input, true));
  const addr = addressLine(input, true);
  if (addr) blocks.push(addr);
  blocks.push("потрібен:");

  const vacancyBlocks = input.positions.map((p) => fmtVacancyBlock(p, true));
  blocks.push(vacancyBlocks.join("\n\n"));

  const benefits = fmtBenefits(input.benefits, true);
  if (benefits) blocks.push(benefits);

  const phone = fmtPhone(input.contactPhone, true);
  if (phone) blocks.push(phone);

  if (input.siteUrl) {
    blocks.push(`🔗 <a href="${input.siteUrl}">Детальніше</a>`);
  }

  const text = blocks.filter(Boolean).join("\n\n");
  return text.length > 1020 ? `${text.slice(0, 1017)}…` : text;
}

/** Bot preview: same layout + optional admin footer lines */
export function formatHorecaPreview(
  input: HorecaPostInput,
  adminFooter?: string[],
): string {
  const body = formatHorecaPostPlain(input);
  if (!adminFooter?.length) return body;
  return `${body}\n\n──────────\n${adminFooter.join("\n")}`;
}
