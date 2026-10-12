// Translates the rendered page in place, without touching React's tree: it rewrites the value of existing text
// nodes and a few attributes (aria-label, title, placeholder, alt), remembers the English original of everything
// it changes, and restores it on demand. New or changed content is picked up by a MutationObserver.
import { loadCache, saveCache } from './client-cache';
import { isTranslatable } from './translatable';

export type Fetcher = (target: string, texts: string[]) => Promise<string[]>;
export type Mode = { target: string | null; transform?: (text: string) => string };
export type Hooks = { onBusy: (busy: boolean) => void; onError: (code: string) => void };

const ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt'] as const;
/** Never translated: opted-out content, code, form fields, graphics and embeds. */
const SKIP = '[translate="no"],.notranslate,[data-no-translate],[contenteditable=""],[contenteditable="true"],script,style,noscript,code,pre,kbd,samp,textarea,svg,canvas,template,iframe,object,.encrypted-text__live,.encrypted-text__ghost';

const CHUNK_ITEMS = 60;
const CHUNK_CHARS = 6000;
const WORKERS = 2;
const DEBOUNCE_MS = 200;
const RETRY_AFTER_ERROR_MS = 30_000;
const MAX_WAIT_MS = 1200;

type State = { original: string; applied: string };
type Ref =
  | { kind: 'text'; node: Text }
  | { kind: 'attr'; el: Element; name: string }
  | { kind: 'title' };
type Item = Ref & { original: string; seen: string };

const edges = (s: string): [string, string] => [s.match(/^\s*/)?.[0] ?? '', s.match(/\s*$/)?.[0] ?? ''];

export class DomTranslator {
  private mode: Mode = { target: null };
  private gen = 0;
  private cache = new Map<string, string>();
  /** One in-memory cache per language, so switching back and forth never asks twice. */
  private readonly caches = new Map<string, Map<string, string>>();
  private readonly textState = new WeakMap<Text, State>();
  private readonly attrState = new WeakMap<Element, Map<string, State>>();
  private titleState: State | null = null;

  private waiting = new Map<string, Item[]>();
  private queue: string[] = [];
  private workers = 0;
  private blockedUntil = 0;
  private reported = false;

  private roots = new Set<Node>();
  private firstQueuedAt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private observer: MutationObserver | undefined;

  constructor(private readonly fetcher: Fetcher, private readonly hooks: Hooks) {}

  /** Switches language. Existing text keeps its current language until the new one is ready, so nothing flashes. */
  setMode(mode: Mode): void {
    this.mode = mode;
    this.gen++;
    this.waiting.clear();
    this.queue = [];
    this.blockedUntil = 0;
    this.reported = false;
    if (mode.target && !this.caches.has(mode.target)) this.caches.set(mode.target, loadCache(mode.target));
    this.cache = (mode.target && this.caches.get(mode.target)) || new Map();
    this.hooks.onBusy(false);
    this.observe();
    this.scanAll();
  }

  /** Stops watching the page (used on admin pages and on unmount). setMode() starts it again. */
  stop(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    clearTimeout(this.timer);
    clearTimeout(this.saveTimer);
    this.roots.clear();
    this.firstQueuedAt = 0;
    this.waiting.clear();
    this.queue = [];
    this.gen++;
    this.hooks.onBusy(false);
  }

  // --- scanning ------------------------------------------------------------------------------------------

  private scanAll(): void {
    this.scan([document.body, document.head]);
  }

  /** Collects everything under the given roots (the head stands for the page title) and resolves it in one pass, so it batches. */
  private scan(roots: Iterable<Node>): void {
    const items: Item[] = [];
    for (const root of roots) {
      if (root === document.head) items.push(this.sourceOf({ kind: 'title' }));
      else if (root.isConnected) this.collect(root, items);
    }
    this.resolve(items);
  }

