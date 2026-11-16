import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { select } from '~/lib/haptics';
import { maxScale, spring } from '~/theme';
import { useRetro } from '~/theme/retro';
import Button from './Button';
import Symbol from './Symbol';
import { Raised } from './Surface';

type Props = { label: string; options: string[]; value: string; onChange: (v: string) => void };

/** Droplist from the reference: a teal header with a flipping triangle, and outlined rounded items that unfold below (inline, so nothing clips). */
export default function Dropdown({ label, options, value, onChange }: Props) {
  const r = useRetro();
  const [open, setOpen] = useState(false);
  const flip = useSharedValue(0);
  useEffect(() => { flip.value = withSpring(open ? 1 : 0, spring.press); }, [open, flip]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${flip.value * 180}deg` }] }));
  return (
    <View style={{ gap: 10 }}>
      <Button
        tone="teal"
        label={value}
        accessibilityLabel={`${label}: ${value}`}
        hint="Opens the list of choices"
        expanded={open}
        align="between"
        onPress={() => setOpen((o) => !o)}
        trailing={<Animated.View style={chevron}><Symbol sf="arrowtriangle.down.fill" fallback="caret-down" size={16} color={r.onTeal} /></Animated.View>}
      />
      {open ? (
        <Animated.View style={{ gap: 10 }} entering={FadeInUp.springify().damping(20).reduceMotion(ReduceMotion.System)} exiting={FadeOutUp.duration(150).reduceMotion(ReduceMotion.System)}>
          {options.map((o) => (
            <Pressable key={o} accessibilityRole="menuitem" accessibilityLabel={o} accessibilityState={{ selected: o === value }} onPress={() => { select(); onChange(o); setOpen(false); }}>
              <Raised radius={14} style={o === value ? { borderColor: r.orange } : undefined} contentStyle={styles.item}>
                <Text maxFontSizeMultiplier={maxScale.body} numberOfLines={1} style={[styles.itemText, { color: o === value ? r.orange : r.teal }]}>{o}</Text>
                {o === value ? <Symbol sf="checkmark" fallback="checkmark" size={16} color={r.orange} weight="bold" /> : null}
              </Raised>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { minHeight: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  itemText: { fontSize: 15, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase', flexShrink: 1 },
});
