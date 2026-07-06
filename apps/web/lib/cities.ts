export interface CityOption {
  slug: string;
  name: string;
}

export const JOB_CITIES: CityOption[] = [
  { slug: "kyiv", name: "Київ" },
  { slug: "lviv", name: "Львів" },
  { slug: "odesa", name: "Одеса" },
  { slug: "kharkiv", name: "Харків" },
  { slug: "dnipro", name: "Дніпро" },
  { slug: "zaporizhzhia", name: "Запоріжжя" },
  { slug: "vinnytsia", name: "Вінниця" },
  { slug: "poltava", name: "Полтава" },
  { slug: "chernivtsi", name: "Чернівці" },
  { slug: "ivano-frankivsk", name: "Івано-Франківськ" },
  { slug: "ternopil", name: "Тернопіль" },
  { slug: "uzhhorod", name: "Ужгород" },
  { slug: "mykolaiv", name: "Миколаїв" },
  { slug: "kryvyi-rih", name: "Кривий Ріг" },
  { slug: "cherkasy", name: "Черкаси" },
  { slug: "sumy", name: "Суми" },
  { slug: "zhytomyr", name: "Житомир" },
  { slug: "rivne", name: "Рівне" },
  { slug: "kremenchuk", name: "Кременчук" },
  { slug: "kamianske", name: "Кам'янське" },
];

const SLUG_ALIASES: Record<string, string> = {
  київ: "kyiv",
  киев: "kyiv",
  kyiv: "kyiv",
  львів: "lviv",
  львов: "lviv",
  lviv: "lviv",
  одеса: "odesa",
  odesa: "odesa",
  харків: "kharkiv",
  харьков: "kharkiv",
  kharkiv: "kharkiv",
  дніпро: "dnipro",
  днепр: "dnipro",
  dnipro: "dnipro",
  запоріжжя: "zaporizhzhia",
  запорожье: "zaporizhzhia",
  zaporizhzhia: "zaporizhzhia",
  вінниця: "vinnytsia",
  vinnytsia: "vinnytsia",
  полтава: "poltava",
  poltava: "poltava",
  чернівці: "chernivtsi",
  chernivtsi: "chernivtsi",
  "івано-франківськ": "ivano-frankivsk",
  "ivano-frankivsk": "ivano-frankivsk",
  тернопіль: "ternopil",
  ternopil: "ternopil",
  ужгород: "uzhhorod",
  uzhhorod: "uzhhorod",
  миколаїв: "mykolaiv",
  mykolaiv: "mykolaiv",
  "кривий ріг": "kryvyi-rih",
  "kryvyi-rih": "kryvyi-rih",
  черкаси: "cherkasy",
  cherkasy: "cherkasy",
  суми: "sumy",
  sumy: "sumy",
  житомир: "zhytomyr",
  zhytomyr: "zhytomyr",
  рівне: "rivne",
  rivne: "rivne",
  кременчук: "kremenchuk",
  kremenchuk: "kremenchuk",
  "кам'янське": "kamianske",
  kamianske: "kamianske",
};

export function normalizeCitySlug(raw: string): string {
  const decoded = decodeURIComponent(raw).trim().toLowerCase();
  return SLUG_ALIASES[decoded] ?? decoded;
}

export function cityDisplayName(slug: string): string {
  const normalized = normalizeCitySlug(slug);
  return JOB_CITIES.find((c) => c.slug === normalized)?.name ?? decodeURIComponent(slug);
}

export function cityListingsPath(project: string, citySlug: string): string {
  return `/${project}/${normalizeCitySlug(citySlug)}/ogoloshennya`;
}

export function cityProdazhPath(citySlug: string): string {
  return `/horeca/${normalizeCitySlug(citySlug)}/prodazh`;
}

export function projectAllListingsPath(project: string): string {
  if (project === "horeca") return "/horeca/ogoloshennya";
  if (project === "jobs") return "/jobs";
  return `/${project}/ogoloshennya`;
}
