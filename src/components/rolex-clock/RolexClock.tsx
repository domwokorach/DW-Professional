'use client';

import type { CSSProperties } from 'react';
import { useRealTimeClock } from './useRealTimeClock';
import styles from './rolex-clock.module.css';

const ASSETS = '/images/rolex-submariner';

// Geometry of each hand layer as a percentage of the dial image; every hand rotates about the dial's pivot.
const hand = (left: number, top: number, width: number, height: number, originX: number, originY: number): CSSProperties => ({
  left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, transformOrigin: `${originX}% ${originY}%`,
});
const HOUR = hand(45.8533, 27.193, 8.2137, 22.5678, 49.806, 99.223);
const MINUTE = hand(47.9266, 17.5439, 4.067, 32.2169, 49.608, 99.455);
const SECOND = hand(47.9266, 19.059, 4.067, 30.7018, 49.608, 99.429);

export default function RolexClock() {
  const clock = useRealTimeClock();

  return (
    <figure className={`${styles.figure} ${clock.ready ? styles.ready : ''}`} aria-label={clock.label}>
      <div className={styles.watch} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.dial} src={`${ASSETS}/dial.webp`} alt="" width={1000} height={1000} decoding="async" draggable={false} />
        <svg className={`${styles.live} ${styles.date}`} viewBox="0 0 1254 1254" focusable="false">
          <text ref={clock.dateRef} x="916" y="660" textAnchor="middle" textLength="112" lengthAdjust="spacingAndGlyphs" />
        </svg>
        <div className={`${styles.live} ${styles.hands}`}>
          {/* eslint-disable @next/next/no-img-element */}
          <img ref={clock.hourRef} className={styles.hand} style={HOUR} src={`${ASSETS}/hour-hand.webp`} alt="" decoding="async" draggable={false} />
          <img ref={clock.minuteRef} className={styles.hand} style={MINUTE} src={`${ASSETS}/minute-hand.webp`} alt="" decoding="async" draggable={false} />
          <img ref={clock.secondRef} className={`${styles.hand} ${styles.second}`} style={SECOND} src={`${ASSETS}/second-hand.webp`} alt="" decoding="async" draggable={false} />
          {/* eslint-enable @next/next/no-img-element */}
        </div>
      </div>
      <figcaption className={styles.caption}>
        <span className="sr-only">{clock.label}. Blue and gold dive-watch style analogue clock.</span>
        <span className={styles.month} ref={clock.monthRef} aria-hidden="true">{' '}</span>
      </figcaption>
    </figure>
  );
}
