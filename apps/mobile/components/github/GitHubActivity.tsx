import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { ORIGIN } from '~/constants/site';
import { select, tap } from '~/lib/haptics';
import { openUrl } from '~/lib/links';
import { maxScale, mono, radius, typography, useTheme } from '~/theme';
import {
  computeStats,
  describeDay,
  describePeriod,
  flattenDays,
  formatShortDate,
  GITHUB_PROFILE_URL,
  GITHUB_USERNAME,
  MONTHS,
  type ContributionData,
  type ContributionDay,
  type ContributionResponse,
} from '@/lib/github-contributions';

// The app never talks to GitHub or holds a token: it reads the portfolio's own backend endpoint.
const ENDPOINT = `${process.env.EXPO_PUBLIC_API_ORIGIN ?? ORIGIN}/api/github/contributions`;
const CELL = 14;
const GAP = 4;
const LEFT = 30;
const TOP = 20;

type State = { status: 'loading' } | { status: 'ready'; data: ContributionData; stale: boolean } | { status: 'error'; message: string };
const MESSAGES: Record<string, string> = {
  not_configured: 'Live contribution data is not connected yet.',
  rate_limited: 'GitHub is rate limiting requests right now. Please try again shortly.',
  unavailable: 'GitHub activity is unavailable right now.',
};

