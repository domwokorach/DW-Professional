import type { ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef } from 'react';
import { mono, radius, space, useTheme } from '~/theme';

/** Scrolling page with safe-area padding and the site's max content width on tablets. */
export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: t.cream }}
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
      {num ? <Text style={[styles.tagText, { color: t.ink }]}>{num}</Text> : null}
      <View style={[styles.tagRule, { backgroundColor: t.ink }]} />
      <Text style={[styles.tagText, { color: t.ink }]}>{label}</Text>
    </View>
  );
}

export function H2({ children, em }: { children: ReactNode; em?: string }) {
  const t = useTheme();
  return (
    <Text accessibilityRole="header" style={[styles.h2, { color: t.ink }]}>
      {children}
      {em ? <Text style={styles.em}>{em}</Text> : null}
    </Text>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: object }) {
  const t = useTheme();
  return <Text style={[styles.body, { color: t.text2 }, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }, style]}>{children}</View>;
}

export function Badge({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: t.badge, borderColor: t.line }]}>
      <Text style={[styles.badgeText, { color: t.text3 }]}>{children}</Text>
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
        style={[styles.button, primary ? { backgroundColor: t.ink } : { borderColor: t.line, borderWidth: 1, backgroundColor: t.card }]}
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
  tagRule: { width: 28, height: 1 },
  h2: { fontSize: 34, fontWeight: '700', letterSpacing: -1, lineHeight: 40 },
  em: { fontStyle: 'italic', fontWeight: '500' },
  body: { fontSize: 16, lineHeight: 26 },
  card: { borderWidth: 1, borderRadius: radius.card, padding: 20, gap: 10 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontFamily: mono, fontSize: 11, letterSpacing: 0.4 },
  button: { minHeight: 48, borderRadius: radius.pill, paddingHorizontal: 22, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: mono, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});
