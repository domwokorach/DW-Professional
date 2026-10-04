'use client';

import { useEffect, useState } from 'react';

const TIME_ZONE = 'Europe/London';
// Created once; Intl works out GMT vs BST for any date, so no daylight-saving rules live here.
const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const zoneFormat = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, timeZoneName: 'short' });

function read(now: Date) {
  return {
    time: timeFormat.format(now),
    zone: zoneFormat.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? '',
  };
}

/**
 * Live Europe/London time, regardless of the visitor's own time zone.
 * Renders a placeholder on the server and first paint (so server and client HTML match),
 * then ticks on each whole second. No aria-live: the seconds are not announced.
 */
export default function LondonClock() {
  const [now, setNow] = useState<{ time: string; zone: string } | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(read(new Date()));
    tick();
    // Align to the next whole second so the display changes on the second boundary.
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <>
      <span className="sr-only">Current time in London: </span>
      <span className="quick-fact-time">{now?.time ?? '--:--:--'}</span>
      <small className="quick-fact-meta">London{now?.zone ? ` · ${now.zone}` : ''}</small>
    </>
  );
}
