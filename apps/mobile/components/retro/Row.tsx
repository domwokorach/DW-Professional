import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/** Wrapping row for soft buttons. The gap leaves room for the raised shadows, which would look clipped when buttons touch. */
export default function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' } });
