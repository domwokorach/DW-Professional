'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { MoonIcon } from '@/components/animate-ui/icons/moon';
import { SunIcon } from '@/components/animate-ui/icons/sun';
import { useIconTrigger } from '@/hooks/use-icon-trigger';
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
 * follows the system setting, live. The icon and label show the CURRENT theme (Moon + "Dark", Sun + "Light").
 * They are switched by CSS, so the markup is identical on server and client (the theme is only known in the
 * browser). The Animate UI icons animate on hover/focus of the whole button and play once when the theme
 * changes (not at all under reduced motion). The title (set after mount) says what pressing will do.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const reduce = useReducedMotion();
  const { active, bind } = useIconTrigger();
  // Plays the icons after each switch so the newly shown one animates in (the Sun's rays take ~1.7s).
  const [switched, setSwitched] = useState(false);
  const switchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(switchTimer.current), []);

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
    if (!reduce) {
      setSwitched(true);
      clearTimeout(switchTimer.current);
      switchTimer.current = setTimeout(() => setSwitched(false), 1700);
    }
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked: the choice still applies until the page is closed */
    }
  };

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      title={theme === null ? undefined : dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      {...bind}
    >
      <span className="sr-only theme-toggle__label theme-toggle__label--light">Light</span>
      <span className="sr-only theme-toggle__label theme-toggle__label--dark">Dark</span>
      <SunIcon className="theme-toggle__sun" size={20} strokeWidth={1.8} animate={switched || (active && !dark)} aria-hidden="true" focusable="false" />
      <MoonIcon className="theme-toggle__moon" size={20} strokeWidth={1.8} animate={switched || (active && dark)} aria-hidden="true" focusable="false" />
    </button>
  );
}
