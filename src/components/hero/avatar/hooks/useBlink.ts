'use client';

import { useState } from 'react';
import { LIMITS } from '../config';
import { rand, type FrameContext } from '../motion';

/** Eyelid closure over one blink: ~70 ms down, ~130 ms up. */
const lid = (s: number) => (s < 0 ? 0 : s < 0.07 ? s / 0.07 : s < 0.2 ? 1 - (s - 0.07) / 0.13 : 0);

/**
 * Natural blinking at irregular intervals (mostly 2–6 s, sometimes a longer stare, occasionally a
 * double blink). The upper lids also follow the eyes down a little. Needs eyeBlinkLeft/Right morphs.
 */
export function useBlink() {
  const [blink] = useState(() => {
    const state = { start: -1, next: 1.5, double: false };
    return {
      update({ time, caps, morphs }: FrameContext, eyePitch: number) {
        if (!caps.blink) return;
        if (time > state.next) {
          state.start = time;
          state.double = Math.random() < 0.15;
          state.next = time + (Math.random() < 0.1 ? rand(6, 9) : rand(2, 6));
        }
        const since = time - state.start;
        const closed = Math.max(lid(since), state.double ? lid(since - 0.26) : 0);
        const droop = Math.max(0, -eyePitch / LIMITS.eyePitch) * 0.2;
        morphs.add('eyeBlinkLeft', closed + droop);
        morphs.add('eyeBlinkRight', closed + droop);
      },
    };
  });
  return blink;
}
