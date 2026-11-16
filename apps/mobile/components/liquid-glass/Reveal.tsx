import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

/** Entrance for headings and cards: fades in while rising a few points on a gentle spring. Skipped when Reduce Motion is on. */
export default function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().stiffness(140).damping(20).withInitialValues({ transform: [{ translateY: 14 }] }).reduceMotion(ReduceMotion.System)} style={style}>
      {children}
    </Animated.View>
  );
}
