import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { americanise } from '../src/lib/i18n/american-english';
import {
  buildDirectory,
  directionOf,
  FLAG_BY_LANGUAGE,
  groupByInitial,
  parseStoredLanguage,
  RAIL_LANGUAGES,
  searchLanguages,
} from '../src/lib/i18n/languages';
import { isTranslatable } from '../src/lib/i18n/translatable';
import { MAX_ITEMS, parseTranslateRequest } from '../src/lib/i18n/translate-request';
import {
  createTranslator,
  fromHtml,
  normalisePrivateKey,
  readCredentials,
  toProtectedHtml,
  TranslationError,
  type TranslateApi,
} from '../src/lib/i18n/translation.server';

const root = path.resolve(import.meta.dirname, '..');
const flagCss = readFileSync(path.join(root, 'node_modules/flag-icons/css/flag-icons.min.css'), 'utf8');

// --- languages and flags ---------------------------------------------------------------------------------------

test('the rail lists the requested countries with their flag classes', () => {
  const expected = ['gb', 'us', 'fr', 'es', 'de', 'it', 'th', 'cn', 'sg', 'jp', 'kr', 'pt', 'br', 'in', 'nl'];
  assert.deepEqual(RAIL_LANGUAGES.map((l) => l.flag), expected);
  assert.deepEqual(RAIL_LANGUAGES.slice(0, 2).map((l) => l.english), ['English (UK)', 'English (US)']);
});

test('every flag we reference exists in the flag-icons stylesheet', () => {
  const flags = new Set([...RAIL_LANGUAGES.map((l) => l.flag), ...Object.values(FLAG_BY_LANGUAGE)]);
  for (const flag of flags) assert.ok(flag && flagCss.includes(`.fi-${flag}{`), `missing flag ${flag}`);
});

test('English variants are source copy; flags are not used as language identifiers', () => {
  const english = RAIL_LANGUAGES.filter((l) => l.id.startsWith('en-'));
  assert.deepEqual(english.map((l) => [l.id, l.target, l.htmlLang]), [['en-GB', null, 'en-GB'], ['en-US', null, 'en-US'], ['en-SG', null, 'en-SG']]);
  assert.equal(RAIL_LANGUAGES.find((l) => l.id === 'pt-BR')?.target, 'pt');
  assert.equal(RAIL_LANGUAGES.find((l) => l.id === 'pt-PT')?.target, 'pt-PT');
});

test('right-to-left languages are detected', () => {
  for (const code of ['ar', 'he', 'fa', 'ur', 'ps', 'ar-EG']) assert.equal(directionOf(code), 'rtl', code);
  for (const code of ['en', 'fr', 'zh-CN', 'hi', 'th']) assert.equal(directionOf(code), 'ltr', code);
});

const API = [
  { code: 'af', name: 'Afrikaans' }, { code: 'ar', name: 'Arabic' }, { code: 'en', name: 'English' }, { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese' }, { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ms', name: 'Malay' }, { code: 'ta', name: 'Tamil' }, { code: 'pt', name: 'Portuguese' }, { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'sw', name: 'Swahili' },
];

test('the directory is built from the API list, sorted A–Z, without unsupported options', () => {
  const dir = buildDirectory(API);
  const names = dir.map((l) => l.english);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  assert.ok(names.includes('Swahili'));
  assert.ok(!dir.some((l) => l.id === 'de' || l.id === 'ja'), 'languages the API did not list must not appear');
  assert.equal(dir.filter((l) => l.id === 'zh').length, 0, 'zh is an alias of zh-CN');
  assert.equal(dir.find((l) => l.id === 'zh-TW')?.english, 'Chinese (Traditional)');
  assert.equal(dir.find((l) => l.id === 'sw')?.flag, null, 'no single country flag for Swahili → globe');
  assert.equal(dir.find((l) => l.id === 'fr')?.native.toLowerCase(), 'français');
  assert.equal(new Set(dir.map((l) => l.id)).size, dir.length);
});

