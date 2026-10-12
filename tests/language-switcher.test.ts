import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { JSDOM } from 'jsdom';

// A browser-like environment, set up before any DOM-dependent module is loaded.
const dom = new JSDOM('<!doctype html><html lang="en-GB"><head><title>Software Engineer</title></head><body></body></html>', { url: 'https://www.dominicwokorach.me/en-gb', pretendToBeVisual: true });
const w = dom.window;
Object.assign(globalThis, {
  window: w, document: w.document, Node: w.Node, NodeFilter: w.NodeFilter, Element: w.Element, HTMLElement: w.HTMLElement,
  MutationObserver: w.MutationObserver, KeyboardEvent: w.KeyboardEvent, MouseEvent: w.MouseEvent, Event: w.Event, localStorage: w.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true });
w.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof w.matchMedia;

const { act, cleanup, fireEvent, render, screen, waitFor, within } = await import('@testing-library/react');
const { createElement } = await import('react');
const { DomTranslator } = await import('../src/lib/i18n/dom-translator');
const { americanise } = await import('../src/lib/i18n/american-english');
const { LanguageProvider, LanguageSwitcher } = await import('../src/components/language');

const settle = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const wait = async (check: () => boolean, ms = 3000) => { const end = Date.now() + ms; while (!check()) { if (Date.now() > end) assert.fail('timed out'); await settle(10); } };

// --- DomTranslator ---------------------------------------------------------------------------------------------------

function page(html: string) {
  document.body.innerHTML = html;
  document.title = 'Software Engineer';
  localStorage.clear();
}
const live: { stop(): void }[] = [];
afterEach(() => { while (live.length) live.pop()!.stop(); });
const track = <T extends { stop(): void }>(t: T): T => (live.push(t), t);
const hooks = () => { const log = { busy: [] as boolean[], errors: [] as string[] }; return { log, hooks: { onBusy: (b: boolean) => log.busy.push(b), onError: (e: string) => { log.errors.push(e); } } }; };
const fr = (_t: string, texts: string[]) => Promise.resolve(texts.map((t) => `[fr] ${t}`));

test('translates text nodes and accessible attributes in place, keeps whitespace and skips protected content', async () => {
  page(`<main><h1>  Software Engineer </h1><p>Email me@example.com or call 2026</p><code>npm install</code>
    <p translate="no">Dominic</p><div data-no-translate>Skip me</div><button aria-label="Open menu" title="Menu">Go</button>
    <input placeholder="Your name"><img alt="Portrait"><textarea>draft</textarea><svg><text>Chart</text></svg></main>`);
  const h1 = document.querySelector('h1')!;
  const textNode = h1.firstChild!;
  const { hooks: h } = hooks();
  const t = track(new DomTranslator(fr, h));
  t.setMode({ target: 'fr' });
  await wait(() => h1.textContent!.includes('[fr]'));
  assert.equal(h1.textContent, '  [fr] Software Engineer ');
  assert.equal(h1.firstChild, textNode, 'the same text node is reused, so React keeps working');
  const q = (s: string) => document.querySelector(s)!;
  assert.equal(q('button').getAttribute('aria-label'), '[fr] Open menu');
  assert.equal(q('button').getAttribute('title'), '[fr] Menu');
  assert.equal(q('input').getAttribute('placeholder'), '[fr] Your name');
  assert.equal(q('img').getAttribute('alt'), '[fr] Portrait');
  assert.equal(q('code').textContent, 'npm install');
  assert.equal(q('[translate="no"]').textContent, 'Dominic');
  assert.equal(q('[data-no-translate]').textContent, 'Skip me');
  assert.equal(q('textarea').textContent, 'draft');
  assert.equal(q('svg text').textContent, 'Chart');
  assert.match(q('main > p').textContent!, /\[fr\] Email me@example.com or call 2026/);
  t.stop();
});

test('the page title is translated and restored too', async () => {
  page('<p>Hello</p>');
  const t = track(new DomTranslator(fr, hooks().hooks));
  t.setMode({ target: 'fr' });
  await wait(() => document.title.startsWith('[fr]'));
  t.setMode({ target: null });
  assert.equal(document.title, 'Software Engineer');
  t.stop();
});

