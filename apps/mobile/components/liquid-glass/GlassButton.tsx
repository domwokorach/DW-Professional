import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tap } from '~/lib/haptics';
import { mono, pressScale, radius, spring, useTheme } from '~/theme';
import GlassSurface from './GlassSurface';

type Props = { label: string; onPress: () => void; primary?: boolean; disabled?: boolean; hint?: string; icon?: ReactNode; selected?: boolean };

/**
 * Pill button on a system glass surface. Press/release use a Reanimated spring (Reduce Motion is honoured by the shared spring config), a light haptic fires on press,, and the glass
 * itself is `isInteractive`, so iOS 26 adds its own touch response on top. Pressed, selected, disabled and focused
 * (hardware keyboard) states are all visible. Primary buttons tint the glass with the site's ink colour.
 */
export default function GlassButton({ label, onPress, primary, disabled, hint, icon, selected }: Props) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const [focused, setFocused] = useState(false);
  const to = (v: number) => { scale.value = withSpring(v, spring.press); };
  const color = primary ? t.onInk : t.ink;
  return (
    <Animated.View style={[animated, { opacity: disabled ? 0.45 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ disabled: !!disabled, selected: !!selected }}
        disabled={disabled}
        onPress={() => { tap(); onPress(); }}
        onPressIn={() => to(pressScale)}
        onPressOut={() => to(1)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        hitSlop={4}
        style={[styles.press, focused && { borderColor: t.ink, borderWidth: 2 }, selected && { borderColor: t.ink, borderWidth: 1 }]}
      >
        <GlassSurface interactive tint={primary ? t.ink : undefined} prominent={primary} style={styles.surface}>
          {icon}
          <Text style={[styles.text, { color }]} maxFontSizeMultiplier={1.4}>{label}</Text>
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: radius.pill, borderWidth: 0, borderColor: 'transparent' },
  surface: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: mono, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
