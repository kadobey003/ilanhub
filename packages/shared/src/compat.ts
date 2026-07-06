import { BotStep, type BotChannel } from "./types.js";
import { BOT_STEP_ORDER, stepIndex } from "./bot-state-machine.js";

export const ListingState = BotStep;
export type ListingState = BotStep;

export type Channel = BotChannel;

export const LISTING_STATE_ORDER = BOT_STEP_ORDER;

export function getStateStep(state: BotStep): number {
  const idx = stepIndex(state);
  return idx >= 0 ? idx + 1 : 1;
}

export interface ApiProject {
  id: string;
  slug: string;
  name: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface ApiCity {
  id: string;
  name: string;
  slug: string;
}

export interface ApiDistrict {
  id: string;
  name: string;
  slug: string;
}

export interface ApiVacancyType {
  id: string;
  name: string;
  slug: string;
  vacancyCount: number;
  price: number;
}

export interface ApiListing {
  id: string;
  title: string | null;
  description?: string | null;
  status: string;
  price: number | null;
  currency?: string | null;
  project?: string;
  projectSlug?: string;
  createdAt: string;
  publishedAt?: string | null;
  contactPhone?: string | null;
  sourceStep?: string | null;
}