  private collect(root: Node, out: Item[]): void {
    if (root.nodeType === Node.TEXT_NODE) {
      if (!root.parentElement?.closest(SKIP)) out.push(this.sourceOf({ kind: 'text', node: root as Text }));
      return;
    }
    if (!(root instanceof Element) || root.closest(SKIP)) return;
    this.collectAttributes(root, out);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) out.push(this.sourceOf({ kind: 'text', node: n as Text }));
      else this.collectAttributes(n as Element, out);
    }
  }

  private collectAttributes(el: Element, out: Item[]): void {
    for (const name of ATTRIBUTES) if (el.hasAttribute(name)) out.push(this.sourceOf({ kind: 'attr', el, name }));
  }

  // --- reading and writing the DOM -----------------------------------------------------------------------

  private read(ref: Ref): string {
    return ref.kind === 'text' ? ref.node.nodeValue ?? '' : ref.kind === 'attr' ? ref.el.getAttribute(ref.name) ?? '' : document.title;
  }

  private getState(ref: Ref): State | undefined {
    return ref.kind === 'text' ? this.textState.get(ref.node) : ref.kind === 'attr' ? this.attrState.get(ref.el)?.get(ref.name) : this.titleState ?? undefined;
  }

  private setState(ref: Ref, state: State | null): void {
    if (ref.kind === 'text') {
      if (state) this.textState.set(ref.node, state); else this.textState.delete(ref.node);
    } else if (ref.kind === 'attr') {
      let m = this.attrState.get(ref.el);
      if (!m) this.attrState.set(ref.el, (m = new Map()));
      if (state) m.set(ref.name, state); else m.delete(ref.name);
    } else {
      this.titleState = state;
    }
  }

  /** The English source of what is in the DOM now: our remembered original, unless someone else changed it since. */
  private sourceOf(ref: Ref): Item {
    const seen = this.read(ref);
    const state = this.getState(ref);
    if (state && seen === state.applied) return { ...ref, original: state.original, seen };
    if (state) this.setState(ref, null);
    return { ...ref, original: seen, seen };
  }

  private write(item: Item, core: string): void {
    if (this.read(item) !== item.seen) return; // changed while we were waiting: it will be scanned again
    const [lead, trail] = edges(item.original);
    const next = lead + core + trail;
    if (next !== item.seen) {
      if (item.kind === 'text') item.node.nodeValue = next;
      else if (item.kind === 'attr') item.el.setAttribute(item.name, next);
      else document.title = next;
    }
    this.setState(item, next === item.original ? null : { original: item.original, applied: next });
  }

  // --- resolving and fetching ----------------------------------------------------------------------------

  private resolve(items: Item[]): void {
    const { target, transform } = this.mode;
    let queued = false;
    for (const item of items) {
      const core = item.original.trim();
      if (!isTranslatable(core)) continue;
      if (!target) { this.write(item, transform ? transform(core) : core); continue; }
      const hit = this.cache.get(core);
      if (hit !== undefined) { this.write(item, hit); continue; }
      const list = this.waiting.get(core);
      if (list) list.push(item);
      else { this.waiting.set(core, [item]); this.queue.push(core); queued = true; }
    }
    if (queued || this.queue.length) this.pump();
  }

  private pump(): void {
    if (Date.now() < this.blockedUntil) { this.waiting.clear(); this.queue = []; return; }
    while (this.workers < WORKERS && this.queue.length) {
      this.workers++;
      this.hooks.onBusy(true);
      void this.work(this.gen).finally(() => {
        this.workers--;
        if (this.queue.length) this.pump();
        else if (this.workers === 0) this.hooks.onBusy(false);
      });
    }
  }

  private async work(gen: number): Promise<void> {
    const target = this.mode.target;
    if (!target) return;
    const texts: string[] = [];
    let chars = 0;
    while (this.queue.length && texts.length < CHUNK_ITEMS && (texts.length === 0 || chars + this.queue[0].length <= CHUNK_CHARS)) {
      const text = this.queue.shift() as string;
      texts.push(text);
      chars += text.length;
    }
    if (!texts.length) return;
    try {
      const out = await this.fetcher(target, texts);
      if (gen !== this.gen) return;
      texts.forEach((text, i) => {
        const translated = typeof out[i] === 'string' && out[i] ? out[i] : text;
        this.cache.set(text, translated);
        for (const item of this.waiting.get(text) ?? []) this.write(item, translated);
        this.waiting.delete(text);
      });
      this.persist(target);
    } catch (error) {
      if (gen !== this.gen) return;
      // Leave the English text in place and stop asking for a while, so a failing API is not hammered.
      this.waiting.clear();
      this.queue = [];
      this.blockedUntil = Date.now() + RETRY_AFTER_ERROR_MS;
      if (!this.reported) { this.reported = true; this.hooks.onError(error instanceof Error ? error.message : 'translation_failed'); }
    }
  }

  private persist(target: string): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => saveCache(target, this.caches.get(target) ?? new Map()), 500);
  }

  // --- watching for changes ------------------------------------------------------------------------------

  private observe(): void {
    if (this.observer) return;
    this.observer = new MutationObserver((records) => {
      let titleChanged = false;
      for (const r of records) {
        if (document.head.contains(r.target)) { titleChanged = true; continue; }
        if (r.type === 'characterData') {
          const state = this.textState.get(r.target as Text);
          if (state && (r.target as Text).nodeValue === state.applied) continue; // our own write
          this.roots.add(r.target);
        } else if (r.type === 'attributes') {
          const el = r.target as Element;
          const state = this.attrState.get(el)?.get(r.attributeName ?? '');
          if (state && el.getAttribute(r.attributeName ?? '') === state.applied) continue;
          this.roots.add(el);
        } else {
          r.addedNodes.forEach((n) => this.roots.add(n));
        }
      }
      if (titleChanged) this.roots.add(document.head);
      if (this.roots.size) {
        // Wait for bursts (animations, route changes) to settle, but never starve translation for long.
        const now = Date.now();
        if (!this.firstQueuedAt) this.firstQueuedAt = now;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), Math.max(0, Math.min(DEBOUNCE_MS, this.firstQueuedAt + MAX_WAIT_MS - now)));
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTES] });
    this.observer.observe(document.head, { childList: true, subtree: true, characterData: true });
  }

  private flush(): void {
    const roots = [...this.roots];
    this.roots.clear();
    this.firstQueuedAt = 0;
    this.scan(roots);
  }
}
