import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface';

type Props = { children: ReactNode; onPress?: () => void; label?: string; hint?: string; style?: StyleProp<ViewStyle> };

/** A compact glass tile for tappable actions. Not for long text: content cards stay on the opaque `Card`. */
export default function GlassCard({ children, onPress, label, hint, style }: Props) {
  const body = <GlassSurface interactive={!!onPress} style={[styles.card, style]}>{children}</GlassSurface>;
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} style={styles.press}>{body}</Pressable>
  ) : body;
}

const styles = StyleSheet.create({ press: { borderRadius: 22 }, card: { borderRadius: 22, padding: 16, gap: 6, minHeight: 48 } });
