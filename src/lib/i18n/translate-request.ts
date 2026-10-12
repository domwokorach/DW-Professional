// Validation for POST /api/translate bodies. Pure, so the route stays thin and the limits are unit-tested.
import { isLanguageCode } from './languages';
import { MAX_TEXT_LENGTH } from './translatable';

export const MAX_ITEMS = 100;
export const MAX_TOTAL_CHARS = 20_000;
export const MAX_BODY_BYTES = 64 * 1024;

export type TranslateRequest = { target: string; texts: string[] };

export function parseTranslateRequest(body: unknown): TranslateRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { target, texts } = body as Record<string, unknown>;
  if (!isLanguageCode(target) || !Array.isArray(texts) || texts.length === 0 || texts.length > MAX_ITEMS) return null;
  let total = 0;
  for (const t of texts) {
    if (typeof t !== 'string' || t.length === 0 || t.length > MAX_TEXT_LENGTH) return null;
    total += t.length;
  }
  return total > MAX_TOTAL_CHARS ? null : { target, texts: texts as string[] };
}
