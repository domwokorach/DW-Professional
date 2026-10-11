'use client';

import { useEffect, useRef, useState } from 'react';

const TIME_ZONE = 'Europe/London';
// Created once; Intl resolves GMT/BST, month lengths and leap years, so no calendar rules live here.
const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE, day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
});
const labelFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
});
const monthFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, month: 'long' });

/** Wall-clock day/hours/minutes/seconds in Europe/London. Milliseconds are zone-independent. */
export function getLondonTime(now: Date) {
  const parts = partsFormatter.formatToParts(now);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { day: read('day'), hours: read('hour') % 24, minutes: read('minute'), seconds: read('second'), milliseconds: now.getMilliseconds() };
}

export function getLondonMonth(now: Date) {
  return monthFormatter.format(now);
}

export function calculateClockAngles(
  { hours, minutes, seconds, milliseconds }: { hours: number; minutes: number; seconds: number; milliseconds: number },
) {
  return {
    second: (seconds + milliseconds / 1000) * 6,
    minute: (minutes + seconds / 60 + milliseconds / 60000) * 6,
    hour: ((hours % 12) + minutes / 60 + seconds / 3600) * 30,
  };
}

export function useRealTimeClock() {
  const hourRef = useRef<HTMLImageElement>(null);
  const minuteRef = useRef<HTMLImageElement>(null);
  const secondRef = useRef<HTMLImageElement>(null);
  const dateRef = useRef<SVGTextElement>(null);
  const monthRef = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState('Current time in London');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timer = 0;
    let lastSecond = Number.NaN;
    let lastWrapped = 0;
    let secondTurns = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      const now = new Date();
      const wholeSecond = Math.floor(now.getTime() / 1000);
      const elapsed = wholeSecond - lastSecond;
      lastSecond = wholeSecond;

      const london = getLondonTime(now);
      const angles = calculateClockAngles({ ...london, milliseconds: 0 });
      // Keep the second hand's angle increasing so it never spins backwards across 12.
      if (angles.second < lastWrapped) secondTurns += 1;
      lastWrapped = angles.second;
      const secondAngle = angles.second + secondTurns * 360;

      const second = secondRef.current;
      if (second) {
        // A long gap (tab was hidden) must jump, not sweep through the missed seconds.
        const jump = reducedMotion || !(elapsed <= 2);
        if (jump) second.style.transition = 'none';
        second.style.transform = `rotate(${secondAngle}deg)`;
        if (jump) {
          void second.offsetWidth;
          second.style.transition = '';
        }
      }
      if (hourRef.current) hourRef.current.style.transform = `rotate(${angles.hour}deg)`;
      if (minuteRef.current) minuteRef.current.style.transform = `rotate(${angles.minute}deg)`;

      const day = String(london.day).padStart(2, '0');
      if (dateRef.current && dateRef.current.textContent !== day) dateRef.current.textContent = day;
      const month = getLondonMonth(now);
      if (monthRef.current && monthRef.current.textContent !== month) monthRef.current.textContent = month;
      setLabel(`Current time in London: ${labelFormatter.format(now)}`);
      setReady(true);
    };

    const schedule = () => {
      // Tick on the real second boundary so the hands never drift from the clock.
      timer = window.setTimeout(() => {
        render();
        schedule();
      }, 1000 - (Date.now() % 1000) + 5);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') render();
    };

    render();
    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return { hourRef, minuteRef, secondRef, dateRef, monthRef, label, ready };
}
