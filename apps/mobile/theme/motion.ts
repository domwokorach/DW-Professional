import { Easing, ReduceMotion } from 'react-native-reanimated';
import { lightTokens } from '@/styles/tokens.generated';

const ms = (v: string) => parseInt(v, 10);

/** Shared motion tokens, so every screen springs the same way. Reanimated applies the system Reduce Motion setting. */
export const spring = {
  press: { stiffness: 420, damping: 24, mass: 0.8, reduceMotion: ReduceMotion.System },
  gentle: { stiffness: 180, damping: 22, mass: 1, reduceMotion: ReduceMotion.System },
  reveal: { stiffness: 140, damping: 20, mass: 1, reduceMotion: ReduceMotion.System },
};
/** Durations come from the web tokens (--dur-*); `fast` and `base` keep their existing values. */
export const timing = {
  micro: ms(lightTokens['dur-micro']),
  fast: 160,
  base: 260,
  reveal: ms(lightTokens['dur-reveal']),
  cinematic: ms(lightTokens['dur-cinematic']),
  easeOut: Easing.out(Easing.cubic),
};
export const pressScale = 0.96;
