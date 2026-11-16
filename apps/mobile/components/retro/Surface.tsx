import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { toneColors, useRetro, type Tone } from '~/theme/retro';

type Props = { children?: ReactNode; radius?: number; /** Kept for call-site compatibility; the retro style is flat. */ depth?: string; tone?: Tone; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle> };

/** Flat panel: 2pt outline on paper (tone `outline`) or a solid teal / navy / orange fill. No shadows, as in the reference kit. */
export function Raised({ children, radius = 16, tone = 'outline', style, contentStyle }: Props) {
  const r = useRetro();
  const c = toneColors(r, tone);
  return (
    <View style={[{ borderRadius: radius, borderWidth: 2, borderColor: c.border, backgroundColor: tone === 'outline' ? r.paper : c.bg }, style]}>
      <View style={[{ flexGrow: 1, borderRadius: radius - 2 }, contentStyle]}>{children}</View>
    </View>
  );
}

/** Outlined field: 2pt teal outline (or `ring`, e.g. orange when focused) on a transparent fill, clipped to the radius. */
export function Inset({ children, radius = 12, style, contentStyle, ring }: Omit<Props, 'depth' | 'tone'> & { ring?: string }) {
  const r = useRetro();
  return (
    <View style={[{ borderRadius: radius, borderWidth: 2, borderColor: ring ?? r.teal, backgroundColor: r.paper, overflow: 'hidden' }, style]}>
      <View style={[{ flexGrow: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}
