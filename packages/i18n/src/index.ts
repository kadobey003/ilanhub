import uk from "./locales/uk.json" with { type: "json" };

type LocaleData = typeof uk;

const locales: Record<string, LocaleData> = {
  uk,
};

let currentLocale = "uk";

export function getLocale(): string {
  return currentLocale;
}

export function setLocale(locale: string): void {
  if (!locales[locale]) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  currentLocale = locale;
}

function resolveKey(data: LocaleData, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const localeData = locales[currentLocale] ?? uk;
  let value = resolveKey(localeData, key) ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      value = value.replace(
        new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
        String(paramValue),
      );
    }
  }

  return value;
}

/** Ukraynaca metin objesi — bot ve web için doğrudan erişim */
export const i18n = uk;

/** İlerleme etiketi: "Крок 3 з 7" */
export function stepLabel(stepNumber: number): string {
  return t("bot.progress", { current: stepNumber, total: 7 });
}

export { uk };
