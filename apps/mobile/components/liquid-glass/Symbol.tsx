import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { Platform } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Props = {
  /** SF Symbol (outlined) used on iOS. */
  sf: SFSymbol;
  /** Filled variant shown while `selected`. */
  selectedSf?: SFSymbol;
  /** Ionicons glyph for Android and web, where SF Symbols do not exist. */
  fallback: IconName;
  size?: number;
  color: string;
  weight?: SymbolWeight;
  selected?: boolean;
};

/** One icon for every platform: a native SF Symbol on iOS (crisp at any scale), Ionicons elsewhere. Decorative by default: put the label on the control. */
export default function Symbol({ sf, selectedSf, fallback, size = 18, color, weight = 'medium', selected }: Props) {
  if (Platform.OS !== 'ios') return <Ionicons name={fallback} size={size} color={color} />;
  return (
    <SymbolView
      name={selected && selectedSf ? selectedSf : sf}
      size={size}
      tintColor={color}
      weight={weight}
      type="monochrome"
      animationSpec={selected ? { effect: { type: 'bounce' } } : undefined}
      fallback={<Ionicons name={fallback} size={size} color={color} />}
      accessibilityElementsHidden
    />
  );
}
