// Server-only Google Cloud Translation v3 (Advanced) access. Credentials are read from the environment here and
// nowhere else, and are never logged, returned or imported by client code.
import { TranslationServiceClient } from '@google-cloud/translate';
import { LANGUAGE_CATALOGUE, type ListSource } from './language-catalogue';
import { CONTENT_VERSION, SOURCE_LANGUAGE, type SupportedLanguage } from './languages';
import { PROTECTED_RE } from './protected-terms';
import { isTranslatable } from './translatable';

export type TranslationErrorCode = 'not_configured' | 'budget_exceeded' | 'upstream';

/** Carries only a machine code, never upstream text, so nothing sensitive can reach a response or a log line. */
export class TranslationError extends Error {
  constructor(readonly code: TranslationErrorCode) {
    super(code);
    this.name = 'TranslationError';
  }
}

/** The subset of TranslationServiceClient this module uses (so tests can supply a fake). */
export type TranslateApi = {
  getSupportedLanguages(request: { parent: string; displayLanguageCode: string }): Promise<[{ languages?: { languageCode?: string | null; displayName?: string | null; supportTarget?: boolean | null }[] | null }, ...unknown[]]>;
  translateText(
    request: { parent: string; contents: string[]; mimeType: string; sourceLanguageCode: string; targetLanguageCode: string },
    options?: { timeout?: number },
  ): Promise<[{ translations?: { translatedText?: string | null }[] | null }, ...unknown[]]>;
};

/** Env values often arrive quoted and with literal "\n" sequences (Vercel, .env files); restore real newlines. */
export function normalisePrivateKey(raw: string): string {
  return raw.trim().replace(/^"([\s\S]*)"$/, '$1').replace(/\\n/g, '\n');
}

type Credentials = { projectId: string; clientEmail?: string; privateKey?: string };

/**
 * Explicit service-account variables, or (keyless) Application Default Credentials when GOOGLE_APPLICATION_CREDENTIALS
 * points at a workload-identity / external-account config. Null when neither is set.
 */
export function readCredentials(env: Record<string, string | undefined> = process.env): Credentials | null {
  const projectId = env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  if (!projectId) return null;
  const clientEmail = env.GOOGLE_CLOUD_CLIENT_EMAIL?.trim();
  const privateKey = env.GOOGLE_CLOUD_PRIVATE_KEY;
  if (clientEmail && privateKey) return { projectId, clientEmail, privateKey: normalisePrivateKey(privateKey) };
  if (env.GOOGLE_APPLICATION_CREDENTIALS) return { projectId };
  return null;
}

let sharedClient: TranslateApi | null = null;
function defaultClient(creds: Credentials): TranslateApi {
  sharedClient ??= new TranslationServiceClient({
    projectId: creds.projectId,
    ...(creds.clientEmail && creds.privateKey ? { credentials: { client_email: creds.clientEmail, private_key: creds.privateKey } } : {}),
  }) as unknown as TranslateApi;
  return sharedClient;
}

// --- HTML round trip: protected names are wrapped so Google leaves them alone ---------------------------------

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Escapes plain text for Google's HTML mode and marks protected terms as non-translatable. */
export function toProtectedHtml(text: string): string {
  return escapeHtml(text).replace(PROTECTED_RE, '<span translate="no">$1</span>');
}

/** Removes the markup Google returns and decodes entities back to plain text. */
export function fromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
      }
      return NAMED[e.toLowerCase()] ?? m;
    });
}

// --- Translator ----------------------------------------------------------------------------------------------

const SUPPORTED_TTL_MS = 24 * 60 * 60 * 1000;
/** After a failed language-list call, wait this long before asking Google again. */
const LIST_RETRY_MS = 60_000;
const REQUEST_TIMEOUT_MS = 15_000;
const BATCH_ITEMS = 100;
const BATCH_CHARS = 20_000;

export type TranslatorOptions = {
  creds?: Credentials | null;
  client?: TranslateApi;
  /** Characters sent to Google per UTC day per server instance. */
  dailyCharLimit?: number;
  /** Maximum cached translations held in memory. */
  maxCacheEntries?: number;
  now?: () => number;
  contentVersion?: string;
};

