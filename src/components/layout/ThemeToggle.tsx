'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY, type Theme } from '@/lib/theme';

const readSaved = (): Theme | null => {
  try {
    const v = window.localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
};

/**
 * Light/dark switch. The theme itself is applied by the inline script in <head> (before paint); this
 * button flips it and remembers the choice, but only once the visitor presses it. Until then the page
 * follows the system setting, live. Icons are switched by CSS, so the markup is identical on server and
 * client; `aria-pressed` is set after mount.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (readSaved()) return; // an explicit choice always wins
      const next: Theme = mq.matches ? 'dark' : 'light';
      root.dataset.theme = next;
      setTheme(next);
    };
    mq.addEventListener('change', onSystemChange);
    return () => mq.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: the choice still applies until the page is closed */
    }
  };

  return (
    <button type="button" className={`theme-toggle ${className}`.trim()} aria-pressed={theme === null ? undefined : theme === 'dark'} onClick={toggle}>
      <span className="sr-only">Dark mode</span>
      <svg className="theme-toggle__moon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <svg className="theme-toggle__sun" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