/** Level fills from the app's gold, at the same strengths as the website. */
const levelColor = (level: number, accent: string, empty: string) => {
  if (level === 0) return empty;
  const alpha = [0, 0.32, 0.56, 0.8, 1][level];
  const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${accent}${hex}`;
};

export default function GitHubActivity() {
  const t = useTheme();
  const period = 'rolling';
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<ContributionDay | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    setSelected(null);
    (async () => {
      try {
        const res = await fetch(period === 'rolling' ? ENDPOINT : `${ENDPOINT}?year=${period}`, { signal: controller.signal });
        const body = (await res.json()) as ContributionResponse;
        if (body.data) setState({ status: 'ready', data: body.data, stale: Boolean(body.stale) });
        else setState({ status: 'error', message: MESSAGES[body.error ?? 'unavailable'] ?? MESSAGES.unavailable });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState({ status: 'error', message: MESSAGES.unavailable });
      }
    })();
    return () => controller.abort();
  }, [period, attempt]);

  const ready = state.status === 'ready' ? state : null;
  const stats = useMemo(() => (ready ? computeStats(flattenDays(ready.data.weeks), ready.data.total, ready.data.period.key === 'rolling') : null), [ready]);

  const weeks = ready?.data.weeks ?? [];
  const width = LEFT + weeks.length * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);
  const text = { color: t.ink };
  const muted = { color: t.text2 };
  const empty = t.dark ? 'rgba(236,232,217,0.08)' : 'rgba(37,35,63,0.07)';

  return (
    <View style={{ marginTop: 56 }}>
      <Text maxFontSizeMultiplier={maxScale.label} style={[typography.label, text]}>GITHUB ACTIVITY</Text>
      <Text accessibilityRole="header" maxFontSizeMultiplier={maxScale.title} style={[typography.title, text, { marginTop: 14 }]}>
        Consistency in <Text style={typography.em}>code.</Text>
      </Text>
      <Text maxFontSizeMultiplier={maxScale.body} style={[typography.bodySmall, muted, { marginTop: 10 }]}>
        A visual record of building, learning and contributing — one day at a time.
      </Text>

      <View style={{ marginTop: 18, padding: 16, borderRadius: radius.card, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
        {state.status === 'loading' ? (
          <View accessibilityRole="progressbar" accessibilityLabel="Loading GitHub activity" style={{ height: height + 90, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={t.ink} />
          </View>
        ) : state.status === 'error' ? (
          <View accessibilityLiveRegion="polite" style={{ minHeight: height, justifyContent: 'center', gap: 12 }}>
            <Text maxFontSizeMultiplier={maxScale.body} style={[typography.bodySmall, text]}>{state.message}</Text>
            <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
              <Pressable accessibilityRole="button" onPress={() => { tap(); setAttempt((a) => a + 1); }} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[typography.caption, text, { textDecorationLine: 'underline' }]}>Try again</Text>
              </Pressable>
              <Pressable accessibilityRole="link" onPress={() => openUrl(GITHUB_PROFILE_URL)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[typography.caption, text, { textDecorationLine: 'underline' }]}>View the profile on GitHub</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {state.stale ? <Text style={[typography.caption, muted, { marginBottom: 8 }]}>Showing saved data from {formatShortDate(state.data.fetchedAt.slice(0, 10))}; GitHub could not be reached.</Text> : null}
            <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
              <View style={{ width, height }}>
              <Svg width={width} height={height} accessibilityLabel={`GitHub contributions, ${state.data.total} in the period ${describePeriod(state.data.period)}`}>
                {weeks.flatMap((w, wi) =>
                  w.days.map((d) => (
                    <Rect
                      key={d.date}
                      x={LEFT + wi * (CELL + GAP)}
                      y={TOP + d.weekday * (CELL + GAP)}
                      width={CELL}
                      height={CELL}
                      rx={3}
                      fill={levelColor(d.level, t.accent, empty)}
                      stroke={selected?.date === d.date ? t.ink : 'transparent'}
                      strokeWidth={2}
                      onPress={() => { select(); setSelected(d); }}
                    />
                  )),
                )}
              </Svg>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
                {weeks.map((w, wi) => {
                  const first = w.days[0];
                  if (!first) return null;
                  const month = Number(first.date.slice(5, 7)) - 1;
                  const prevMonth = wi > 0 ? Number(weeks[wi - 1].days[0]?.date.slice(5, 7)) - 1 : -1;
                  if (month === prevMonth || (wi === 0 && weeks.length > 6 && Number(first.date.slice(8, 10)) > 21)) return null;
                  return <Text key={wi} maxFontSizeMultiplier={1.1} style={{ position: 'absolute', left: LEFT + wi * (CELL + GAP), top: 0, fontFamily: mono, fontSize: 10, color: t.text2 }}>{MONTHS[month]}</Text>;
                })}
                {['Mon', 'Wed', 'Fri'].map((l, i) => (
                  <Text key={l} maxFontSizeMultiplier={1.1} style={{ position: 'absolute', left: 0, top: TOP + (1 + i * 2) * (CELL + GAP) + 1, fontFamily: mono, fontSize: 10, color: t.text2 }}>{l}</Text>
                ))}
              </View>
              </View>
            </ScrollView>
            <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={maxScale.caption} style={[typography.caption, muted, { marginTop: 10, minHeight: 36 }]}>
              {selected ? describeDay(selected) : 'Tap a day for its exact count.'}
            </Text>
            <View accessible accessibilityLabel="Contribution intensity from less to more, five levels" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <Text style={[typography.caption, muted]}>Less</Text>
              {[0, 1, 2, 3, 4].map((l) => <View key={l} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: levelColor(l, t.accent, empty) }} />)}
              <Text style={[typography.caption, muted]}>More</Text>
            </View>
          </>
        )}
      </View>

      {stats && ready ? (
        <View style={{ marginTop: 20 }}>
          <Text maxFontSizeMultiplier={maxScale.caption} style={[typography.caption, muted]}>Reporting period: {describePeriod(ready.data.period)} (UTC)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            {[
              ['Total contributions', stats.total.toLocaleString('en-GB'), 'in this period'],
              [stats.streakIsCurrent ? 'Current streak' : 'Streak at period end', String(stats.currentStreak), stats.currentStreak === 1 ? 'day' : 'days'],
              ['Longest streak', String(stats.longestStreak), stats.longestStreak === 1 ? 'day' : 'days'],
              ['Most active day', stats.mostActive ? String(stats.mostActive.count) : '—', stats.mostActive ? `on ${formatShortDate(stats.mostActive.date)}` : 'no activity'],
              ['Active days', String(stats.activeDays), 'days with activity'],
            ].map(([k, v, note]) => (
              <View key={k} accessible accessibilityLabel={`${k}: ${v} ${note}`} style={{ width: '47%', flexGrow: 1, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 12 }}>
                <Text maxFontSizeMultiplier={maxScale.label} style={[typography.label, muted]}>{k.toUpperCase()}</Text>
                <Text maxFontSizeMultiplier={maxScale.title} style={[typography.title, text, { marginTop: 6 }]}>{v}</Text>
                <Text maxFontSizeMultiplier={maxScale.caption} style={[typography.caption, muted]}>{note}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable accessibilityRole="link" accessibilityLabel={`@${GITHUB_USERNAME} on GitHub, opens GitHub`} onPress={() => { tap(); openUrl(GITHUB_PROFILE_URL); }} style={{ minHeight: 44, justifyContent: 'center', marginTop: 12 }}>
        <Text style={[typography.caption, text, { textDecorationLine: 'underline' }]}>@{GITHUB_USERNAME} on GitHub ↗</Text>
      </Pressable>
      <Text maxFontSizeMultiplier={maxScale.caption} style={[typography.caption, muted]}>Private contributions appear only where the GitHub profile shares them. Days are counted in UTC.</Text>
    </View>
  );
}
