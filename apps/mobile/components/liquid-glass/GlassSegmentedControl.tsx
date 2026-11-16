import SegmentedControlBase from '@react-native-segmented-control/segmented-control';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from '~/theme';

// The package types its class component against older React typings; widen it so JSX accepts it.
const SegmentedControl = SegmentedControlBase as unknown as ComponentType<{
  values: string[];
  selectedIndex: number;
  onChange: (e: { nativeEvent: { selectedSegmentIndex: number } }) => void;
  appearance: 'light' | 'dark';
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}>;

type Props = { values: string[]; selectedIndex: number; onChange: (index: number) => void; label: string };

/**
 * The system `UISegmentedControl` (rounded container, animated selection, VoiceOver support built in). On iOS 26
 * the system draws it with Liquid Glass; earlier iOS and Android get their own native styling, so no glass is faked.
 */
export default function GlassSegmentedControl({ values, selectedIndex, onChange, label }: Props) {
  const t = useTheme();
  return (
    <SegmentedControl
      values={values}
      selectedIndex={selectedIndex}
      onChange={(e: { nativeEvent: { selectedSegmentIndex: number } }) => onChange(e.nativeEvent.selectedSegmentIndex)}
      appearance={t.dark ? 'dark' : 'light'}
      accessibilityLabel={label}
      style={styles.control}
    />
  );
}

const styles = StyleSheet.create({ control: { minHeight: 44 } });
