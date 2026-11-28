'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { describeDay, monthLabels, WEEKDAY_LABELS, type ContributionData, type ContributionDay } from '@/lib/github-contributions';
import ContributionCell from './ContributionCell';
import ContributionLegend from './ContributionLegend';
import ContributionTooltip, { type TooltipAnchor } from './ContributionTooltip';

type Pos = { week: number; row: number };

const buzz = () => {
  // Light haptic tick where the browser supports it (Android Chrome; iOS Safari does not expose vibration).
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(8);
};

/** Heatmap grid: weekdays as rows, weeks as columns. Arrow keys move between days; hover, focus and tap show the details. */
export default function ContributionCalendar({ data }: { data: ContributionData }) {
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const { rows, lastPos } = useMemo(() => {
    const rows: (ContributionDay | null)[][] = Array.from({ length: 7 }, () => Array(data.weeks.length).fill(null));
    let lastPos: Pos = { week: 0, row: 0 };
    data.weeks.forEach((w, wi) =>
      w.days.forEach((d) => {
        if (d.weekday >= 0 && d.weekday < 7) {
          rows[d.weekday][wi] = d;
          lastPos = { week: wi, row: d.weekday };
        }
      }),
    );
    return { rows, lastPos };
  }, [data]);
  const months = useMemo(() => monthLabels(data.weeks), [data]);

  const [tab, setTab] = useState<Pos>(lastPos);
  const [selected, setSelected] = useState<ContributionDay | null>(null);
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
  const hovering = useRef(false);

  // New period: reset the roving tab stop and the selection, and show the most recent weeks first on narrow screens.
  useEffect(() => {
    setTab(lastPos);
    setSelected(null);
    setAnchor(null);
    const s = scroller.current;
    if (s) s.scrollLeft = s.scrollWidth;
  }, [data, lastPos]);

  const show = useCallback((day: ContributionDay, week: number, row: number, el: HTMLElement, touch: boolean) => {
    setTab({ week, row });
    if (touch) {
      setSelected(day);
      setAnchor(null);
      buzz();
      return;
    }
    hovering.current = true;
    const w = wrap.current;
    if (!w) return;
    const c = el.getBoundingClientRect();
    const b = w.getBoundingClientRect();
    const below = c.top - b.top < 64;
    const x = Math.min(Math.max(c.left - b.left + c.width / 2, 80), b.width - 80);
    setAnchor({ day, x, y: below ? c.bottom - b.top + 8 : c.top - b.top - 8, below });
    setSelected(day);
  }, []);
  const hide = useCallback(() => {
    hovering.current = false;
    setAnchor(null);
  }, []);

  // Tapping anywhere outside the grid clears the selection.
  useEffect(() => {
    const off = (e: PointerEvent) => {
      if (!grid.current?.contains(e.target as Node)) {
        setSelected(null);
        setAnchor(null);
      }
    };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    let { week, row } = tab;
    if (e.key in d) {
      week += d[e.key][0];
      row += d[e.key][1];
    } else if (e.key === 'Home') week = 0;
    else if (e.key === 'End') week = data.weeks.length - 1;
    else if (e.key === 'PageUp') week -= 4;
    else if (e.key === 'PageDown') week += 4;
    else return;
    e.preventDefault();
    week = Math.min(Math.max(week, 0), data.weeks.length - 1);
    row = Math.min(Math.max(row, 0), 6);
    if (!rows[row][week]) {
      // Land on the nearest day that exists in that week (the first and last weeks are partial).
      const r = rows.findIndex((_, i) => rows[i][week]);
      const rr = [...rows.keys()].filter((i) => rows[i][week]).sort((a, b) => Math.abs(a - row) - Math.abs(b - row))[0];
      if (r < 0 || rr === undefined) return;
      row = rr;
    }
    setTab({ week, row });
    grid.current?.querySelector<HTMLElement>(`[data-pos="${week}-${row}"]`)?.focus();
  };

  return (
    <div className="gh-calendar" ref={wrap}>
      <div className="gh-scroll" ref={scroller}>
        <div className="gh-inner" style={{ '--weeks': data.weeks.length } as React.CSSProperties}>
          <div className="gh-months" aria-hidden="true">
            {months.map((m) => (
              <span key={`${m.week}-${m.label}`} style={{ gridColumn: m.week + 1 }}>{m.label}</span>
            ))}
          </div>
          <div className="gh-body">
            <div className="gh-weekdays" aria-hidden="true">
              {WEEKDAY_LABELS.map((l, i) => <span key={l}>{i % 2 === 1 ? l : ''}</span>)}
            </div>
            <div ref={grid} role="grid" aria-label={`GitHub contributions, ${data.total} in this period`} aria-rowcount={7} aria-colcount={data.weeks.length} className="gh-grid" onKeyDown={onKeyDown}>
              {rows.map((cells, r) => (
                <div role="row" className="gh-row" key={r} aria-label={WEEKDAY_LABELS[r]}>
                  {cells.map((day, w) =>
                    day ? (
                      <ContributionCell key={day.date} day={day} week={w} row={r} tabbable={tab.week === w && tab.row === r} active={selected?.date === day.date} onActivate={show} onLeave={hide} />
                    ) : (
                      <div key={`e${w}`} role="presentation" className="gh-empty" />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ContributionTooltip anchor={anchor} />
      <div className="gh-foot">
        <p className="gh-readout" aria-live="polite">{selected ? describeDay(selected) : 'Hover, focus or tap a day for its exact count.'}</p>
        <ContributionLegend />
      </div>
    </div>
  );
}
