import { memo, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { describeDay, formatLongDate, monthMarkers, plural, toCells, type CalendarCell } from '@/lib/github/stats';
import type { ContributionCalendar as Calendar } from '@/lib/github/types';
import { select } from '~/lib/haptics';
import { maxScale, mono } from '~/theme';
import { useContributionColors } from './palette';

const CELL = 15;
const GAP = 3;
const COL = CELL + GAP;
const LABEL_W = 30;

const Cell = memo(function Cell({ cell, selected, color, ring, onPick, ink }: { cell: CalendarCell; selected: boolean; color: string; ring: boolean; ink: string; onPick: (date: string) => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={describeDay(cell.day)}
      accessibilityState={{ selected }}
      hitSlop={2}
      onPress={() => onPick(cell.day.date)}
      style={{ position: 'absolute', top: cell.row * COL, width: CELL, height: CELL, borderRadius: 3, backgroundColor: color, borderWidth: selected ? 2 : ring ? 1.5 : 0, borderColor: ink }}
    />
  );
});

/**
 * Touch heatmap: weekday labels stay put while the weeks scroll sideways (starting at the most recent). Tapping a day
 * selects it (selection haptic) and shows its exact count and date in the panel underneath, which keeps a fixed height.
 */
export default function ContributionCalendar({ calendar }: { calendar: Calendar }) {
  const { levels, t } = useContributionColors();
  const cells = useMemo(() => toCells(calendar), [calendar]);
  const markers = useMemo(() => monthMarkers(calendar), [calendar]);
  const byDate = useMemo(() => new Map(cells.map((c) => [c.day.date, c])), [cells]);
  const weeks = useMemo(() => calendar.weeks.map((_, w) => cells.filter((c) => c.week === w)), [calendar, cells]);
  const [picked, setPicked] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const onPick = useRef((date: string) => { select(); setPicked((p) => (p === date ? null : date))}).current;
  const day = picked ? byDate.get(picked)?.day : null;
  const small = { fontFamily: mono, fontSize: 11, letterSpacing: 0.6, color: t.text2 } as const;

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: LABEL_W, paddingTop: 18 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {[0, 1, 2, 3, 4, 5, 6].map((r) => (
            <View key={r} style={{ height: COL, justifyContent: 'center' }}>
              {r === 1 || r === 3 || r === 5 ? <Text maxFontSizeMultiplier={maxScale.label} style={small}>{['', 'Mon', '', 'Wed', '', 'Fri'][r]}</Text> : null}
            </View>
          ))}
        </View>
        <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })} style={{ flex: 1 }}>
          <View style={{ width: weeks.length * COL, height: 18 + 7 * COL }}>
            <View style={{ height: 18 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {markers.map((m) => <Text key={m.week} maxFontSizeMultiplier={maxScale.label} style={[small, { position: 'absolute', left: m.week * COL }]}>{m.label}</Text>)}
            </View>
            {weeks.map((col, w) => (
              <Animated.View key={w} entering={FadeIn.delay(w * 12).duration(320).reduceMotion(ReduceMotion.System)} style={{ position: 'absolute', top: 18, left: w * COL, width: CELL, height: 7 * COL }}>
                {col.map((c) => <Cell key={c.day.date} cell={c} selected={c.day.date === picked} color={levels[c.level]} ring={c.level === 4} ink={t.ink} onPick={onPick} />)}
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={{ minHeight: 52, marginTop: 12, justifyContent: 'center' }} accessibilityLiveRegion="polite">
        {day ? (
          <>
            <Text maxFontSizeMultiplier={maxScale.body} style={{ fontSize: 17, fontWeight: '700', color: t.ink }}>{day.contributionCount === 0 ? 'No contributions' : plural(day.contributionCount, 'contribution')}</Text>
            <Text maxFontSizeMultiplier={maxScale.body} style={{ fontSize: 14, color: t.text2 }}>{formatLongDate(day.date)}</Text>
          </>
        ) : <Text maxFontSizeMultiplier={maxScale.body} style={{ fontSize: 14, color: t.text2 }}>Tap a day to see its contributions.</Text>}
      </View>
    </View>
  );
}
