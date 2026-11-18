import { GlassContainer } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGlass } from './useGlass';

/**
 * Groups related actions so their glass merges where neighbouring buttons touch (`GlassContainer`, iOS 26+).
 * Without native glass it is a plain row. Merging is the system's behaviour; no morph animation is added here.
 */
export default function GlassToolbar({ children }: { children: ReactNode }) {
  const { native } = useGlass();
  return native ? (
    <GlassContainer spacing={10} style={styles.row}>{children}</GlassContainer>
  ) : (
    <View style={styles.row}>{children}</View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' } });
