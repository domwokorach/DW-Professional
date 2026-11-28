'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { monthMarkers, toCells } from '@/lib/github/stats';
import type { ContributionCalendar as Calendar } from '@/lib/github/types';
import ContributionCell from './ContributionCell';
import ContributionTooltip, { type TooltipAnchor } from './ContributionTooltip';

const WEEKDAY_LABELS: [number, string][] = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']];

/**
 * The heatmap: one CSS grid (weekday labels | week columns), cells placed by week and weekday. One tab stop with
 * arrow-key movement (←/→ a week, ↑/↓ a day, Home/End), hover and focus show the tooltip, and a tap or Enter pins it
 * (Escape or tapping elsewhere dismisses). Scrolls sideways inside its own box on narrow screens, never the page.
 */
export default function ContributionCalendar({ calendar, busy }: { calendar: Calendar; busy?: boolean }) {
  const cells = useMemo(() => toCells(calendar), [calendar]);
  const markers = useMemo(() => monthMarkers(calendar), [calendar]);
  const byDate = useMemo(() => new Map(cells.map((c) => [c.day.date, c])), [cells]);
  const lastDate = cells[cells.length - 1]?.day.date ?? '';

  const frame = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [tabStop, setTabStop] = useState(lastDate);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);

  const active = hover ?? focus ?? pinned;
  const register = useCallback((date: string, el: HTMLButtonElement | null) => { if (el) refs.current.set(date, el); else refs.current.delete(date); }, []);

  // Start at the most recent weeks on narrow screens, where the grid scrolls sideways.
  useLayoutEffect(() => { const s = scroller.current; if (s) s.scrollLeft = s.scrollWidth; }, [calendar]);

  // Entrance: cells are hidden only once JS is running and motion is allowed, then staggered in when scrolled into view.
  useEffect(() => {
    const el = frame.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { setVisible(true); return; }
    setArmed(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [calendar]);

  // Tapping anywhere else, or Escape, dismisses a pinned tooltip.
  useEffect(() => {
    if (!pinned) return;
    const away = (e: Event) => { if (!(e.target as Element).closest?.('.gh-cell, .gh-tooltip')) setPinned(null); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setPinned(null); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [pinned]);

  const dateOf = (target: EventTarget | null) => (target as Element | null)?.closest?.<HTMLElement>('[data-date]')?.dataset.date ?? null;
  const onPointerOver = (e: PointerEvent) => { if (e.pointerType === 'mouse') setHover(dateOf(e.target)); };
  const onPointerLeave = (e: PointerEvent) => { if (e.pointerType === 'mouse') setHover(null); };
  const onClick = (e: React.MouseEvent) => {
    const date = dateOf(e.target);
    if (date) { setPinned((p) => (p === date ? null : date)); setTabStop(date); }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const date = dateOf(e.target);
    if (!date) return;
    const i = cells.findIndex((c) => c.day.date === date);
    const step: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    let next = -1;
    if (e.key in step) next = Math.min(Math.max(i + step[e.key], 0), cells.length - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = cells.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const target = cells[next].day.date;
    setTabStop(target);
    refs.current.get(target)?.focus();
  };

  // Tooltip position, measured from the active cell against the frame so it follows horizontal scrolling.
  useLayoutEffect(() => {
    const el = active ? refs.current.get(active) : null;
    const box = frame.current?.getBoundingClientRect();
    if (!el || !box) { setAnchor(null); return; }
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2 - box.left;
    // Scrolled out of the box (or under the sticky weekday labels): no tooltip.
    if (x < 36 || x > box.width) { setAnchor(null); return; }
    const below = r.top - box.top < 72;
    setAnchor({ x, y: (below ? r.bottom : r.top) - box.top + (below ? 8 : -8), below, width: box.width });
  }, [active, calendar, scrollTick]);

  const activeDay = active ? byDate.get(active)?.day ?? null : null;
  const weeks = calendar.weeks.length;

  return (
    <div ref={frame} className="gh-frame" data-busy={busy || undefined}>
      <div ref={scroller} className="gh-scroll" onScroll={() => setScrollTick((n) => n + 1)}>
        <p id="gh-keys" className="sr-only">Contribution calendar. Use the arrow keys to move between days; press Enter to pin the details, Escape to close.</p>
        <div
          className={`gh-grid${armed ? ' is-armed' : ''}${visible ? ' is-visible' : ''}`}
          style={{ ['--gh-weeks' as string]: weeks }}
          role="group"
          aria-label="Daily contributions"
          aria-describedby="gh-keys"
          onPointerOver={onPointerOver}
          onPointerLeave={onPointerLeave}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onFocus={(e) => setFocus(dateOf(e.target))}
          onBlur={() => setFocus(null)}
        >
          {markers.map((m) => <span key={m.week} className="gh-month" aria-hidden="true" style={{ gridColumn: m.week + 2, gridRow: 1 }}>{m.label}</span>)}
          {WEEKDAY_LABELS.map(([row, label]) => <span key={label} className="gh-weekday" aria-hidden="true" style={{ gridRow: row + 2, gridColumn: 1 }}>{label}</span>)}
          {cells.map((c) => <ContributionCell key={c.day.date} cell={c} tabbable={c.day.date === tabStop} selected={c.day.date === pinned} register={register} />)}
        </div>
      </div>
      <ContributionTooltip day={activeDay} anchor={anchor} />
    </div>
  );
}
