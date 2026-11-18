import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { select } from '~/lib/haptics';
import { maxScale } from '~/theme';
import { useRetro } from '~/theme/retro';

type Props = { value: number; onChange: (v: number) => void; label: string; /** Text above the thumb; defaults to "NN%". */ format?: (v: number) => string; steps?: number; tooltipWidth?: number };

const TRACK = 6, THUMB = 24;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Slider (value 0–1) in the reference's style: a thin navy line, an orange fill, an orange handle, and the value in bold text above the handle. Optional `steps` snaps to N+1 stops. */
export default function HorizontalSlider({ value, onChange, label, format = (v) => `${Math.round(v * 100)}%`, steps, tooltipWidth: TIP_W = 64 }: Props) {
  const r = useRetro();
  const [w, setW] = useState(0);
  const v = useSharedValue(value);
  useEffect(() => { v.value = value; }, [value, v]);
  const width = useRef(0);
  const last = useRef(value);
  const set = (x: number) => {
    let c = clamp((x - THUMB / 2) / Math.max(1, width.current - THUMB));
    if (steps) c = Math.round(c * steps) / steps;
    v.value = c;
    if (c !== last.current) { if (steps || c === 0 || c === 1) select(); last.current = c; onChange(c); }
  };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => set(e.nativeEvent.locationX),
    onPanResponderMove: (e) => set(e.nativeEvent.locationX),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [steps]);
  const cx = (val: number) => THUMB / 2 + val * Math.max(0, w - THUMB);
  const fill = useAnimatedStyle(() => ({ width: cx(v.value) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: cx(v.value) - THUMB / 2 }] }));
  const tip = useAnimatedStyle(() => ({ transform: [{ translateX: Math.min(Math.max(cx(v.value) - TIP_W / 2, 0), Math.max(0, w - TIP_W)) }] }));
  const text = format(value);
  const step = steps ? 1 / steps : 0.05;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100), text }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(cx(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step))))}
      onLayout={(e) => { width.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }}
      style={styles.wrap}
    >
      <Animated.View pointerEvents="none" style={[styles.tip, { width: TIP_W }, tip]}>
        <Text maxFontSizeMultiplier={maxScale.caption} numberOfLines={1} style={[styles.tipText, { color: r.text }]}>{text}</Text>
      </Animated.View>
      <View {...pan.panHandlers} style={styles.hit}>
        <View style={[styles.line, { backgroundColor: r.ink }]} pointerEvents="none">
          <Animated.View style={[styles.line, { backgroundColor: r.orange }, fill]} />
        </View>
        <Animated.View pointerEvents="none" style={[styles.thumb, { backgroundColor: r.orange, borderColor: r.ink }, thumb]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 26 },
  hit: { height: 44, justifyContent: 'center' },
  line: { height: TRACK, borderRadius: TRACK / 2 },
  thumb: { position: 'absolute', left: 0, top: (44 - THUMB) / 2, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2 },
  tip: { position: 'absolute', top: 0, left: 0, alignItems: 'center' },
  tipText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.6 },
});
