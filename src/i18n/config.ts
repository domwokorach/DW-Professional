export const locales = [
  "en-GB",
  "en-US",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "th",
  "ja",
  "ko",
  "zh",
  "ar",
  "hi",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-GB";
export const localeCookieName = "portfolio-locale";

export const languageNames: Record<Locale, string> = {
  "en-GB": "English (UK)",
  "en-US": "English (US)",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  th: "ไทย",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
};

const localeLookup = new Map(locales.map((locale) => [locale.toLowerCase(), locale]));

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && localeLookup.has(value.toLowerCase()));
}

export function normaliseLocale(value: string | undefined | null): Locale | null {
  if (!value) return null;
  const exact = localeLookup.get(value.toLowerCase());
  if (exact) return exact;

  const language = value.split("-")[0].toLowerCase();
  if (language === "en") return value.toLowerCase() === "en-us" ? "en-US" : "en-GB";
  return localeLookup.get(language) ?? null;
}

export function localeFromPathname(pathname: string): Locale | null {
  return normaliseLocale(pathname.split("/").filter(Boolean)[0]);
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (isLocale(parts[0])) parts.shift();
  return `/${parts.join("/")}`;
}

export function localisedPathname(pathname: string, locale: Locale): string {
  const path = stripLocale(pathname);
  return `/${locale.toLowerCase()}${path === "/" ? "" : path}`;
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}