test('English restores the exact original, even after several languages', async () => {
  page('<p> Hello world </p><button aria-label="Close">x</button>');
  const t = track(new DomTranslator((target, texts) => Promise.resolve(texts.map((x) => `[${target}] ${x}`)), hooks().hooks));
  t.setMode({ target: 'fr' });
  await wait(() => document.querySelector('p')!.textContent!.includes('[fr]'));
  t.setMode({ target: 'de' });
  await wait(() => document.querySelector('p')!.textContent!.includes('[de]'));
  assert.equal(document.querySelector('p')!.textContent, ' [de] Hello world ');
  t.setMode({ target: null });
  assert.equal(document.querySelector('p')!.textContent, ' Hello world ');
  assert.equal(document.querySelector('button')!.getAttribute('aria-label'), 'Close');
  t.stop();
});

test('new and changed content is translated without a reload', async () => {
  page('<div id="app"><p>First</p></div>');
  const t = track(new DomTranslator(fr, hooks().hooks));
  t.setMode({ target: 'fr' });
  await wait(() => document.querySelector('p')!.textContent === '[fr] First');
  const added = document.createElement('p');
  added.textContent = 'Added later';
  document.getElementById('app')!.append(added);
  await wait(() => added.textContent === '[fr] Added later');
  // React updating an already translated node supplies new English, which is translated again.
  document.querySelector('p')!.firstChild!.nodeValue = 'Updated copy';
  await wait(() => document.querySelector('p')!.textContent === '[fr] Updated copy');
  t.stop();
});

test('batches unique strings and serves repeats from the cache without asking again', async () => {
  page('<p>Same text</p><p>Same text</p><p>Other text</p>');
  const requests: string[][] = [];
  const t = track(new DomTranslator((_x, texts) => { requests.push(texts); return fr(_x, texts); }, hooks().hooks));
  t.setMode({ target: 'fr' });
  await wait(() => [...document.querySelectorAll('p')].every((p) => p.textContent!.startsWith('[fr]')));
  assert.deepEqual(requests, [['Same text', 'Other text', 'Software Engineer']], 'one batch, deduplicated, title included');
  t.setMode({ target: null });
  t.setMode({ target: 'fr' });
  await settle(50);
  assert.equal(requests.length, 1, 'switching back uses the in-browser cache');
  t.stop();
  // A new session (page reload) reads the persisted cache.
  await settle(600);
  page('<p>Same text</p>');
  localStorage.setItem('portfolio-translations:1:fr', JSON.stringify({ 'Same text': 'Même texte' }));
  const t2 = track(new DomTranslator(() => Promise.reject(new Error('should not be called')), hooks().hooks));
  t2.setMode({ target: 'fr' });
  assert.equal(document.querySelector('p')!.textContent, 'Même texte');
  t2.stop();
});

test('a failing API leaves English in place and reports once', async () => {
  page('<p>Hello there</p><p>Another line</p>');
  const { log, hooks: h } = hooks();
  let calls = 0;
  const t = track(new DomTranslator(() => { calls++; return Promise.reject(new Error('not_configured')); }, h));
  t.setMode({ target: 'fr' });
  await wait(() => log.errors.length > 0);
  assert.deepEqual(log.errors, ['not_configured']);
  assert.equal(document.body.textContent, 'Hello thereAnother line');
  const extra = document.createElement('p');
  extra.textContent = 'More text';
  document.body.append(extra);
  await settle(400);
  assert.equal(calls, 1, 'does not hammer a failing API');
  assert.equal(log.errors.length, 1);
  t.stop();
});

test('English (US) respells without any network request', () => {
  page('<p>Our colour organisation</p>');
  const t = track(new DomTranslator(() => Promise.reject(new Error('no network')), hooks().hooks));
  t.setMode({ target: null, transform: americanise });
  assert.equal(document.querySelector('p')!.textContent, 'Our color organization');
  t.setMode({ target: null });
  assert.equal(document.querySelector('p')!.textContent, 'Our colour organisation');
  t.stop();
});

// --- the switcher UI ---------------------------------------------------------------------------------------------------

