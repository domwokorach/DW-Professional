// Language options shared by the switcher (browser) and the translate API (server). No secrets or I/O here.
//
// A country flag identifies a place, not a language, so each option has its own `id`. `target` is the Google
// Cloud Translation language code to translate into (null for the English variants, which are the source copy).

export const SOURCE_LANGUAGE = 'en';
/** localStorage key for the visitor's chosen language. */
export const LANGUAGE_KEY = 'portfolio-language';
/** Prefix of the localStorage keys that cache translated text in the browser. */
export const TRANSLATION_CACHE_PREFIX = 'portfolio-translations';
/** Bump when the English copy changes enough that cached translations should be discarded. */
export const CONTENT_VERSION = '1';

export type TextDirection = 'ltr' | 'rtl';

export type LanguageOption = {
  /** Stable id used in storage and the UI, e.g. "en-GB", "pt-BR", "fr". */
  id: string;
  /** Google Cloud Translation code, or null when the option shows the English source (optionally respelled). */
  target: string | null;
  /** Value for <html lang>. */
  htmlLang: string;
  english: string;
  native: string;
  /** ISO 3166 country code for a flag-icons flag, or null for the neutral globe. */
  flag: string | null;
  dir: TextDirection;
};

/** Scripts written right to left (primary language subtag). */
const RTL = new Set(['ar', 'he', 'iw', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'ckb', 'dv']);
export const directionOf = (code: string): TextDirection => (RTL.has(code.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr');

/** Flags only for languages that clearly belong to one country. Everything else gets the globe. */
export const FLAG_BY_LANGUAGE: Readonly<Record<string, string>> = {
  af: 'za', am: 'et', az: 'az', be: 'by', bg: 'bg', bn: 'bd', bs: 'ba', ceb: 'ph', cs: 'cz', da: 'dk', de: 'de',
  el: 'gr', et: 'ee', fa: 'ir', fi: 'fi', fil: 'ph', fr: 'fr', ga: 'ie', he: 'il', hi: 'in', hr: 'hr', hu: 'hu',
  hy: 'am', id: 'id', is: 'is', it: 'it', iw: 'il', ja: 'jp', ka: 'ge', kk: 'kz', km: 'kh', ko: 'kr', ky: 'kg',
  lo: 'la', lt: 'lt', lv: 'lv', mk: 'mk', mn: 'mn', ms: 'my', mt: 'mt', my: 'mm', ne: 'np', nl: 'nl', no: 'no',
  pl: 'pl', ps: 'af', 'pt-PT': 'pt', ro: 'ro', ru: 'ru', si: 'lk', sk: 'sk', sl: 'si', sq: 'al', sr: 'rs',
  sv: 'se', tg: 'tj', th: 'th', tk: 'tm', tl: 'ph', tr: 'tr', uk: 'ua', ur: 'pk', uz: 'uz', vi: 'vn',
  'zh-TW': 'tw',
};

const option = (o: Omit<LanguageOption, 'dir' | 'htmlLang'> & { htmlLang?: string }): LanguageOption => ({
  ...o,
  htmlLang: o.htmlLang ?? o.target ?? o.id,
  dir: directionOf(o.htmlLang ?? o.target ?? o.id),
});

/** The default floating rail, in display order. English options need no translation request. */
export const RAIL_LANGUAGES: readonly LanguageOption[] = [
  option({ id: 'en-GB', target: null, htmlLang: 'en-GB', english: 'English (UK)', native: 'English (UK)', flag: 'gb' }),
  option({ id: 'en-US', target: null, htmlLang: 'en-US', english: 'English (US)', native: 'English (US)', flag: 'us' }),
  option({ id: 'fr', target: 'fr', english: 'French', native: 'Français', flag: 'fr' }),
  option({ id: 'es', target: 'es', english: 'Spanish', native: 'Español', flag: 'es' }),
  option({ id: 'de', target: 'de', english: 'German', native: 'Deutsch', flag: 'de' }),
  option({ id: 'it', target: 'it', english: 'Italian', native: 'Italiano', flag: 'it' }),
  option({ id: 'th', target: 'th', english: 'Thai', native: 'ไทย', flag: 'th' }),
  option({ id: 'zh-CN', target: 'zh-CN', english: 'Chinese (Simplified)', native: '简体中文', flag: 'cn' }),
  option({ id: 'en-SG', target: null, htmlLang: 'en-SG', english: 'English (Singapore)', native: 'English (Singapore)', flag: 'sg' }),
  option({ id: 'ja', target: 'ja', english: 'Japanese', native: '日本語', flag: 'jp' }),
  option({ id: 'ko', target: 'ko', english: 'Korean', native: '한국어', flag: 'kr' }),
  option({ id: 'pt-PT', target: 'pt-PT', english: 'Portuguese (Portugal)', native: 'Português (Portugal)', flag: 'pt' }),
  option({ id: 'pt-BR', target: 'pt', htmlLang: 'pt-BR', english: 'Portuguese (Brazil)', native: 'Português (Brasil)', flag: 'br' }),
  option({ id: 'hi', target: 'hi', english: 'Hindi', native: 'हिन्दी', flag: 'in' }),
  option({ id: 'nl', target: 'nl', english: 'Dutch', native: 'Nederlands', flag: 'nl' }),
];

export const DEFAULT_LANGUAGE = RAIL_LANGUAGES[0];

/** Singapore's other working languages: same translation engine targets, Singapore flag and html lang. */
const SINGAPORE: readonly LanguageOption[] = [
  option({ id: 'zh-SG', target: 'zh-CN', htmlLang: 'zh-SG', english: 'Chinese (Singapore)', native: '华语 (新加坡)', flag: 'sg' }),
  option({ id: 'ms-SG', target: 'ms', htmlLang: 'ms-SG', english: 'Malay (Singapore)', native: 'Bahasa Melayu (Singapura)', flag: 'sg' }),
  option({ id: 'ta-SG', target: 'ta', htmlLang: 'ta-SG', english: 'Tamil (Singapore)', native: 'தமிழ் (சிங்கப்பூர்)', flag: 'sg' }),
];

export type SupportedLanguage = { code: string; name: string };

/** The language's own name for itself ("fr" → "français"); falls back to the English name. */
function nativeName(code: string, fallback: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    if (name && name !== code) return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    // Unknown locale in this runtime's ICU data.
  }
  return fallback;
}

const ENGLISH_ONLY_CODES = new Set(['en', 'auto']);

/**
 * The A–Z directory, built from the languages the translation API reports as valid targets. English (UK/US/Singapore)
 * is always present as the source copy. Anything the API does not list (including Singapore's three) is left out.
 */
export function buildDirectory(supported: readonly SupportedLanguage[]): LanguageOption[] {
  const byCode = new Map(supported.map((l) => [l.code, l]));
  const fromRail = new Map(RAIL_LANGUAGES.filter((l) => l.target).map((l) => [l.target as string, l]));
  const out: LanguageOption[] = RAIL_LANGUAGES.filter((l) => !l.target);

  for (const { code, name } of supported) {
    if (ENGLISH_ONLY_CODES.has(code)) continue;
    if (code === 'zh' && byCode.has('zh-CN')) continue; // same language as zh-CN
    const known = fromRail.get(code);
    if (known) { out.push(known); continue; }
    const english = code === 'zh-TW' ? 'Chinese (Traditional)' : name;
    out.push(option({ id: code, target: code, english, native: nativeName(code, english), flag: FLAG_BY_LANGUAGE[code] ?? null }));
  }
  for (const sg of SINGAPORE) if (sg.target && byCode.has(sg.target)) out.push(sg);

  const seen = new Set<string>();
  return out
    .filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)))
    .sort((a, b) => a.english.localeCompare(b.english, 'en', { sensitivity: 'base' }));
}

