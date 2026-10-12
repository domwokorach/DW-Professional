import { getTranslator } from '@/lib/i18n/translation.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { clientIp } from '@/lib/request.server';

export const runtime = 'nodejs';

const limited = createRateLimit({ windowMs: 60_000, max: 30 });

/**
 * The languages the selector offers. Always answers with a usable list: Google's current one, else the last good one,
 * else the local catalogue. `source` and `error` say which, so a missing list is never confused with a failing translation
 * service. Only the live list is CDN-cached for a day; fallbacks are cached briefly so the real list returns soon.
 */
export async function GET(request: Request) {
  if (limited(clientIp(request))) return Response.json({ error: 'rate_limited' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
  const { languages, source, error } = await getTranslator().languageDirectory();
  const live = source === 'google';
  return Response.json(
    { languages, source, ...(error ? { error } : {}) },
    { headers: { 'Cache-Control': live ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
