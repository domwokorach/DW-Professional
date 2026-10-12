'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LANGUAGE_CATALOGUE } from '@/lib/i18n/language-catalogue';
import { americanise } from '@/lib/i18n/american-english';
import { DomTranslator, type Mode } from '@/lib/i18n/dom-translator';
import {
  buildDirectory,
  DEFAULT_LANGUAGE,
  LANGUAGE_KEY,
  LANGUAGE_LIST_KEY,
  LANGUAGE_LIST_TTL_MS,
  parseStoredList,
  parseStoredLanguage,
  RAIL_LANGUAGES,
  type LanguageOption,
  type SupportedLanguage,
} from '@/lib/i18n/languages';

export type Status = 'idle' | 'loading' | 'error';
/** live: current list from Google; fallback: cached or built-in catalogue while the live list is unavailable. */
export type DirectoryStatus = 'loading' | 'live' | 'fallback';

type LanguageContextValue = {
  current: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  /** Back to the source copy, English (UK). */
  reset: () => void;
  status: Status;
  /** Visible explanation when translation could not be completed. */
  notice: string | null;
  /** Polite live-region text announcing changes. */
  announcement: string;
  /** Default rail options, minus any the translation API does not support. */
  rail: readonly LanguageOption[];
  directory: readonly LanguageOption[];
  directoryStatus: DirectoryStatus;
  /** False on pages where translation is switched off (the admin area). */
  enabled: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return value;
}

const REASONS: Record<string, string> = {
  not_configured: 'Translation is not set up yet',
  budget_exceeded: 'Translation is busy right now',
  rate_limited: 'Translation is busy right now',
};
const FALLBACK_REASON = 'Translation is unavailable right now';
const failureNotice = (code: string, stays: LanguageOption) => `${REASONS[code] ?? FALLBACK_REASON}, so the page stays in ${stays.english}.`;

async function fetchTranslations(target: string, texts: string[]): Promise<string[]> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, texts }),
  });
  const body: unknown = await response.json().catch(() => null);
  const record = (body ?? {}) as { translations?: unknown; error?: unknown };
  if (!response.ok) throw new Error(typeof record.error === 'string' ? record.error : 'translation_failed');
  if (!Array.isArray(record.translations) || record.translations.length !== texts.length) throw new Error('translation_failed');
  return record.translations.map((t) => (typeof t === 'string' ? t : ''));
}

const modeFor = (language: LanguageOption): Mode =>
  language.target ? { target: language.target } : { target: null, transform: language.id === 'en-US' ? americanise : undefined };