test('Singapore gets separate Mandarin, Malay and Tamil options only when supported', () => {
  const ids = (list: typeof API) => buildDirectory(list).filter((l) => l.flag === 'sg').map((l) => l.id).sort();
  assert.deepEqual(ids(API), ['en-SG', 'ms-SG', 'ta-SG', 'zh-SG']);
  assert.deepEqual(ids(API.filter((l) => l.code !== 'ta')), ['en-SG', 'ms-SG', 'zh-SG']);
  assert.equal(buildDirectory(API).find((l) => l.id === 'zh-SG')?.target, 'zh-CN');
});

test('English (UK/US/Singapore) are always available, even if the language list fails to load', () => {
  assert.deepEqual(buildDirectory([]).map((l) => l.id), ['en-SG', 'en-GB', 'en-US']);
});

test('search ignores case and accents and matches native names', () => {
  const dir = buildDirectory(API);
  assert.deepEqual(searchLanguages(dir, 'FRANCAIS').map((l) => l.id), ['fr']);
  assert.deepEqual(searchLanguages(dir, 'arab').map((l) => l.id), ['ar']);
  assert.deepEqual(searchLanguages(dir, 'zzzz'), []);
  assert.equal(searchLanguages(dir, '  ').length, dir.length);
});

test('groups are A–Z initials in order', () => {
  const groups = groupByInitial(buildDirectory(API));
  assert.deepEqual(groups.map((g) => g.letter), [...new Set(groups.map((g) => g.letter))]);
  assert.equal(groups[0].letter, 'A');
});

test('stored language is validated', () => {
  assert.equal(parseStoredLanguage(null), null);
  assert.equal(parseStoredLanguage('not json'), null);
  assert.equal(parseStoredLanguage(JSON.stringify({ id: 'fr!', target: 'fr' })), null);
  assert.equal(parseStoredLanguage(JSON.stringify({ id: 'xx', target: '../etc', htmlLang: 'xx', english: 'x', native: 'y' })), null);
  assert.equal(parseStoredLanguage(JSON.stringify({ id: 'fr', target: '../etc' }))?.target, 'fr', 'a known id always resolves to the built-in option');
  assert.equal(parseStoredLanguage(JSON.stringify({ id: 'fr' }))?.target, 'fr', 'known ids resolve to the built-in option');
  const sw = parseStoredLanguage(JSON.stringify({ id: 'sw', target: 'sw', htmlLang: 'sw', english: 'Swahili', native: 'Kiswahili', flag: null }));
  assert.equal(sw?.dir, 'ltr');
});

// --- text rules --------------------------------------------------------------------------------------------------

test('only real prose is translatable', () => {
  assert.ok(isTranslatable('Software Engineer'));
  for (const s of ['', ' ', '2026', '£1,200', '—', 'me@example.com', 'https://www.dominicwokorach.me', 'www.example.com', 'x', 'a'.repeat(1001)]) {
    assert.equal(isTranslatable(s), false, s);
  }
});

test('English (US) respells British words and keeps capitalisation', () => {
  assert.equal(americanise('Colour and behaviour of the organisation'), 'Color and behavior of the organization');
  assert.equal(americanise('Optimised, personalised and Centralised'), 'Optimized, personalized and Centralized');
  assert.equal(americanise('ANALYSE the Centre Programme'), 'ANALYZE the Center Program');
  assert.equal(americanise('Favourites and neighbours'), 'Favorites and neighbors');
  assert.equal(americanise('Our four hours of labour'), 'Our four hours of labor');
  assert.equal(americanise('Dominic builds accessible interfaces.'), 'Dominic builds accessible interfaces.');
});

// --- request validation --------------------------------------------------------------------------------------------

test('translate requests are validated', () => {
  assert.deepEqual(parseTranslateRequest({ target: 'fr', texts: ['Hello'] }), { target: 'fr', texts: ['Hello'] });
  const bad: unknown[] = [
    null, 'x', {}, { target: 'fr' }, { target: 'fr', texts: [] }, { target: 'f', texts: ['a'] }, { target: 'fr; drop', texts: ['a'] },
    { target: 'fr', texts: [1] }, { target: 'fr', texts: [''] }, { target: 'fr', texts: ['a'.repeat(1001)] },
    { target: 'fr', texts: Array(MAX_ITEMS + 1).fill('a') }, { target: 'fr', texts: Array(30).fill('a'.repeat(900)) },
  ];
  for (const b of bad) assert.equal(parseTranslateRequest(b), null, JSON.stringify(b)?.slice(0, 40));
});

