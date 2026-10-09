'use client';

import { useEffect, useRef, useState } from 'react';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
});

export function calculateClockAngles(now: Date) {
  const milliseconds = now.getMilliseconds();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  return {
    second: (seconds + milliseconds / 1000) * 6,
    minute: (minutes + seconds / 60 + milliseconds / 60000) * 6,
    hour: ((hours % 12) + minutes / 60 + seconds / 3600) * 30,
  };
}

export function useRealTimeClock() {
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);
  const secondRef = useRef<SVGGElement>(null);
  const subsecondRef = useRef<SVGGElement>(null);
  const [label, setLabel] = useState('Current local time');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    let labelledSecond = -1;
    let firstFrame = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const update = () => {
      const now = new Date();
      const angles = calculateClockAngles(now);
      hourRef.current?.setAttribute('transform', `rotate(${angles.hour} 500 500)`);
      minuteRef.current?.setAttribute('transform', `rotate(${angles.minute} 500 500)`);
      secondRef.current?.setAttribute('transform', `rotate(${angles.second} 500 500)`);
      subsecondRef.current?.setAttribute('transform', `rotate(${angles.second} 500 680)`);

      if (now.getSeconds() !== labelledSecond) {
        labelledSecond = now.getSeconds();
        setLabel(`Current local time: ${timeFormatter.format(now)}`);
      }
      if (firstFrame) {
        firstFrame = false;
        setReady(true);
      }
      if (!reducedMotion) frame = requestAnimationFrame(update);
    };

    update();
    if (reducedMotion) timer = window.setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  return { hourRef, minuteRef, secondRef, subsecondRef, label, ready };
}
