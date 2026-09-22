export const MESSAGE_MAX_CHARS = 2000;

/**
 * Counts Unicode code points rather than UTF-16 code units, so characters
 * outside the BMP (e.g. emoji) count as one character instead of two.
 */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/**
 * Truncates `text` to at most `maxChars` characters, preserving everything
 * before the cutoff untouched (spaces, punctuation, line breaks included).
 */
export function clampToCharLimit(text: string, maxChars: number): string {
  const chars = Array.from(text);
  if (chars.length <= maxChars) return text;
  return chars.slice(0, maxChars).join("");
}