// --- Google Cloud Translation v3 wrapper --------------------------------------------------------------------------

test('private keys with escaped newlines and quotes are normalised', () => {
  assert.equal(normalisePrivateKey('"-----BEGIN KEY-----\\nabc\\n-----END KEY-----\\n"'), '-----BEGIN KEY-----\nabc\n-----END KEY-----\n');
  assert.equal(normalisePrivateKey('a\nb'), 'a\nb');
});

test('credentials come from the three variables, or keyless ADC, or nothing', () => {
  assert.equal(readCredentials({}), null);
  assert.equal(readCredentials({ GOOGLE_CLOUD_PROJECT_ID: 'p' }), null);
  assert.deepEqual(readCredentials({ GOOGLE_CLOUD_PROJECT_ID: 'p', GOOGLE_CLOUD_CLIENT_EMAIL: 'e@x', GOOGLE_CLOUD_PRIVATE_KEY: 'k\\nk' }), { projectId: 'p', clientEmail: 'e@x', privateKey: 'k\nk' });
  assert.deepEqual(readCredentials({ GOOGLE_CLOUD_PROJECT_ID: 'p', GOOGLE_APPLICATION_CREDENTIALS: '/adc.json' }), { projectId: 'p' });
});

test('names are protected and the HTML round trip is lossless', () => {
  const html = toProtectedHtml('Dominic Wokorach Olanya builds <React> apps & more');
  assert.equal(html, '<span translate="no">Dominic Wokorach Olanya</span> builds &lt;<span translate="no">React</span>&gt; apps &amp; more');
  assert.equal(fromHtml(html), 'Dominic Wokorach Olanya builds <React> apps & more');
  assert.equal(fromHtml('l&#39;ordre &quot;x&quot; &#x41;'), 'l\'ordre "x" A');
  assert.equal(toProtectedHtml('Reactive'), 'Reactive', 'whole words only');
});

function fakeApi() {
  const calls = { translate: [] as string[][], languages: 0 };
  const api: TranslateApi = {
    async getSupportedLanguages(request) {
      calls.languages++;
      assert.equal(request.parent, 'projects/test-project/locations/global');
      return [{ languages: [{ languageCode: 'fr', displayName: 'French', supportTarget: true }, { languageCode: 'xx', displayName: 'Source only', supportTarget: false }] }];
    },
    async translateText(request) {
      assert.equal(request.sourceLanguageCode, 'en');
      assert.equal(request.mimeType, 'text/html');
      calls.translate.push(request.contents);
      return [{ translations: request.contents.map((c) => ({ translatedText: `[${request.targetLanguageCode}] ${c}` })) }];
    },
  };
  return { api, calls };
}
const creds = { projectId: 'test-project' };

test('translations are deduplicated, cached by text/target/version, and untranslatable text passes through', async () => {
  const { api, calls } = fakeApi();
  const t = createTranslator({ client: api, creds });
  const out = await t.translate('fr', ['Hello', 'Hello', '2026', 'me@x.com', 'Dominic builds']);
  assert.deepEqual(out, ['[fr] Hello', '[fr] Hello', '2026', 'me@x.com', '[fr] <span translate="no">Dominic</span> builds'.replace(/<[^>]+>/g, '')]);
  assert.deepEqual(calls.translate, [['Hello', '<span translate="no">Dominic</span> builds']]);
  await t.translate('fr', ['Hello']);
  assert.equal(calls.translate.length, 1, 'second request is served from cache');
  await t.translate('de', ['Hello']);
  assert.equal(calls.translate.length, 2, 'a different target is a different cache entry');
  const v2 = createTranslator({ client: api, creds, contentVersion: '2' });
  await v2.translate('fr', ['Hello']);
  assert.equal(calls.translate.length, 3, 'a new content version does not reuse old entries');
});

