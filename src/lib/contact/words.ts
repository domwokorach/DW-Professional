export const MESSAGE_MAX_WORDS = 2000;

/** Splits on runs of whitespace so repeated spaces never count as extra words. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Truncates `text` to at most `maxWords` words, cutting at the end of the
 * last allowed word so everything before it (including line breaks and
 * paragraph spacing) is preserved untouched.
 */
export function clampToWordLimit(text: string, maxWords: number): string {
  const matches = Array.from(text.matchAll(/\S+/g));
  if (matches.length <= maxWords) return text;
  const cutoff = matches[maxWords - 1];
  const end = (cutoff.index ?? 0) + cutoff[0].length;
  return text.slice(0, end);
}
