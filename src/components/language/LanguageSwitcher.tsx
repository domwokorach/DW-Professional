'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LanguageDirectory from './LanguageDirectory';
import LanguageFlag from './LanguageFlag';
import { useLanguage } from './LanguageProvider';

const PANEL_ID = 'language-panel';

/**
 * One fixed circular flag button on the right edge. Clicking it opens the searchable A–Z popup;
 * choosing a language translates the page, updates the flag and closes the popup.
 */
export default function LanguageSwitcher() {
  const { current, status, notice, announcement, enabled } = useLanguage();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const dock = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const onPointer = (e: PointerEvent) => { if (!dock.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [open, close]);

  if (!enabled) return null;

  const busy = status === 'loading';
  const showNotice = !!notice && !open && dismissed !== notice;

  return (
    <div ref={dock} className="lang-dock" data-open={open} data-busy={busy}>
      <button
        ref={trigger}
        type="button"
        className="lang-btn lang-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((o) => !o)}
      >
        <LanguageFlag flag={current.flag} />
        {busy && <span className="lang-btn__spinner" aria-hidden="true" />}
        <span className="sr-only">Select language: </span>
        <span className="sr-only" translate="no">{current.english}</span>
      </button>

      <LanguageDirectory id={PANEL_ID} open={open} onSelect={() => close(true)} />

      {showNotice && (
        <p className="lang-notice">
          <span>{notice}</span>
          <button type="button" className="lang-notice__close" onClick={() => setDismissed(notice)}>
            <span aria-hidden="true">×</span>
            <span className="sr-only">Dismiss message</span>
          </button>
        </p>
      )}

      <div className="sr-only" role="status" aria-live="polite" translate="no">{announcement}</div>
    </div>
  );
}
