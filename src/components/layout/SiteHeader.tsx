'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { media, navItems, type NavItem } from '@/config';
import { useActiveSection, useMediaQuery } from '@/composables';
import { scrollToSection, scrollToTop } from '@/lib';
import { RubberSegment } from '@/components/ui';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = navItems.map((item) => ({ value: item, label: item }));

/**
 * Desktop: the horizontal nav pill, a RubberSegment whose thumb follows the current section. Tablet, phone and dual-screen widths: a menu button that
 * opens the same links in a dropdown panel under the header. CSS decides which one shows, so
 * only one is ever rendered visibly (and the other is display:none, out of the a11y tree).
 */
export default function SiteHeader() {
  const active = useActiveSection(navItems, 'About');
  const [open, setOpen] = useState(false);
  const panelId = 'site-menu';
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Same condition as the CSS that swaps the nav pill for the menu button.
  const compact = useMediaQuery(`${media.tablet}, ${media.dualScreen}`);

  // After a click the thumb goes straight to the chosen item and stays there while the page
  // scrolls past the sections in between; scroll tracking takes over again once it arrives.
  const [target, setTarget] = useState<NavItem | null>(null);
  useEffect(() => {
    if (!target) return;
    if (active === target) { setTarget(null); return; }
    const t = window.setTimeout(() => setTarget(null), 1500);
    return () => window.clearTimeout(t);
  }, [active, target]);
  const selectDesktop = (value: string) => {
    const item = value as NavItem;
    setTarget(item);
    scrollToSection(item);
  };

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Back to desktop width: the menu no longer exists there.
  useEffect(() => { if (!compact) setOpen(false); }, [compact]);

  useEffect(() => {
    if (!open) return;
    // Focus the current section's link (or the first), so keyboard users start inside the menu.
    const links = panelRef.current?.querySelectorAll<HTMLButtonElement>('button');
    (panelRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]') ?? links?.[0])?.focus();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !toggleRef.current?.contains(t)) close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  const go = (item: NavItem) => {
    setOpen(false);
    scrollToSection(item);
    // Move keyboard focus to the section too, so the next Tab continues from there.
    const section = document.getElementById(item.toLowerCase());
    if (section) {
      if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
    }
  };

  return (
    <header className="site-header">
      <button className="brand" onClick={scrollToTop} aria-label="Back to top">
        <span>DO</span><b>DOMINIC</b>
      </button>

      <div className="site-header__end">
        <nav className="nav-pill" aria-label="Primary navigation">
          <RubberSegment items={NAV_ITEMS} value={target ?? active} onSelect={selectDesktop} />
        </nav>

        <ThemeToggle />

        <div className="mnav">
          <button
            ref={toggleRef}
            type="button"
            className="mnav-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="mnav-icon" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <div ref={panelRef} id={panelId} className={`mnav-panel${open ? ' is-open' : ''}`} inert={!open}>
            <nav aria-label="Primary navigation">
              <ul>
                {navItems.map(item => (
                  <li key={item}>
                    <button
                      type="button"
                      className={active === item ? 'active' : ''}
                      aria-current={active === item ? 'true' : undefined}
                      onClick={() => go(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
