// Decides which strings are worth translating. Shared by the browser (before asking) and the server (before paying).

export const MAX_TEXT_LENGTH = 1000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_LIKE = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+$/i;
const HAS_LETTER = /\p{L}/u;

/** False for numbers, symbols, e-mail addresses, URLs and over-long strings, which are left exactly as written. */
export function isTranslatable(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > MAX_TEXT_LENGTH) return false;
  if (!HAS_LETTER.test(t)) return false;
  return !EMAIL.test(t) && !URL_LIKE.test(t);
}
