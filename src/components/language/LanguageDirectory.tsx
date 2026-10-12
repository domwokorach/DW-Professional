'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { groupByInitial, searchLanguages, type LanguageOption } from '@/lib/i18n/languages';
import LanguageFlag from './LanguageFlag';
import { useLanguage } from './LanguageProvider';

type Props = { id: string; open: boolean; onSelect: () => void };

/** The A–Z directory: a fixed header (title, search) above an independently scrolling list. */
export default function LanguageDirectory({ id, open, onSelect }: Props) {
  const { current, setLanguage, directory, directoryStatus, status, notice } = useLanguage();
  const [query, setQuery] = useState('');
  const [rendered, setRendered] = useState(false); // build the long list only once it has been opened
  const panel = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setRendered(true);
    // Focus the search box where a physical keyboard is likely; on touch screens keep the keyboard closed.
    if (window.matchMedia('(pointer: fine)').matches) search.current?.focus({ preventScroll: true });
    else panel.current?.focus({ preventScroll: true });
  }, [open]);

  const results = useMemo(() => searchLanguages(directory, query), [directory, query]);
  const groups = useMemo(() => groupByInitial(results), [results]);

  const choose = (language: LanguageOption) => { setLanguage(language); onSelect(); };

  const move = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const stops: HTMLElement[] = [...(search.current ? [search.current] : []), ...(panel.current?.querySelectorAll<HTMLElement>('.lang-item') ?? [])];
    const at = stops.indexOf(event.target as HTMLElement);
    if (at < 0) return;
    event.preventDefault();
    stops[Math.min(stops.length - 1, Math.max(0, at + (event.key === 'ArrowDown' ? 1 : -1)))].focus();
  };

  const count = query.trim()
    ? results.length ? `${results.length} ${results.length === 1 ? 'language matches' : 'languages match'}` : 'No languages match your search.'
    : `${results.length} languages, A to Z`;

  return (
    <section
      ref={panel}
      id={id}
      className="lang-panel"
      role="dialog"
      aria-labelledby={`${id}-title`}
      aria-busy={status === 'loading'}
      tabIndex={-1}
      onKeyDown={move}
    >
      <header className="lang-panel__head">
        <h2 id={`${id}-title`} className="lang-panel__title">Select Language</h2>
        <label htmlFor={`${id}-search`} className="sr-only">Search languages</label>
        <input
          ref={search}
          id={`${id}-search`}
          className="lang-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery(''); } }}
          placeholder="Search languages..."
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        <p className="lang-panel__meta" role="status">
          {directoryStatus === 'fallback' ? `${count} · standard list, updating when available` : count}
        </p>
        {notice && <p className="lang-panel__notice">{notice}</p>}
      </header>

      <div className="lang-panel__scroll">
        {rendered && (
          <ul className="lang-groups">
            {groups.map(({ letter, items }) => (
              <li key={letter} className="lang-group">
                <h3 className="lang-letter" aria-label={letter === '#' ? 'Other' : `Languages starting with ${letter}`}>{letter}</h3>
                <ul>
                  {items.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="lang-item" aria-current={l.id === current.id ? 'true' : undefined} translate="no" onClick={() => choose(l)}>
                        <LanguageFlag flag={l.flag} />
                        <span className="lang-item__names">
                          <span className="lang-item__native" lang={l.htmlLang}>{l.native}</span>
                          {l.native !== l.english && <span className="lang-item__english" lang="en">{l.english}</span>}
                        </span>
                        {l.id === current.id && (
                          <svg className="lang-item__check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
