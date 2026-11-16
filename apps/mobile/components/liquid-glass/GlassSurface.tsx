import { GlassView } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '~/theme';
import { useGlass } from './useGlass';

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
  interactive?: boolean;
  /** Draw the stronger "prominent" fallback fill (used behind primary controls). */
  prominent?: boolean;
};

/**
 * The one place that decides between the system Liquid Glass material and the fallback. On iOS 26+ it is a real
 * `GlassView`; otherwise (older iOS, Android, Reduce Transparency, Increase Contrast) it is an opaque card-style
 * translucent surface with a hairline border, so text always keeps its contrast.
 */
export default function GlassSurface({ children, style, tint, interactive, prominent }: Props) {
  const t = useTheme();
  const { native, highContrast } = useGlass();
  if (native) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={tint} colorScheme={t.dark ? 'dark' : 'light'} style={style}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[styles.base, { backgroundColor: prominent && tint ? tint : t.dark ? 'rgba(44,44,46,0.86)' : 'rgba(255,255,255,0.88)', borderColor: highContrast ? t.ink : t.line }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ base: { borderWidth: StyleSheet.hairlineWidth * 2 } });