/** Lower-cased, accent-free form used for searching ("Français" matches "francais"). */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

export function searchLanguages(list: readonly LanguageOption[], query: string): LanguageOption[] {
  const q = fold(query.trim());
  if (!q) return [...list];
  return list.filter((l) => fold(l.english).includes(q) || fold(l.native).includes(q) || l.id.toLowerCase().includes(q));
}

const LANGUAGE_ID = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})?$/;
export const isLanguageCode = (value: unknown): value is string => typeof value === 'string' && value.length <= 12 && LANGUAGE_ID.test(value);

/** Validates a language option read back from storage; anything malformed is rejected. */
export function parseStoredLanguage(raw: string | null): LanguageOption | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== 'object' || v === null) return null;
    const o = v as Record<string, unknown>;
    const rail = RAIL_LANGUAGES.find((l) => l.id === o.id);
    if (rail) return rail;
    if (!isLanguageCode(o.id) || !isLanguageCode(o.target) || !isLanguageCode(o.htmlLang)) return null;
    const text = (x: unknown) => (typeof x === 'string' && x.length > 0 && x.length <= 80 ? x : null);
    const english = text(o.english);
    const native = text(o.native);
    if (!english || !native) return null;
    const flag = typeof o.flag === 'string' && /^[a-z]{2}$/.test(o.flag) ? o.flag : null;
    return { id: o.id, target: o.target, htmlLang: o.htmlLang, english, native, flag, dir: directionOf(o.htmlLang) };
  } catch {
    return null;
  }
}

/** Groups an already sorted list under its first letter (A–Z); anything else goes under "#". */
export function groupByInitial(list: readonly LanguageOption[]): { letter: string; items: LanguageOption[] }[] {
  const groups: { letter: string; items: LanguageOption[] }[] = [];
  for (const item of list) {
    const first = fold(item.english).charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    const last = groups[groups.length - 1];
    if (last?.letter === letter) last.items.push(item);
    else groups.push({ letter, items: [item] });
  }
  return groups;
}

/** localStorage key for the last successfully fetched language list. */
export const LANGUAGE_LIST_KEY = 'portfolio-language-list';
/** The cached list is revalidated once it is older than this. */
export const LANGUAGE_LIST_TTL_MS = 24 * 60 * 60 * 1000;

/** Reads the cached list back, rejecting anything malformed. */
export function parseStoredList(raw: string | null): { at: number; languages: SupportedLanguage[] } | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { at?: unknown; languages?: unknown };
    if (typeof v.at !== 'number' || !Array.isArray(v.languages)) return null;
    const languages = v.languages.filter((l): l is SupportedLanguage => typeof l?.code === 'string' && isLanguageCode(l.code) && typeof l?.name === 'string' && l.name.length > 0 && l.name.length <= 80);
    return languages.length ? { at: v.at, languages } : null;
  } catch {
    return null;
  }
}
