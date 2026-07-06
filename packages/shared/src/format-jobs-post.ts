import type { VacancyDisplay } from "./format-vacancy.js";
import {
  extractBenefitItems,
  parseStoredPosition,
  type HorecaPostInput,
} from "./format-horeca-post.js";

export type { VacancyDisplay };
export { parseStoredPosition, extractBenefitItems };

export interface JobsPostInput {
  businessType?: string | null;
  title: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  contactPhone?: string | null;
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

function vacancyLines(v: VacancyDisplay): string[] {
  return [
    fmtExperience(v),
    ...fmtSalary(v),
    fmtSchedule(v),
    fmtWorkTime(v),
    ...fmtVacancyExtra(v),
  ].filter((line): line is string => Boolean(line));
}

function fmtVacancyBlock(v: VacancyDisplay, html: boolean): string {
  const lines: string[] = [];
  lines.push(html ? `• <b>${esc(v.title)}</b>` : `• ${v.title}`);
  for (const line of vacancyLines(v)) {
    lines.push(html ? esc(line) : line);
  }
  return lines.join("\n");
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

function fmtPhone(phone: string | null | undefined, html: boolean): string {
  if (!phone?.trim()) return "";
  const p = phone.trim();
  const line1 = "Звертатися за тел.:";
  const line2 = p.startsWith("📲") ? p : `📲 ${p}`;
  return html ? `${esc(line1)}\n${esc(line2)}` : `${line1}\n${line2}`;
}

function companyLine(input: JobsPostInput, html: boolean): string {
  const sector = (input.businessType ?? "").trim();
  let name = input.title.trim();
  name = name.replace(/^«(.+)»$/, "$1").trim() || input.title.trim();
  const line = sector
    ? `Компанія «${name}» (${sector})`
    : `Компанія «${name}»`;
  return html ? `<b>${esc(line)}</b>` : line;
}

function addressLine(input: JobsPostInput, html: boolean): string {
  const parts = [
    input.address?.trim(),
    input.district?.trim(),
    input.city?.trim(),
  ].filter(Boolean);
  if (!parts.length) return "";
  const addr = parts.join(", ");
  return html ? esc(addr) : addr;
}

export function formatJobsPostPlain(input: JobsPostInput): string {
  const blocks: string[] = [];
  blocks.push(companyLine(input, false));
  const addr = addressLine(input, false);
  if (addr) blocks.push(addr);
  blocks.push("вакансії:");

  const vacancyBlocks = input.positions.map((p) => fmtVacancyBlock(p, false));
  blocks.push(vacancyBlocks.join("\n\n"));

  const benefits = fmtBenefits(input.benefits, false);
  if (benefits) blocks.push(benefits);

  const phone = fmtPhone(input.contactPhone, false);
  if (phone) blocks.push(phone);

  if (input.siteUrl) blocks.push(`🔗 ${input.siteUrl}`);

  return blocks.filter(Boolean).join("\n\n");
}

export function formatJobsPostHtml(input: JobsPostInput): string {
  const blocks: string[] = [];
  blocks.push(companyLine(input, true));
  const addr = addressLine(input, true);
  if (addr) blocks.push(addr);
  blocks.push("вакансії:");

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

export function formatJobsPreview(
  input: JobsPostInput,
  adminFooter?: string[],
): string {
  const body = formatJobsPostPlain(input);
  if (!adminFooter?.length) return body;
  return `${body}\n\n──────────\n${adminFooter.join("\n")}`;
}

export function buildJobsPostSections(
  input: JobsPostInput,
): {
  company: string;
  address: string;
  intro: string;
  vacancies: Array<{ title: string; lines: string[] }>;
  benefits: string[];
  contact: { label: string; phone: string } | null;
} {
  const company = companyLine(input, false);
  const address = addressLine(input, false);
  const phoneRaw = input.contactPhone?.trim();
  const phone = phoneRaw
    ? {
        label: "Звертатися за тел.:",
        phone: phoneRaw.startsWith("📲") ? phoneRaw : `📲 ${phoneRaw}`,
      }
    : null;

  return {
    company,
    address,
    intro: "вакансії:",
    vacancies: input.positions.map((p) => ({
      title: p.title,
      lines: vacancyLines(p),
    })),
    benefits: extractBenefitItems(input.benefits),
    contact: phone,
  };
}

/** Map horeca-shaped input for shared vacancy display helpers */
export function jobsInputFromHoreca(input: HorecaPostInput): JobsPostInput {
  return input;
}
