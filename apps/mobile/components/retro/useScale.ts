import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { pressScale, spring } from '~/theme';

/** Spring press scale shared by all pressable soft controls. Reduce Motion is handled by the spring config. */
export function useScale(to = pressScale) {
  const s = useSharedValue(1);
  return { style: useAnimatedStyle(() => ({ transform: [{ scale: s.value }] })), pressIn: () => { s.value = withSpring(to, spring.press); }, pressOut: () => { s.value = withSpring(1, spring.press); } };
}
