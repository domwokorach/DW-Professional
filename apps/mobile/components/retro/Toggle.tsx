import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { select } from '~/lib/haptics';
import { spring } from '~/theme';
import { useRetro } from '~/theme/retro';

const W = 68, H = 38, T = 24, PAD = 5;

/** Switch: navy outline with a navy dot when off; teal fill with a cream dot when on. The dot springs across. */
export default function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const r = useRetro();
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => { p.value = withSpring(value ? 1 : 0, spring.press); }, [value, p]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(p.value, [0, 1], [0, W - T - PAD * 2 - 4]) }] }));
  const fill = useAnimatedStyle(() => ({ opacity: p.value }));
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => { select(); onValueChange(!value); }} hitSlop={6} style={[styles.track, { borderColor: value ? r.teal : r.ink }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: r.teal }, fill]} />
      <Animated.View pointerEvents="none" style={[styles.thumb, { backgroundColor: value ? r.onTeal : r.ink }, thumb]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, borderWidth: 2, overflow: 'hidden', justifyContent: 'center' },
  thumb: { position: 'absolute', left: PAD, width: T, height: T, borderRadius: T / 2 },
});
