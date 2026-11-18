import { Easing, ReduceMotion } from 'react-native-reanimated';

/** Shared motion tokens, so every screen springs the same way. Reanimated applies the system Reduce Motion setting. */
export const spring = {
  press: { stiffness: 420, damping: 24, mass: 0.8, reduceMotion: ReduceMotion.System },
  gentle: { stiffness: 180, damping: 22, mass: 1, reduceMotion: ReduceMotion.System },
  reveal: { stiffness: 140, damping: 20, mass: 1, reduceMotion: ReduceMotion.System },
};
export const timing = { fast: 160, base: 260, easeOut: Easing.out(Easing.cubic) };
export const pressScale = 0.96;
