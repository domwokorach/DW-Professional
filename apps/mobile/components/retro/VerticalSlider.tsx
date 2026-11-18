import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { select } from '~/lib/haptics';
import { useRetro } from '~/theme/retro';

type Props = { value: number; onChange: (v: number) => void; label: string; height?: number; width?: number; tone?: 'teal' | 'orange' };

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Vertical bar slider (value 0–1): navy-outlined track with a teal (or orange) fill whose rounded cap is always at least a full pill. Drag or tap anywhere on it; VoiceOver adjusts in 10% steps. */
export default function VerticalSlider({ value, onChange, label, height = 220, width = 52, tone = 'teal' }: Props) {
  const r = useRetro();
  const v = useSharedValue(value);
  useEffect(() => { v.value = value; }, [value, v]);
  const start = useRef(0);
  const last = useRef(value);
  const usable = height - width;
  const set = (next: number) => { const c = clamp(next); v.value = c; if (Math.abs(c - last.current) > 0.004) { if ((c === 0 || c === 1) && last.current !== c) select(); last.current = c; onChange(c); } };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { set(1 - (e.nativeEvent.locationY - width / 2) / usable); start.current = last.current; },
    onPanResponderMove: (_, g) => set(start.current - g.dy / usable),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [usable, width]);
  const fill = useAnimatedStyle(() => ({ height: width - 4 + v.value * usable }));
  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100), text: `${Math.round(value * 100)} percent` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))}
      style={{ width, height }}
    >
      <View pointerEvents="none" style={[styles.track, { width, height, borderRadius: width / 2, borderColor: r.ink }]}>
        <Animated.View style={[styles.fill, { width: width - 4, borderRadius: (width - 4) / 2, backgroundColor: tone === 'orange' ? r.orange : r.teal }, fill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ track: { borderWidth: 2, overflow: 'hidden' }, fill: { position: 'absolute', bottom: 0, left: 0 } });
