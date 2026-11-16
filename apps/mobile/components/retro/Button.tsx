import type { SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { tap } from '~/lib/haptics';
import { maxScale } from '~/theme';
import { toneColors, useRetro, type Tone } from '~/theme/retro';
import Symbol from './Symbol';
import { Raised } from './Surface';
import { useScale } from './useScale';

type Icon = { sf: SFSymbol; fallback: React.ComponentProps<typeof Symbol>['fallback'] };
type Props = {
  label: string; onPress: () => void; icon?: Icon; trailing?: ReactNode; hint?: string; disabled?: boolean; selected?: boolean;
  /** Shorthand for tone="teal". */ primary?: boolean; tone?: Tone; accessibilityLabel?: string; expanded?: boolean; align?: 'center' | 'between';
};

/** Retro button: outlined (default), or filled teal / navy / orange. Uppercase bold label, optional leading icon and trailing accessory; presses scale and dim. `selected` turns the outline orange. */
export default function Button({ label, onPress, icon, trailing, hint, disabled, selected, primary, tone, accessibilityLabel, expanded, align = 'center' }: Props) {
  const r = useRetro();
  const scale = useScale(0.97);
  const c = toneColors(r, tone ?? (primary ? 'teal' : 'outline'));
  const fg = selected ? r.orange : c.fg;
  return (
    <Animated.View style={[scale.style, { opacity: disabled ? 0.45 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: !!disabled, selected: !!selected, expanded }}
        disabled={disabled}
        onPress={() => { tap(); onPress(); }}
        onPressIn={scale.pressIn}
        onPressOut={scale.pressOut}
        hitSlop={4}
        style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
      >
        <Raised radius={16} tone={tone ?? (primary ? 'teal' : 'outline')} style={selected ? { borderColor: r.orange } : undefined} contentStyle={[styles.row, align === 'between' && styles.between]}>
          <View style={styles.inner}>
            {icon ? <Symbol sf={icon.sf} fallback={icon.fallback} size={18} color={fg} weight="bold" /> : null}
            <Text maxFontSizeMultiplier={maxScale.body} numberOfLines={1} style={[styles.text, { color: fg }]}>{label}</Text>
          </View>
          {trailing}
        </Raised>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  between: { justifyContent: 'space-between' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  text: { fontSize: 15, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' },
});
