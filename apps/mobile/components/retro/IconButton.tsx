import type { SFSymbol } from 'expo-symbols';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { tap } from '~/lib/haptics';
import { toneColors, useRetro, type Tone } from '~/theme/retro';
import Symbol from './Symbol';
import { Raised } from './Surface';
import { useScale } from './useScale';
import { StyleSheet } from 'react-native';

type Props = { sf: SFSymbol; fallback: React.ComponentProps<typeof Symbol>['fallback']; label: string; onPress: () => void; hint?: string; disabled?: boolean; size?: number; round?: boolean; tone?: Tone };

/** Icon tile from the reference: a filled rounded square (or circle with `round`) in teal by default, or an outlined one with tone="outline". 48pt minimum; `label` is the VoiceOver name. */
export default function IconButton({ sf, fallback, label, onPress, hint, disabled, size = 52, round, tone = 'teal' }: Props) {
  const r = useRetro();
  const scale = useScale(0.94);
  const c = toneColors(r, tone);
  return (
    <Animated.View style={[scale.style, { opacity: disabled ? 0.4 : 1 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={() => { tap(); onPress(); }} onPressIn={scale.pressIn} onPressOut={scale.pressOut} hitSlop={4} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
        <Raised radius={round ? size / 2 : 14} tone={tone} style={{ width: size, height: size }} contentStyle={styles.center}>
          <Symbol sf={sf} fallback={fallback} size={22} color={c.fg} weight="bold" />
        </Raised>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
