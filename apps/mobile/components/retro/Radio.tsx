import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { select } from '~/lib/haptics';
import { maxScale, spring } from '~/theme';
import { useRetro } from '~/theme/retro';

const S = 36;

/** Round radio: navy ring when off; orange ring with an orange dot (that springs in) when on. */
export function Radio({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) {
  const r = useRetro();
  const dot = useSharedValue(selected ? 1 : 0);
  useEffect(() => { dot.value = withSpring(selected ? 1 : 0, spring.press); }, [selected, dot]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value, transform: [{ scale: dot.value }] }));
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => { if (!selected) select(); onPress(); }} hitSlop={8}>
      <View style={[styles.ring, { borderColor: selected ? r.orange : r.ink }]}>
        <Animated.View style={[styles.dot, { backgroundColor: r.orange }, dotStyle]} />
      </View>
    </Pressable>
  );
}

/** A radio with its text label; the whole row is the touch target. */
export function RadioRow({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) {
  const r = useRetro();
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => { if (!selected) select(); onPress(); }} style={styles.row}>
      <View pointerEvents="none"><Radio selected={selected} onPress={onPress} label={label} /></View>
      <Text maxFontSizeMultiplier={maxScale.body} style={[styles.label, { color: selected ? r.orange : r.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { width: S, height: S, borderRadius: S / 2, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', flexShrink: 1 },
});
