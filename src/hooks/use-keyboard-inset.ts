"use client";

import { useEffect, useState } from "react";

/**
 * Extra bottom offset (px) needed to keep a fixed, bottom-anchored element
 * clear of the on-screen keyboard.
 *
 * iOS Safari shrinks `window.visualViewport` when the keyboard opens but
 * leaves the layout viewport (and therefore `position: fixed` and `vh`
 * units) unchanged, so fixed UI can end up hidden behind the keyboard.
 * Tracking the gap between the two viewports lets callers push such
 * elements back into view.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setInset(Math.max(0, Math.round(covered)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}
