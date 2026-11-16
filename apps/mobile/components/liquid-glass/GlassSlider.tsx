import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';
import { mono, useTheme } from '~/theme';
import GlassSurface from './GlassSurface';

type Props = { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; label: string; valueText: string };

/**
 * The native `UISlider` inside one glass tray. Thumb movement and haptics are the system's; the control reports a
 * readable value ("Frontend, 1 of 9") to VoiceOver, which also adjusts it with swipe up/down.
 */
export default function GlassSlider({ value, min, max, step = 1, onChange, label, valueText }: Props) {
  const t = useTheme();
  return (
    <GlassSurface style={styles.tray}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: t.text2 }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.value, { color: t.ink }]} maxFontSizeMultiplier={1.4}>{valueText}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={t.ink}
        maximumTrackTintColor={t.line}
        thumbTintColor={t.ink}
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: valueText }}
        style={styles.slider}
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  tray: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontFamily: mono, fontSize: 10, letterSpacing: 1.6 },
  value: { fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  slider: { height: 44 },
});