const SUPPORTED = [
  { code: 'ar', name: 'Arabic' }, { code: 'fr', name: 'French' }, { code: 'sw', name: 'Swahili' }, { code: 'th', name: 'Thai' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'ms', name: 'Malay' }, { code: 'ta', name: 'Tamil' },
];
let translateCalls = 0;
let failTranslate = false;
let failList = false;
let fetchedLists = 0;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.endsWith('/api/translate/languages')) {
    fetchedLists++;
    if (failList) return Response.json({ error: 'x' }, { status: 500 });
    return Response.json({ languages: SUPPORTED, source: 'google' });
  }
  if (failTranslate) return Response.json({ error: 'not_configured' }, { status: 503 });
  translateCalls++;
  const { target, texts } = JSON.parse(String(init?.body)) as { target: string; texts: string[] };
  return Response.json({ translations: texts.map((t) => `[${target}] ${t}`) });
}) as typeof fetch;

const app = () => render(createElement(LanguageProvider, null, createElement('main', null, createElement('h1', null, 'Software Engineer'), createElement(LanguageSwitcher))));

const trigger = () => screen.getByRole('button', { name: /Select language/ });
const openPopup = async () => {
  await act(async () => { fireEvent.click(trigger()); });
  return screen.getByRole('dialog', { name: /Select Language/ });
};
const pick = (dialog: HTMLElement, english: string) => {
  const item = [...dialog.querySelectorAll('.lang-item')].find((b) => b.querySelector('.lang-item__english')?.textContent === english || b.querySelector('.lang-item__native')?.textContent === english);
  assert.ok(item, `${english} is listed`);
  fireEvent.click(item!);
};

test('closed: exactly one circular flag button showing English (UK); no permanent list', () => {
  cleanup(); localStorage.clear();
  app();
  assert.equal(screen.getAllByRole('button').filter((b) => b.classList.contains('lang-btn')).length, 1);
  assert.equal(screen.queryByRole('navigation', { name: 'Language' }), null);
  const btn = trigger();
  assert.ok(btn.querySelector('.fi-gb'));
  assert.equal(btn.getAttribute('aria-expanded'), 'false');
  assert.match(btn.textContent!, /English \(UK\)/);
});

test('the popup has a heading, a search field with the right placeholder, and A–Z options with a checkmark', async () => {
  cleanup(); localStorage.clear();
  app();
  const dialog = await openPopup();
  assert.equal(trigger().getAttribute('aria-expanded'), 'true');
  assert.equal(within(dialog).getByRole('heading', { name: 'Select Language' }).textContent, 'Select Language');
  assert.equal(within(dialog).getByRole('searchbox', { name: 'Search languages' }).getAttribute('placeholder'), 'Search languages...');
  await waitFor(() => assert.ok(!dialog.textContent!.includes('German')), { timeout: 3000 }); // live list replaced the catalogue
  const items = [...dialog.querySelectorAll('.lang-item')].map((b) => b.querySelector('.lang-item__english')?.textContent ?? b.textContent ?? '');
  assert.ok(items.indexOf('Arabic') < items.indexOf('French') && items.indexOf('French') < items.indexOf('Swahili'), 'A–Z order');
  assert.ok(dialog.querySelectorAll('.lang-flag--globe').length > 0, 'a globe stands in where no single flag fits');
  assert.ok(!items.includes('German'), 'unsupported languages are not offered');
  const current = dialog.querySelector('.lang-item[aria-current="true"]')!;
  assert.ok(current.querySelector('.lang-item__check'), 'checkmark beside the current language');
  assert.ok(current.querySelector('.fi-gb'));
});

test('choosing a language translates in place, updates the flag, closes the popup, persists and announces', async () => {
  cleanup(); localStorage.clear(); translateCalls = 0; failTranslate = false;
  app();
  const dialog = await openPopup();
  await waitFor(() => assert.ok(dialog.textContent!.includes('Swahili')));
  pick(dialog, 'French');
  await waitFor(() => assert.equal(screen.getByRole('heading', { level: 1 }).textContent, '[fr] Software Engineer'));
  assert.equal(document.documentElement.lang, 'fr');
  assert.equal(document.documentElement.getAttribute('dir'), null);
  assert.equal(trigger().getAttribute('aria-expanded'), 'false', 'popup closed');
  assert.ok(trigger().querySelector('.fi-fr'), 'flag updated');
  assert.equal(JSON.parse(localStorage.getItem('portfolio-language')!).id, 'fr');
  await waitFor(() => assert.match(document.querySelector('[role="status"][aria-live]')!.textContent!, /translated to French/));
  assert.equal(translateCalls > 0, true);
});

