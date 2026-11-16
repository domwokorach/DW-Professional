import type { ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef } from 'react';
import { Reveal } from '~/components/liquid-glass';
import { RetroSurface } from '~/components/retro';
import { useRetro } from '~/theme/retro';
import { maxScale, mono, radius, space, typography, useTheme } from '~/theme';

/** Scrolling page with safe-area padding and the site's max content width on tablets. */
export function Screen({ children }: { children: ReactNode }) {
  const n = useRetro();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: n.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40, paddingHorizontal: space.page, alignItems: 'center' }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={{ width: '100%', maxWidth: 760 }}>{children}</View>
    </ScrollView>
  );
}

export function SectionTag({ num, label }: { num?: string; label: string }) {
  const t = useTheme();
  return (
    <View style={styles.tag} accessible accessibilityElementsHidden={false}>
      {num ? <Text maxFontSizeMultiplier={maxScale.label} style={[styles.tagText, { color: t.ink }]}>{num}</Text> : null}
      <View style={[styles.tagRule, { backgroundColor: t.accent }]} />
      <Text maxFontSizeMultiplier={maxScale.label} style={[styles.tagText, { color: t.ink }]}>{label}</Text>
    </View>
  );
}

export function H2({ children, em }: { children: ReactNode; em?: string }) {
  const t = useTheme();
  return (
    <Reveal>
      <Text accessibilityRole="header" maxFontSizeMultiplier={maxScale.title} style={[styles.h2, { color: t.ink }]}>
        {children}
        {em ? <Text style={[styles.em, { color: t.accent }]}>{em}</Text> : null}
      </Text>
    </Reveal>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: object }) {
  const t = useTheme();
  return <Text maxFontSizeMultiplier={maxScale.body} style={[styles.body, { color: t.text2 }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  // Margins belong to the outer (layout) box; everything else (padding, gap, overflow) to the raised surface's content.
  const { margin, marginTop, marginBottom, marginVertical, marginHorizontal, marginLeft, marginRight, ...rest } = StyleSheet.flatten(style) ?? {};
  return (
    <Reveal style={{ margin, marginTop, marginBottom, marginVertical, marginHorizontal, marginLeft, marginRight }}>
      <RetroSurface radius={18} contentStyle={[styles.card, rest]}>{children}</RetroSurface>
    </Reveal>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  const t = useTheme();
  const n = useRetro();
  return (
    <View style={[styles.badge, { borderColor: n.teal }]}>
      <Text style={[styles.badgeText, { color: n.teal }]}>{children}</Text>
    </View>
  );
}

type ButtonProps = { label: string; onPress: () => void; primary?: boolean; hint?: string; icon?: ReactNode };

/** Pill button with a subtle press scale; the scale is dropped for users who prefer less motion via the OS setting on web. */
export function Button({ label, onPress, primary, hint, icon }: ButtonProps) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 3 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        style={[styles.button, primary ? { backgroundColor: t.ink } : { borderColor: t.ink2, borderWidth: 2, backgroundColor: 'transparent' }]}
      >
        {icon}
        <Text style={[styles.buttonText, { color: primary ? t.onInk : t.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: space.section, marginBottom: 24 },
  tagText: { fontFamily: mono, fontSize: 11, letterSpacing: 2.4 },
  tagRule: { width: 28, height: 3, borderRadius: 2 },
  h2: typography.title,
  em: typography.em,
  body: typography.body,
  card: { borderRadius: 16, padding: 20, gap: 10, overflow: 'hidden' },
  badge: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase' },
  button: { minHeight: 48, borderRadius: 16, paddingHorizontal: 22, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
});
