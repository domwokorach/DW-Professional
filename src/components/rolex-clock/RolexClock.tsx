'use client';

import ChronographSubdials from './ChronographSubdials';
import WatchBezel from './WatchBezel';
import WatchDial from './WatchDial';
import WatchHands from './WatchHands';
import { useRealTimeClock } from './useRealTimeClock';
import styles from './rolex-clock.module.css';

export default function RolexClock() {
  const clock = useRealTimeClock();

  return (
    <figure className={styles.figure} aria-label={clock.label}>
      <svg className={`${styles.clock} ${clock.ready ? styles.ready : ''}`} viewBox="0 0 1000 1000" shapeRendering="geometricPrecision" textRendering="geometricPrecision" aria-hidden="true">
        <defs>
          <linearGradient id="bezelGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#845004"/><stop offset=".12" stopColor="#ffed9b"/><stop offset=".29" stopColor="#c58b1b"/><stop offset=".5" stopColor="#fff0a5"/><stop offset=".71" stopColor="#aa6d0a"/><stop offset=".88" stopColor="#ffe589"/><stop offset="1" stopColor="#744400"/></linearGradient>
          <linearGradient id="edgeGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff5af"/><stop offset=".34" stopColor="#bf8110"/><stop offset=".61" stopColor="#ffe57a"/><stop offset="1" stopColor="#7e4e00"/></linearGradient>
          <linearGradient id="markerGold"><stop stopColor="#875600"/><stop offset=".24" stopColor="#ffe68c"/><stop offset=".55" stopColor="#b77808"/><stop offset=".82" stopColor="#fff0a3"/><stop offset="1" stopColor="#764700"/></linearGradient>
          <linearGradient id="handGold"><stop stopColor="#855300"/><stop offset=".22" stopColor="#ffed9d"/><stop offset=".48" stopColor="#c38410"/><stop offset=".72" stopColor="#fff0a0"/><stop offset="1" stopColor="#704300"/></linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#505050"/><stop offset=".16" stopColor="#f5f5f1"/><stop offset=".35" stopColor="#747474"/><stop offset=".58" stopColor="#eee"/><stop offset=".82" stopColor="#707070"/><stop offset="1" stopColor="#fafafa"/></linearGradient>
          <radialGradient id="dial" cx="42%" cy="34%"><stop stopColor="#fff"/><stop offset=".68" stopColor="#fbfaf7"/><stop offset="1" stopColor="#e7e5dd"/></radialGradient>
          <radialGradient id="subdialGold"><stop stopColor="#f6d772"/><stop offset=".45" stopColor="#c78d18"/><stop offset=".72" stopColor="#ffeb94"/><stop offset="1" stopColor="#875500"/></radialGradient>
          <filter id="smallShadow"><feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity=".35"/></filter>
          <filter id="handShadow"><feDropShadow dx="3" dy="4" stdDeviation="3" floodOpacity=".38"/></filter>
          <filter id="watchShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#322000" floodOpacity=".2"/></filter>
        </defs>
        <g filter="url(#watchShadow)">
          <WatchBezel />
          <WatchDial />
          <ChronographSubdials subsecondRef={clock.subsecondRef} />
          <WatchHands hourRef={clock.hourRef} minuteRef={clock.minuteRef} secondRef={clock.secondRef} />
        </g>
      </svg>
      <figcaption className="sr-only">{clock.label}. Luxury gold chronograph-style analogue clock.</figcaption>
    </figure>
  );
}