export function createTranslator(options: TranslatorOptions = {}) {
  const now = options.now ?? Date.now;
  const version = options.contentVersion ?? CONTENT_VERSION;
  const maxEntries = options.maxCacheEntries ?? 20_000;
  const dailyLimit = options.dailyCharLimit ?? (Number(process.env.TRANSLATE_DAILY_CHAR_LIMIT) || 1_000_000);

  const cache = new Map<string, string>();
  let supported: { at: number; list: SupportedLanguage[] } | null = null;
  let listFailedAt = 0;
  let budget = { day: '', used: 0 };

  const api = (): { api: TranslateApi; parent: string } => {
    const creds = options.creds === undefined ? readCredentials() : options.creds;
    if (!creds) throw new TranslationError('not_configured');
    return { api: options.client ?? defaultClient(creds), parent: `projects/${creds.projectId}/locations/global` };
  };

  const fail = (error: unknown): never => {
    if (error instanceof TranslationError) throw error;
    // Log the error class and gRPC status code only: messages can echo request details.
    const code = (error as { code?: unknown } | null)?.code;
    console.error('[translate] upstream failure', error instanceof Error ? error.name : 'unknown', typeof code === 'number' ? code : '');
    throw new TranslationError('upstream');
  };

  const spend = (chars: number) => {
    const day = new Date(now()).toISOString().slice(0, 10);
    if (budget.day !== day) budget = { day, used: 0 };
    if (budget.used + chars > dailyLimit) throw new TranslationError('budget_exceeded');
    budget.used += chars;
  };

  const remember = (key: string, value: string) => {
    if (cache.size >= maxEntries) cache.delete(cache.keys().next().value as string);
    cache.set(key, value);
  };

  return {
    /** Languages Google can translate INTO, cached for a day. */
    async supportedLanguages(): Promise<SupportedLanguage[]> {
      if (supported && now() - supported.at < SUPPORTED_TTL_MS) return supported.list;
      try {
        const { api: a, parent } = api();
        const [res] = await a.getSupportedLanguages({ parent, displayLanguageCode: 'en' });
        const list = (res.languages ?? [])
          .filter((l) => l.languageCode && l.supportTarget !== false)
          .map((l) => ({ code: l.languageCode as string, name: l.displayName || (l.languageCode as string) }));
        supported = { at: now(), list };
        return list;
      } catch (e) {
        return fail(e);
      }
    },

    /**
     * The language directory, never failing: fresh Google list, else the last successful one (stale), else the local
     * catalogue. `error` carries the coarse reason when Google could not be asked, so callers can tell a missing
     * language list apart from a failing translation service.
     */
    async languageDirectory(): Promise<{ languages: SupportedLanguage[]; source: ListSource; error?: TranslationErrorCode }> {
      if (supported && now() - supported.at < SUPPORTED_TTL_MS) return { languages: supported.list, source: 'google' };
      const fallback = (error: TranslationErrorCode) => (supported
        ? { languages: supported.list, source: 'stale' as const, error }
        : { languages: [...LANGUAGE_CATALOGUE], source: 'catalogue' as const, error });
      if (listFailedAt && now() - listFailedAt < LIST_RETRY_MS) return fallback('upstream');
      try {
        return { languages: await this.supportedLanguages(), source: 'google' };
      } catch (e) {
        listFailedAt = now();
        console.warn('[translate] language list unavailable, using', supported ? 'last good list' : 'local catalogue', e instanceof TranslationError ? e.code : 'upstream');
        return fallback(e instanceof TranslationError ? e.code : 'upstream');
      }
    },

    /** Translates unique strings from English; results are index-aligned with `texts`. Untranslatable strings pass through. */
    async translate(target: string, texts: readonly string[]): Promise<string[]> {
      const keyOf = (t: string) => `${version}\u0000${target}\u0000${t}`;
      const pending = [...new Set(texts.filter((t) => isTranslatable(t) && !cache.has(keyOf(t))))];

      let batch: string[] = [];
      let chars = 0;
      const batches: string[][] = [];
      for (const t of pending) {
        if (batch.length >= BATCH_ITEMS || chars + t.length > BATCH_CHARS) { batches.push(batch); batch = []; chars = 0; }
        batch.push(t);
        chars += t.length;
      }
      if (batch.length) batches.push(batch);

      for (const group of batches) {
        spend(group.reduce((n, t) => n + t.length, 0));
        try {
          const { api: a, parent } = api();
          const [res] = await a.translateText(
            { parent, contents: group.map(toProtectedHtml), mimeType: 'text/html', sourceLanguageCode: SOURCE_LANGUAGE, targetLanguageCode: target },
            { timeout: REQUEST_TIMEOUT_MS },
          );
          const out = res.translations ?? [];
          group.forEach((source, i) => {
            const translated = out[i]?.translatedText;
            remember(keyOf(source), translated ? fromHtml(translated) : source);
          });
        } catch (e) {
          fail(e);
        }
      }
      return texts.map((t) => cache.get(keyOf(t)) ?? t);
    },
  };
}

let shared: ReturnType<typeof createTranslator> | null = null;
/** The per-instance translator used by the API routes (its cache and daily budget live as long as the instance). */
export const getTranslator = () => (shared ??= createTranslator());
