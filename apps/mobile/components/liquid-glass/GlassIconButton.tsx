import type { SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tap } from '~/lib/haptics';
import { pressScale, radius, spring, useTheme } from '~/theme';
import GlassSurface from './GlassSurface';
import Symbol from './Symbol';

type Props = { sf: SFSymbol; selectedSf?: SFSymbol; fallback: React.ComponentProps<typeof Symbol>['fallback']; label: string; onPress: () => void; hint?: string; selected?: boolean; tint?: string; size?: number };

/** Round glass icon control (48pt target): spring press, filled symbol while selected, light haptic. `label` is required: it is the VoiceOver name. */
export default function GlassIconButton({ sf, selectedSf, fallback, label, onPress, hint, selected, tint, size = 48 }: Props) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ selected: !!selected }}
        onPress={() => { tap(); onPress(); }}
        onPressIn={() => { scale.value = withSpring(pressScale, spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, spring.press); }}
        hitSlop={4}
        style={styles.press}
      >
        <GlassSurface interactive tint={selected ? tint ?? t.ink : tint} style={[styles.surface, { width: size, height: size }]}>
          <Symbol sf={sf} selectedSf={selectedSf} fallback={fallback} color={selected && !tint ? t.onInk : t.ink} selected={selected} />
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ press: { borderRadius: radius.pill }, surface: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' } });
