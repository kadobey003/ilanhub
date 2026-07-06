import {
  AUTO_CONDITION_LABELS,
  AUTO_DRIVE_LABELS,
  AUTO_FUEL_LABELS,
  AUTO_TRANSMISSION_LABELS,
} from "./constants.js";
import type { BotVehicle } from "./types.js";

export interface AutoPostInput {
  title: string;
  vehicle: BotVehicle;
  city?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  siteUrl?: string | null;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildAutoTitle(vehicle: Pick<BotVehicle, "brand" | "model" | "year">): string {
  return `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim();
}

export function formatAutoSpecsLine(vehicle: BotVehicle): string {
  const parts = [
    `⛽ ${AUTO_FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}`,
    `⚙️ ${AUTO_TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}`,
    `🛣 ${vehicle.mileage.toLocaleString("uk-UA")} км`,
  ];
  if (vehicle.engineVolume) parts.push(`${vehicle.engineVolume} л`);
  if (vehicle.driveType) {
    parts.push(`🔧 ${AUTO_DRIVE_LABELS[vehicle.driveType] ?? vehicle.driveType}`);
  }
  if (vehicle.color) parts.push(`🎨 ${vehicle.color}`);
  parts.push(`📋 ${AUTO_CONDITION_LABELS[vehicle.condition] ?? vehicle.condition}`);
  return parts.join(" · ");
}

function fmtPrice(price: number): string {
  return `${price.toLocaleString("uk-UA")} ₴`;
}

function fmtPhone(phone: string | null | undefined, html: boolean): string {
  if (!phone?.trim()) return "";
  const p = phone.trim();
  const line1 = "Звертатися за тел.:";
  const line2 = p.startsWith("📲") ? p : `📲 ${p}`;
  return html ? `${esc(line1)}\n${esc(line2)}` : `${line1}\n${line2}`;
}

export function formatAutoPostPlain(input: AutoPostInput): string {
  const { vehicle } = input;
  const blocks: string[] = [];
  blocks.push(`🚗 ${input.title}`);
  blocks.push(`💰 ${fmtPrice(vehicle.salePrice)}`);
  if (input.city) blocks.push(`📍 ${input.city}`);
  blocks.push(formatAutoSpecsLine(vehicle));
  if (input.description?.trim()) blocks.push(input.description.trim());
  const phone = fmtPhone(input.contactPhone, false);
  if (phone) blocks.push(phone);
  if (input.siteUrl) blocks.push(`🔗 ${input.siteUrl}`);
  return blocks.filter(Boolean).join("\n\n");
}

export function formatAutoPostHtml(input: AutoPostInput): string {
  const { vehicle } = input;
  const blocks: string[] = [];
  blocks.push(`🚗 <b>${esc(input.title)}</b>`);
  blocks.push(`💰 <b>${esc(fmtPrice(vehicle.salePrice))}</b>`);
  if (input.city) blocks.push(`📍 ${esc(input.city)}`);
  blocks.push(esc(formatAutoSpecsLine(vehicle)));
  if (input.description?.trim()) {
    const desc = input.description.trim();
    const clipped = desc.length > 800 ? `${desc.slice(0, 797)}…` : desc;
    blocks.push(esc(clipped));
  }
  const phone = fmtPhone(input.contactPhone, true);
  if (phone) blocks.push(phone);
  if (input.siteUrl) {
    blocks.push(`🔗 <a href="${input.siteUrl}">Детальніше на сайті</a>`);
  }
  const text = blocks.filter(Boolean).join("\n\n");
  return text.length > 1020 ? `${text.slice(0, 1017)}…` : text;
}

export function formatAutoPreview(
  input: AutoPostInput,
  adminFooter?: string[],
): string {
  const body = formatAutoPostPlain(input);
  if (!adminFooter?.length) return body;
  return `${body}\n\n──────────\n${adminFooter.join("\n")}`;
}