const whenIdle = (fn: () => void) => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 300);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const enabled = !pathname.startsWith('/admin');

  const [current, setCurrent] = useState<LanguageOption>(DEFAULT_LANGUAGE);
  // Translation waits until the page has hydrated, so rewriting text can't collide with React.
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  // Until the live list arrives the directory uses the cached list, else the validated local catalogue.
  const [supported, setSupported] = useState<SupportedLanguage[]>(() => [...LANGUAGE_CATALOGUE]);
  const [directoryStatus, setDirectoryStatus] = useState<DirectoryStatus>('loading');

  const translator = useRef<DomTranslator | null>(null);
  const requested = useRef(false);
  const currentRef = useRef(current);
  currentRef.current = current;
  // The last language that was actually applied to the page. The flag, <html lang> and the saved choice follow this,
  // so a failed translation never leaves them claiming a language the page is not in.
  const appliedRef = useRef<LanguageOption>(DEFAULT_LANGUAGE);
  const reverting = useRef(false);

  // Restore the saved choice, then wait for the page to finish loading before touching the DOM.
  useEffect(() => {
    try {
      const stored = parseStoredLanguage(window.localStorage.getItem(LANGUAGE_KEY));
      if (stored && stored.id !== DEFAULT_LANGUAGE.id) setCurrent(stored);
    } catch {
      // Storage blocked: start in English (UK).
    }
    const start = () => whenIdle(() => setReady(true));
    if (document.readyState === 'complete') start();
    else {
      window.addEventListener('load', start, { once: true });
      return () => window.removeEventListener('load', start);
    }
  }, []);

  // The list of languages Google can translate into: show the cached list at once, revalidate when it is a day old.
  // A failed request keeps whatever list is already showing; it never collapses the directory.
  useEffect(() => {
    if (!enabled || requested.current) return;
    let cachedAt = 0;
    try {
      const cached = parseStoredList(window.localStorage.getItem(LANGUAGE_LIST_KEY));
      if (cached) { cachedAt = cached.at; setSupported(cached.languages); setDirectoryStatus('live'); }
    } catch {
      // Storage blocked: the built-in catalogue is used.
    }
    if (!ready) return;
    requested.current = true;
    if (cachedAt && Date.now() - cachedAt < LANGUAGE_LIST_TTL_MS) return;
    const controller = new AbortController();
    fetch('/api/translate/languages', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('unavailable'))))
      .then((body: { languages?: SupportedLanguage[]; source?: string }) => {
        if (!Array.isArray(body.languages)) throw new Error('unavailable');
        const languages = body.languages.filter((l) => typeof l?.code === 'string' && typeof l?.name === 'string');
        if (!languages.length) throw new Error('unavailable');
        setSupported(languages);
        if (body.source === 'google') {
          setDirectoryStatus('live');
          try { window.localStorage.setItem(LANGUAGE_LIST_KEY, JSON.stringify({ at: Date.now(), languages })); } catch { /* storage blocked */ }
        } else {
          setDirectoryStatus((s) => (s === 'live' ? s : 'fallback'));
        }
      })
      .catch(() => { if (!controller.signal.aborted) setDirectoryStatus((s) => (s === 'live' ? s : 'fallback')); });
    return () => { controller.abort(); requested.current = false; };
  }, [ready, enabled]);

  // Apply the language: <html lang/dir>, then translate (or restore) the page.
  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const active = enabled ? current : DEFAULT_LANGUAGE;
    root.lang = active.htmlLang;
    if (active.dir === 'rtl') root.dir = 'rtl'; else root.removeAttribute('dir');

    if (!translator.current) {
      if (active.id === DEFAULT_LANGUAGE.id) return; // nothing to do yet: the page is already the English source
      translator.current = new DomTranslator(fetchTranslations, {
        onBusy: (busy) => setStatus((s) => (busy ? 'loading' : s === 'loading' ? 'idle' : s)),
        onError: (code) => {
          const stays = appliedRef.current;
          reverting.current = true;
          setStatus('error');
          setNotice(failureNotice(code, stays));
          setCurrent(stays);
          try {
            if (stays.id === DEFAULT_LANGUAGE.id) window.localStorage.removeItem(LANGUAGE_KEY);
            else window.localStorage.setItem(LANGUAGE_KEY, JSON.stringify(stays));
          } catch { /* storage blocked */ }
        },
      });
    }
    if (reverting.current) reverting.current = false; // keep the failure notice that triggered this revert
    else { setNotice(null); setStatus('idle'); }
    if (!current.target) appliedRef.current = current; // English variants need no request
    if (enabled) translator.current.setMode(modeFor(current)); else translator.current.stop();
  }, [current, ready, enabled]);

  useEffect(() => () => translator.current?.stop(), []);

  // Tell assistive technology about changes the visitor asked for, and about failures.
  const userChanged = useRef(false);
  const previousStatus = useRef<Status>('idle');
  useEffect(() => {
    if (!userChanged.current) return;
    setAnnouncement(current.target ? `Translating the page to ${current.english}…` : `Language set to ${current.english}.`);
  }, [current]);
  useEffect(() => {
    const before = previousStatus.current;
    previousStatus.current = status;
    if (status === 'error') setAnnouncement(notice ?? failureNotice('', DEFAULT_LANGUAGE));
    else if (before === 'loading' && status === 'idle' && currentRef.current.target) {
      appliedRef.current = currentRef.current;
    }
    if (status !== 'error' && before === 'loading' && status === 'idle' && userChanged.current && currentRef.current.target) {
      setAnnouncement(`The page is now translated to ${currentRef.current.english}.`);
    }
  }, [status, notice]);

  const setLanguage = useCallback((language: LanguageOption) => {
    userChanged.current = true;
    setReady(true);
    setCurrent(language);
    try {
      if (language.id === DEFAULT_LANGUAGE.id) window.localStorage.removeItem(LANGUAGE_KEY);
      else window.localStorage.setItem(LANGUAGE_KEY, JSON.stringify(language));
    } catch {
      // Storage blocked: the choice lasts for this page view.
    }
  }, []);

  const reset = useCallback(() => setLanguage(DEFAULT_LANGUAGE), [setLanguage]);

  const directory = useMemo(() => buildDirectory(supported ?? []), [supported]);
  const rail = useMemo(() => {
    const targets = new Set(supported.map((l) => l.code));
    return RAIL_LANGUAGES.filter((l) => !l.target || targets.has(l.target));
  }, [supported]);

  const value = useMemo<LanguageContextValue>(
    () => ({ current, setLanguage, reset, status, notice, announcement, rail, directory, directoryStatus, enabled }),
    [current, setLanguage, reset, status, notice, announcement, rail, directory, directoryStatus, enabled],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
