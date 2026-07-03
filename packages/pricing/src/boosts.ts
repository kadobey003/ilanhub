import { BoostType } from "@ilanhub/shared";

export interface BoostDefinition {
  type: BoostType;
  name: string;
  price: number;
  durationDays: number;
  currency: string;
}

export const BOOST_OPTIONS: BoostDefinition[] = [
  {
    type: BoostType.VIP,
    name: "VIP",
    price: 99,
    durationDays: 7,
    currency: "UAH",
  },
  {
    type: BoostType.PIN,
    name: "Pin",
    price: 199,
    durationDays: 3,
    currency: "UAH",
  },
  {
    type: BoostType.FEATURED,
    name: "Featured",
    price: 149,
    durationDays: 5,
    currency: "UAH",
  },
  {
    type: BoostType.COMBO,
    name: "Combo",
    price: 349,
    durationDays: 7,
    currency: "UAH",
  },
];

export function getBoostByType(type: BoostType): BoostDefinition | undefined {
  return BOOST_OPTIONS.find((b) => b.type === type);
}
