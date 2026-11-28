import { Text, View } from 'react-native';
import { levelRanges, rangeText } from '@/lib/github/client';
import type { ContributionCalendar } from '@/lib/github/types';
import { maxScale, mono } from '~/theme';
import { useContributionColors } from './palette';

/** Less → More, with each step's real count range as its accessibility label. */
export default function ContributionLegend({ calendar }: { calendar: ContributionCalendar }) {
  const { levels, t } = useContributionColors();
  const ranges = levelRanges(calendar);
  const label = { fontFamily: mono, fontSize: 11, letterSpacing: 0.6, color: t.text2 } as const;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel={`Contribution intensity, less to more. ${[0, 1, 2, 3, 4].map((l) => rangeText(ranges[l] ?? null, l)).join('; ')}`}>
      <Text maxFontSizeMultiplier={maxScale.label} style={label}>Less</Text>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {levels.map((c, l) => <View key={l} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c, borderWidth: l === 4 ? 1.5 : 0, borderColor: t.ink }} />)}
      </View>
      <Text maxFontSizeMultiplier={maxScale.label} style={label}>More</Text>
    </View>
  );
}
