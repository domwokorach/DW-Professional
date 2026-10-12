import { isLanguageCode } from '@/lib/i18n/languages';
import { MAX_BODY_BYTES, parseTranslateRequest } from '@/lib/i18n/translate-request';
import { getTranslator, TranslationError } from '@/lib/i18n/translation.server';
import { createRateLimit } from '@/lib/rate-limit.server';
import { clientIp, isSameOrigin } from '@/lib/request.server';

// Google Cloud's client needs Node APIs, so this stays on the Node.js runtime.
export const runtime = 'nodejs';

// Soft per-instance limits (see rate-limit.server.ts); the daily character budget in translation.server.ts is the cost cap.
const limited = createRateLimit({ windowMs: 60_000, max: 40 });

const reply = (body: unknown, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply({ error: 'forbidden' }, 403);
  if (limited(clientIp(request))) return reply({ error: 'rate_limited' }, 429);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'invalid_request' }, 400);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return reply({ error: 'invalid_request' }, 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ error: 'invalid_request' }, 400);
  }
  const parsed = parseTranslateRequest(body);
  if (!parsed || !isLanguageCode(parsed.target)) return reply({ error: 'invalid_request' }, 400);

  try {
    const translator = getTranslator();
    // Only languages Google reports as valid targets are accepted ("zh" is an alias of zh-CN in the directory).
    const { languages: supported } = await translator.languageDirectory();
    if (!supported.some((l) => l.code === parsed.target)) return reply({ error: 'unsupported_language' }, 400);
    return reply({ translations: await translator.translate(parsed.target, parsed.texts) }, 200);
  } catch (error) {
    // Only a coarse code ever leaves the server; credentials and upstream messages stay out of responses.
    const code = error instanceof TranslationError ? error.code : 'upstream';
    return reply({ error: code === 'upstream' ? 'translation_failed' : code }, code === 'budget_exceeded' ? 429 : 503);
  }
}
