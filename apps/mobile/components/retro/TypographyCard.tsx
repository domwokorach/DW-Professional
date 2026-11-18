import { StyleSheet, Text } from 'react-native';
import { useRetro } from '~/theme/retro';
import { Raised } from './Surface';

/** The "Aa" tile: a navy rounded square with bold orange lettering, in the style of the reference's icon tiles. */
export default function TypographyCard({ size = 120, text = 'Aa' }: { size?: number; text?: string }) {
  const r = useRetro();
  return (
    <Raised radius={size * 0.2} tone="navy" style={{ width: size, height: size }} contentStyle={styles.center}>
      <Text accessibilityLabel="Typography sample" style={[styles.glyph, { color: r.orange, fontSize: size * 0.48 }]}>{text}</Text>
    </Raised>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' }, glyph: { fontWeight: '800', letterSpacing: -1 } });
