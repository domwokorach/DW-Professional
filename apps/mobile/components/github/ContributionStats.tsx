import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { computeStats, formatShortDate, plural } from '@/lib/github/stats';
import type { ContributionsPayload } from '@/lib/github/types';
import { maxScale, mono } from '~/theme';
import AnimatedNumber from './AnimatedNumber';
import { useContributionColors } from './palette';

/** Statistics for the selected period only, derived from the real calendar days with the same maths as the website. */
export default function ContributionStats({ data }: { data: ContributionsPayload }) {
  const { t } = useContributionColors();
  const s = useMemo(() => computeStats(data.calendar), [data.calendar]);
  const past = data.period.kind === 'year' && (data.period.year ?? 0) < new Date().getUTCFullYear();
  const items = [
    { label: 'TOTAL CONTRIBUTIONS', value: s.total, unit: '', note: `${plural(s.totalDays, 'day')} in this period` },
    { label: past ? 'STREAK AT YEAR END' : 'CURRENT STREAK', value: s.currentStreak, unit: s.currentStreak === 1 ? 'day' : 'days', note: s.currentStreak ? 'Consecutive days with activity' : 'No active streak' },
    { label: 'LONGEST STREAK', value: s.longestStreak, unit: s.longestStreak === 1 ? 'day' : 'days', note: s.longestStreakRange ? `${formatShortDate(s.longestStreakRange.start)} – ${formatShortDate(s.longestStreakRange.end)}` : 'No activity yet' },
    { label: 'MOST ACTIVE DAY', value: s.mostActiveDay?.count ?? 0, unit: s.mostActiveDay?.count === 1 ? 'contribution' : 'contributions', note: s.mostActiveDay ? formatShortDate(s.mostActiveDay.date) : 'No activity yet' },
    { label: 'ACTIVE DAYS', value: s.activeDays, unit: `of ${s.totalDays}`, note: s.totalDays ? `${Math.round((s.activeDays / s.totalDays) * 100)}% of days` : '' },
  ];
  return (
    <View style={{ marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: t.line }}>
      {s.range ? <Text maxFontSizeMultiplier={maxScale.label} style={{ fontFamily: mono, fontSize: 12, letterSpacing: 0.6, lineHeight: 18, color: t.text2, marginBottom: 14 }}>Reporting period: {formatShortDate(s.range.start)} – {formatShortDate(s.range.end)} (UTC)</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {items.map((i, idx) => (
          <View key={i.label} accessible accessibilityLabel={`${i.label.toLowerCase()}: ${i.value.toLocaleString('en-GB')} ${i.unit}. ${i.note}`} style={{ flexGrow: 1, flexBasis: idx === 0 ? '100%' : '46%', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.cream, gap: 6 }}>
            <Text maxFontSizeMultiplier={maxScale.label} style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1.4, color: t.text2 }}>{i.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <AnimatedNumber value={i.value} style={{ fontSize: 32, fontWeight: '700', letterSpacing: -1, color: t.ink }} />
              {i.unit ? <Text maxFontSizeMultiplier={maxScale.caption} style={{ fontSize: 13, color: t.text2 }}>{i.unit}</Text> : null}
            </View>
            <Text maxFontSizeMultiplier={maxScale.caption} style={{ fontSize: 13, lineHeight: 18, color: t.text2 }}>{i.note}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
