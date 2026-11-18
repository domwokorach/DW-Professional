import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { CoreTech } from '@/types';
import { stackIcons } from '~/lib/data';
import { useTheme } from '~/theme';

/** Renders the website's offline Iconify SVG (src/data/stack-icons.ts) with the tech's light/dark colour. */
export default function TechIcon({ tech, size = 22 }: { tech: CoreTech; size?: number }) {
  const t = useTheme();
  const icon = stackIcons[tech.icon];
  if (!icon) return <View style={{ width: size, height: size }} />;
  const color = (t.dark ? tech.colorDark : undefined) ?? tech.color ?? t.ink;
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}">${icon.body}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color} accessibilityElementsHidden importantForAccessibility="no" />;
}
