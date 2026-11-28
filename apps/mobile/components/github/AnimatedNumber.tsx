import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, type TextStyle } from 'react-native';

/** Counts up to `value` over ~0.9s (from 0, then from what it showed). Shows the final number at once under Reduce Motion. */
export default function AnimatedNumber({ value, style }: { value: number; style?: TextStyle }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce || from.current === value) { from.current = value; setShown(value); return; }
      const start = Date.now();
      const begin = from.current;
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / 900);
        const eased = 1 - Math.pow(1 - p, 3);
        from.current = begin + (value - begin) * eased;
        setShown(Math.round(from.current));
        if (p < 1) frame = requestAnimationFrame(tick); else from.current = value;
      };
      frame = requestAnimationFrame(tick);
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [value]);
  return <Text style={style} accessibilityLabel={value.toLocaleString('en-GB')}>{shown.toLocaleString('en-GB')}</Text>;
}