test('large requests are split into batches', async () => {
  const { api, calls } = fakeApi();
  const t = createTranslator({ client: api, creds, dailyCharLimit: 1e9 });
  await t.translate('fr', Array.from({ length: 250 }, (_, i) => `Sentence number ${i}`));
  assert.deepEqual(calls.translate.map((b) => b.length), [100, 100, 50]);
});

test('supported languages are cached and only valid targets are returned', async () => {
  const { api, calls } = fakeApi();
  const t = createTranslator({ client: api, creds });
  assert.deepEqual(await t.supportedLanguages(), [{ code: 'fr', name: 'French' }]);
  await t.supportedLanguages();
  assert.equal(calls.languages, 1);
});

test('the daily character budget stops spend', async () => {
  const { api, calls } = fakeApi();
  const t = createTranslator({ client: api, creds, dailyCharLimit: 20 });
  await t.translate('fr', ['Hello there']);
  await assert.rejects(t.translate('fr', ['Another sentence entirely']), (e) => e instanceof TranslationError && e.code === 'budget_exceeded');
  assert.equal(calls.translate.length, 1);
  await t.translate('fr', ['Hello there']); // cached text costs nothing
});

test('missing credentials fail safely', async () => {
  const t = createTranslator({ creds: null });
  await assert.rejects(t.translate('fr', ['Hello']), (e) => e instanceof TranslationError && e.code === 'not_configured');
  await assert.rejects(t.supportedLanguages(), (e) => e instanceof TranslationError && e.code === 'not_configured');
});

test('upstream failures never expose their message or credentials', async () => {
  const secret = '-----BEGIN PRIVATE KEY-----super-secret';
  const api: TranslateApi = {
    async getSupportedLanguages() { throw new Error(`auth failed with ${secret}`); },
    async translateText() { throw Object.assign(new Error(`bad key ${secret}`), { code: 7 }); },
  };
  const logged: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => { logged.push(args.map(String).join(' ')); };
  try {
    const t = createTranslator({ client: api, creds });
    for (const run of [() => t.translate('fr', ['Hello']), () => t.supportedLanguages()]) {
      await assert.rejects(run(), (e) => e instanceof TranslationError && e.code === 'upstream' && !e.message.includes('secret'));
    }
  } finally {
    console.error = original;
  }
  assert.ok(logged.length > 0);
  assert.ok(logged.every((line) => !line.includes('secret') && !line.includes('PRIVATE KEY')), logged.join('\n'));
});

// --- route handlers --------------------------------------------------------------------------------------------------

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://www.dominicwokorach.me/api/translate', {
    method: 'POST',
    headers: { host: 'www.dominicwokorach.me', origin: 'https://www.dominicwokorach.me', 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('POST /api/translate rejects cross-site, malformed and oversized requests, and reports missing config without detail', async () => {
  const saved = { ...process.env };
  for (const key of Object.keys(process.env)) if (key.startsWith('GOOGLE_')) delete process.env[key];
  try {
    const { POST } = await import('../src/app/api/translate/route');
    assert.equal((await POST(post({ target: 'fr', texts: ['Hi'] }, { origin: 'https://evil.example' }))).status, 403);
    assert.equal((await POST(post({ target: 'fr', texts: [] }))).status, 400);
    assert.equal((await POST(post({ target: 'fr', texts: ['Hi'] }, { 'content-type': 'text/plain' }))).status, 400);
    assert.equal((await POST(post({ target: 'fr', texts: ['Hi'] }, { 'content-length': '999999' }))).status, 413);
    const res = await POST(post({ target: 'fr', texts: ['Hi'] }, { 'x-forwarded-for': '203.0.113.9' }));
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: 'not_configured' });
    assert.equal(res.headers.get('cache-control'), 'no-store');
  } finally {
    process.env = saved;
  }
});

test('POST /api/translate is rate limited per client', async () => {
  const { POST } = await import('../src/app/api/translate/route');
  let limited = 0;
  for (let i = 0; i < 60; i++) {
    const res = await POST(post({ target: 'fr', texts: [] }, { 'x-forwarded-for': '198.51.100.7' }));
    if (res.status === 429) limited++;
  }
  assert.ok(limited > 0);
});

