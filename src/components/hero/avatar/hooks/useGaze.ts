'use client';

import { useState, type RefObject } from 'react';
import { LIMITS, SPRINGS } from '../config';
import { clamp, follow, rand, spring, turn, type FrameContext } from '../motion';
import type { PointerTarget } from './usePointerTracking';

const axis2 = () => ({ x: spring(), y: spring() });

/**
 * Head, neck and eye tracking. Eyes rotate furthest and respond fastest, the head follows with a
 * smaller, slower turn, and the neck adds a little more on top. All three are clamped (LIMITS) and
 * spring-smoothed (SPRINGS), so they never snap to the pointer and settle back to neutral without it.
 */
export function useGaze(pointer: RefObject<PointerTarget>) {
  const [gaze] = useState(() => {
    const eyes = axis2();
    const head = axis2();
    const neck = axis2();
    const saccade = { x: 0, y: 0, next: 0 };

    return {
      /** Current eye pitch (radians); the blink system uses it to drop the lids when looking down. */
      get eyePitch() {
        return eyes.y.x;
      },

      update({ dt, time, caps, morphs, reducedMotion: calm, energy }: FrameContext) {
        const px = pointer.current?.x ?? 0;
        const py = pointer.current?.y ?? 0;

        // Head + neck
        follow(head.x, px * LIMITS.headYaw, SPRINGS.head, dt);
        follow(head.y, py * LIMITS.headPitch, SPRINGS.head, dt);
        follow(neck.x, px * LIMITS.neckYaw, SPRINGS.neck, dt);
        follow(neck.y, py * LIMITS.neckPitch, SPRINGS.neck, dt);

        const breathe = calm ? 0 : Math.sin((time * Math.PI * 2) / 4.2) * 0.012;
        const nod = calm ? 0 : energy * (0.03 * Math.sin(time * 4.7) + 0.012 * Math.sin(time * 2.3));
        const sway = calm ? 0 : energy * 0.015 * Math.sin(time * 1.9);
        const { chest, neck: neckBone, head: headBone } = caps.bones;
        turn(chest, 0, breathe);
        turn(neckBone, neck.x.x, neck.y.x);
        // Without a neck bone the head carries the neck's share too.
        const extra = neckBone ? 0 : 1;
        turn(headBone, head.x.x + extra * neck.x.x + sway, head.y.x + extra * neck.y.x + nod);

        // Eyes, with small involuntary saccades so a still pointer doesn't give a fixed stare.
        if (!calm && time > saccade.next) {
          saccade.x = rand(-0.08, 0.08);
          saccade.y = rand(-0.06, 0.06);
          saccade.next = time + rand(0.6, 2.4);
        }
        const ex = clamp(px + (calm ? 0 : saccade.x), -1, 1);
        const ey = clamp(py + (calm ? 0 : saccade.y), -1, 1);
        follow(eyes.x, ex * LIMITS.eyeYaw, SPRINGS.eyes, dt);
        follow(eyes.y, ey * LIMITS.eyePitch, SPRINGS.eyes, dt);
        const yaw = eyes.x.x;
        const pitch = eyes.y.x;

        if (caps.eyes === 'bones') {
          turn(caps.bones.eyeL, yaw, pitch);
          turn(caps.bones.eyeR, yaw, pitch);
        } else if (caps.eyes === 'morphs') {
          const x = yaw / LIMITS.eyeMorphFull;
          const y = pitch / LIMITS.eyeMorphFull;
          // Screen right is the character's left: his left eye looks out, his right eye looks in.
          morphs.add('eyeLookOutLeft', Math.max(0, x));
          morphs.add('eyeLookInRight', Math.max(0, x));
          morphs.add('eyeLookInLeft', Math.max(0, -x));
          morphs.add('eyeLookOutRight', Math.max(0, -x));
          for (const side of ['Left', 'Right']) {
            morphs.add(`eyeLookUp${side}`, Math.max(0, y));
            morphs.add(`eyeLookDown${side}`, Math.max(0, -y));
          }
        }
      },
    };
  });
  return gaze;
}
