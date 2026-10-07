import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Drives an Animate UI icon from its whole parent control (link, button, drop zone), not just the icon:
 * mouse/pen hover and keyboard focus (focus-visible only, so a click doesn't leave it animated) start it,
 * leaving or blurring returns it, and on touch a tap plays it briefly (touch has no real hover, so a
 * hover-driven state would stick). Never animates under prefers-reduced-motion.
 * Spread `bind` on the parent and pass `active` to the icon's `animate` prop.
 */
export function useIconTrigger() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const on = useCallback(() => { if (!reduce) setActive(true); }, [reduce]);
  const off = useCallback(() => { clearTimeout(timer.current); setActive(false); }, []);

  const bind = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => { if (e.pointerType !== 'touch') on(); },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => { if (e.pointerType !== 'touch') off(); },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'touch') return;
      on();
      clearTimeout(timer.current);
      timer.current = setTimeout(off, 700);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.target.matches(':focus-visible')) on(); },
    onBlur: off,
  };

  return { active, bind };
}
