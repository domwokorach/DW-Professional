import { Pressable, ScrollView, Text } from 'react-native';
import { select } from '~/lib/haptics';
import { maxScale, mono } from '~/theme';
import { useContributionColors } from './palette';

/** Period picker: the rolling year plus every year GitHub reports activity for. */
export default function ContributionYearSelector({ years, value, onChange }: { years: number[]; value: number | null; onChange: (y: number | null) => void }) {
  const { t } = useContributionColors();
  const options = [{ label: 'Last 12 months', year: null as number | null }, ...years.map((y) => ({ label: String(y), year: y as number | null }))];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.year === value;
        return (
          <Pressable
            key={o.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.year === null ? 'Last 12 months' : `Year ${o.year}`}
            onPress={() => { if (!on) { select(); onChange(o.year); } }}
            style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : 'transparent', justifyContent: 'center' }}
          >
            <Text maxFontSizeMultiplier={maxScale.label} style={{ fontFamily: mono, fontSize: 12, letterSpacing: 0.5, color: on ? t.onInk : t.ink }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