// --- secrets stay on the server --------------------------------------------------------------------------------------

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? sources(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

test('browser code never imports server modules or mentions Google credentials', () => {
  const browserFiles = [
    ...sources(path.join(root, 'src/components/language')),
    ...['languages', 'client-cache', 'dom-translator', 'american-english', 'translatable', 'translate-request'].map((n) => path.join(root, `src/lib/i18n/${n}.ts`)),
  ];
  for (const file of browserFiles) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!/GOOGLE_|private_key|PRIVATE KEY|translation\.server|@google-cloud/.test(text), `${path.relative(root, file)} leaks server concerns`);
  }
  for (const file of sources(path.join(root, 'src'))) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!/NEXT_PUBLIC_GOOGLE/.test(text), `${path.relative(root, file)} exposes Google config publicly`);
  }
  const route = readFileSync(path.join(root, 'src/app/api/translate/route.ts'), 'utf8');
  assert.match(route, /export const runtime = 'nodejs'/);
});

// --- layout rules (the stylesheet is the contract; real rendering is checked in the browser) ------------------------------

test('stylesheet pins the dock to the right edge, scrolls the directory, and respects reduced motion', () => {
  const css = readFileSync(path.join(root, 'src/styles/language.css'), 'utf8').replace(/\s+/g, '');
  assert.match(css, /\.lang-dock\{[^}]*position:fixed;[^}]*right:max\(20px[^}]*top:50%;[^}]*transform:translateY\(-50%\)/);
  assert.match(css, /z-index:50/);
  assert.match(css, /\.lang-panel\{[^}]*max-height:min\(420px,70dvh\)/);
  assert.match(css, /\.lang-panel__scroll\{[^}]*overflow-y:auto/);
  assert.match(css, /\.lang-trigger\{[^}]*width:48px;height:48px/);
  assert.match(css, /\.lang-panel\{[^}]*max-height:min\(420px,70dvh\)/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /env\(safe-area-inset-right\)/);
  assert.match(css, /:focus-visible\{outline:3px/);
});

test('languageDirectory: live list, then last good list, then the local catalogue; never throws', async () => {
  const { LANGUAGE_CATALOGUE } = await import('../src/lib/i18n/language-catalogue');
  const warn = console.warn; console.warn = () => {};
  try {
    let clock = 0; let down = false; let calls = 0;
    const api: TranslateApi = {
      async getSupportedLanguages() { calls++; if (down) throw new Error('boom'); return [{ languages: [{ languageCode: 'fr', displayName: 'French', supportTarget: true }] }]; },
      async translateText() { return [{ translations: [] }]; },
    };
    const t = createTranslator({ client: api, creds, now: () => clock });
    assert.equal((await t.languageDirectory()).source, 'google');
    clock += 25 * 3600_000; down = true;
    const stale = await t.languageDirectory();
    assert.equal(stale.source, 'stale'); assert.deepEqual(stale.languages, [{ code: 'fr', name: 'French' }]); assert.equal(stale.error, 'upstream');
    const seen = calls; await t.languageDirectory();
    assert.equal(calls, seen, 'backs off after a failure instead of hammering Google');

    const cold = createTranslator({ creds: null });
    const fallback = await cold.languageDirectory();
    assert.equal(fallback.source, 'catalogue'); assert.equal(fallback.error, 'not_configured');
    assert.equal(fallback.languages.length, LANGUAGE_CATALOGUE.length);
  } finally { console.warn = warn; }
});

test('the local catalogue is well formed, unique and covers the headline languages', async () => {
  const { LANGUAGE_CATALOGUE } = await import('../src/lib/i18n/language-catalogue');
  const { isLanguageCode } = await import('../src/lib/i18n/languages');
  const codes = LANGUAGE_CATALOGUE.map((l) => l.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(LANGUAGE_CATALOGUE.every((l) => isLanguageCode(l.code) && l.name.trim()));
  for (const c of ['fr', 'es', 'de', 'it', 'ja', 'ko', 'th', 'zh-CN', 'hi', 'pt', 'ar', 'nl']) assert.ok(codes.includes(c), c);
});
