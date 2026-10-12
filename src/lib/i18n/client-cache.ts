// Per-language translation cache in localStorage, so a returning visitor sees translated text on the first scan
// without a network round trip. Keyed by content version; the four most recently used languages are kept.
import { CONTENT_VERSION, TRANSLATION_CACHE_PREFIX as PREFIX } from './languages';

const INDEX_KEY = `${PREFIX}:index`;
const MAX_LANGUAGES = 4;
const MAX_CHARS = 300_000;

const keyFor = (target: string) => `${PREFIX}:${CONTENT_VERSION}:${target}`;

export function loadCache(target: string, storage: Pick<Storage, 'getItem'> = window.localStorage): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const raw = storage.getItem(keyFor(target));
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) if (typeof v === 'string') map.set(k, v);
    }
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  return map;
}

export function saveCache(target: string, map: ReadonlyMap<string, string>, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.localStorage): void {
  try {
    const entries = [...map];
    let size = entries.reduce((n, [k, v]) => n + k.length + v.length + 6, 0);
    // Oldest entries first; Map keeps insertion order.
    let drop = 0;
    while (size > MAX_CHARS && drop < entries.length) { const [k, v] = entries[drop++]; size -= k.length + v.length + 6; }
    storage.setItem(keyFor(target), JSON.stringify(Object.fromEntries(entries.slice(drop))));

    const key = keyFor(target);
    const raw = storage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const index = (Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []).filter((k) => k !== key);
    index.push(key);
    while (index.length > MAX_LANGUAGES) storage.removeItem(index.shift() as string);
    storage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Quota exceeded or storage blocked: the in-memory cache still works for this page view.
  }
}
