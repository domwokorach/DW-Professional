import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useContributions } from '@/components/github/use-contributions';
import type { ContributionsErrorCode } from '@/lib/github/types';
import { Body, H2, SectionTag } from '~/components/ui';
import { maxScale, mono } from '~/theme';
import ContributionCalendar from './ContributionCalendar';
import ContributionLegend from './ContributionLegend';
import ContributionStats from './ContributionStats';
import ContributionYearSelector from './ContributionYearSelector';
import GitHubProfileLink from './GitHubProfileLink';
import { useContributionColors } from './palette';

/** Public site origin: the secure backend route holds GITHUB_TOKEN, so the app never talks to GitHub itself. */
const ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN || 'https://www.dominicwokorach.me';

const MESSAGES: Record<ContributionsErrorCode | 'network', string> = {
  not_configured: 'The live calendar isn’t connected yet. It will appear here as soon as it is.',
  rate_limited: 'GitHub is limiting requests right now. Please try again in a few minutes.',
  unauthorized: 'The GitHub connection needs attention. Please check back soon.',
  not_found: 'No GitHub activity was found for that period.',
  year_unavailable: 'No GitHub activity was recorded for that year.',
  invalid_request: 'That period isn’t available.',
  upstream: 'GitHub activity is temporarily unavailable.',
  network: 'Couldn’t reach the server. Check your connection and try again.',
};

export function GitHubActivitySection() {
  const { t } = useContributionColors();
  const [year, setYear] = useState<number | null>(null);
  const state = useContributions(year, ORIGIN);
  const data = state.data;
  const note = { fontSize: 13, lineHeight: 19, color: t.text2 } as const;

  return (
    <View>
      <SectionTag label="GITHUB ACTIVITY" />
      <H2 em="code.">{'Consistency in '}</H2>
      <Body style={{ marginTop: 12 }}>A visual record of building, learning and contributing — one day at a time.</Body>
      <View style={{ marginTop: 20, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.cream2 }}>
        {data ? <ContributionYearSelector years={data.availableYears} value={year} onChange={setYear} /> : null}
        <GitHubProfileLink />

        {!data && state.status === 'loading' ? (
          <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Loading GitHub activity" accessibilityRole="progressbar">
            <ActivityIndicator color={t.accent} />
          </View>
        ) : null}

        {!data && state.status === 'error' ? (
          <View style={{ gap: 12, paddingVertical: 12 }} accessibilityRole="alert">
            <Text maxFontSizeMultiplier={maxScale.body} style={{ fontSize: 15, lineHeight: 22, color: t.ink }}>{MESSAGES[state.code]}</Text>
            {state.code !== 'not_configured' ? (
              <Pressable accessibilityRole="button" onPress={state.retry} style={{ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 20, borderRadius: 999, backgroundColor: t.ink, justifyContent: 'center' }}>
                <Text style={{ fontFamily: mono, fontSize: 12, letterSpacing: 0.6, color: t.onInk }}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {data ? (
          <View style={{ opacity: state.status === 'loading' ? 0.55 : 1, marginTop: 8 }} accessibilityState={{ busy: state.status === 'loading' }}>
            <ContributionCalendar key={`${data.period.kind}-${data.period.year}`} calendar={data.calendar} />
            {data.calendar.totalContributions === 0 ? <Text style={[note, { marginTop: 8 }]}>No public contributions in this period yet.</Text> : null}
            <View style={{ marginTop: 10, gap: 12 }}>
              <Text maxFontSizeMultiplier={maxScale.caption} style={note}>
                {data.stale ? 'Showing saved data; GitHub is temporarily unavailable. ' : ''}Counts follow my GitHub profile’s visibility settings; private repository details are never shown.
              </Text>
              <ContributionLegend calendar={data.calendar} />
            </View>
            {state.status === 'error' ? <Text style={[note, { marginTop: 10, color: t.ink }]} accessibilityRole="alert">{MESSAGES[state.code]} Showing {data.period.kind === 'year' ? data.period.year : 'the last 12 months'} instead.</Text> : null}
            <ContributionStats data={data} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