test('search filters, RTL languages set dir, and English (UK) restores the source copy', async () => {
  cleanup(); localStorage.clear();
  app();
  let dialog = await openPopup();
  await waitFor(() => assert.ok(dialog.textContent!.includes('Swahili')));
  const search = within(dialog).getByRole('searchbox', { name: 'Search languages' });
  fireEvent.change(search, { target: { value: 'arab' } });
  assert.equal(dialog.querySelectorAll('.lang-item').length, 1);
  fireEvent.keyDown(search, { key: 'ArrowDown' });
  assert.ok(document.activeElement === dialog.querySelector('.lang-item'), 'focus moved to the first result');
  fireEvent.click(dialog.querySelector('.lang-item')!);
  await waitFor(() => assert.equal(screen.getByRole('heading', { level: 1 }).textContent, '[ar] Software Engineer'));
  assert.equal(document.documentElement.getAttribute('dir'), 'rtl');
  assert.equal(document.documentElement.lang, 'ar');

  dialog = await openPopup();
  pick(dialog, 'English (UK)');
  await waitFor(() => assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Software Engineer'));
  assert.equal(document.documentElement.getAttribute('dir'), null);
  assert.equal(document.documentElement.lang, 'en-GB');
  assert.equal(localStorage.getItem('portfolio-language'), null);
  assert.ok(trigger().querySelector('.fi-gb'));
});

test('Escape and an outside click close the popup; Escape returns focus to the button', async () => {
  cleanup(); localStorage.clear();
  app();
  await openPopup();
  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(trigger().getAttribute('aria-expanded'), 'false');
  assert.ok(document.activeElement === trigger(), 'focus returned to the button');
  await openPopup();
  fireEvent.pointerDown(document.body);
  assert.equal(trigger().getAttribute('aria-expanded'), 'false');
});

test('Singapore languages are offered separately with the Singapore flag', async () => {
  cleanup(); localStorage.clear();
  app();
  const dialog = await openPopup();
  await waitFor(() => assert.ok(dialog.textContent!.includes('Tamil (Singapore)')));
  for (const name of ['Chinese (Singapore)', 'Malay (Singapore)', 'Tamil (Singapore)', 'English (Singapore)']) {
    const item = [...dialog.querySelectorAll('.lang-item')].find((b) => b.textContent!.includes(name));
    assert.ok(item?.querySelector('.fi-sg'), name);
  }
});

test('when translation is unavailable the page stays English and the visitor is told', async () => {
  cleanup(); localStorage.clear(); failTranslate = true;
  app();
  const dialog = await openPopup();
  await waitFor(() => assert.ok(dialog.textContent!.includes('Swahili')));
  pick(dialog, 'French');
  await waitFor(() => assert.match(document.querySelector('[role="status"][aria-live]')!.textContent!, /not set up/));
  assert.ok(screen.getAllByText(/Translation is not set up yet/).length > 0, 'the visitor sees why');
  assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Software Engineer');
  failTranslate = false;
});

test('a failed language-list request keeps the full built-in catalogue, not English only', async () => {
  cleanup(); localStorage.clear(); failList = true;
  app();
  const dialog = await openPopup();
  await waitFor(() => assert.match(dialog.textContent!, /standard list/));
  const names = [...dialog.querySelectorAll('.lang-item')].map((b) => b.textContent ?? '');
  for (const n of ['French', 'Spanish', 'German', 'Thai', 'Japanese', 'Hindi', 'Arabic', 'Dutch']) {
    assert.ok(names.some((t) => t.includes(n)), `${n} is offered`);
  }
  assert.ok(names.length > 100);
  assert.equal(localStorage.getItem('portfolio-language-list'), null, 'a fallback is never cached as the live list');
  fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'japan' } });
  assert.equal(dialog.querySelectorAll('.lang-item').length, 1);
  failList = false;
});

test('a successful list is cached, and a fresh cache is shown without another request', async () => {
  cleanup(); localStorage.clear(); failList = false;
  app();
  const dialog = await openPopup();
  await waitFor(() => assert.ok(localStorage.getItem('portfolio-language-list')));
  cleanup();
  const before = fetchedLists;
  app();
  const again = await openPopup();
  await waitFor(() => assert.ok(again.textContent!.includes('Swahili')));
  assert.equal(fetchedLists, before, 'no revalidation while the cache is fresh');
  assert.ok(!again.textContent!.includes('Zulu'), 'the cached live list is used, not the catalogue');
  void dialog;
});
