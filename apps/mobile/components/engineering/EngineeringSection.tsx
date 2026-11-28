import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useEngineeringStatus } from '@/components/engineering/use-engineering-status';
import { capabilities, engineeringLinks, repoUrl, type EngineeringIcon } from '@/data/engineering';
import { checkFor, formatWhen, isStale } from '@/lib/engineering/format';
import { STATUS_LABELS, type CheckState } from '@/lib/engineering/types';
import { Body, H2, SectionTag } from '~/components/ui';
import { openUrl } from '~/lib/links';
import { maxScale, mono, useTheme } from '~/theme';

/** Same secure backend route as the website: it holds every credential, so the app never talks to GitHub or Jenkins. */
const ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN || 'https://www.dominicwokorach.me';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<EngineeringIcon, IconName> = {
  testing: 'flask-outline', jenkins: 'git-network-outline', actions: 'git-pull-request-outline', typescript: 'code-slash-outline',
  quality: 'scan-outline', security: 'shield-checkmark-outline', accessibility: 'accessibility-outline', vercel: 'rocket-outline',
  source: 'git-branch-outline', architecture: 'layers-outline',
};

export function EngineeringSection() {
  const t = useTheme();
  const state = useEngineeringStatus(ORIGIN);
  const status = state.phase === 'ready' ? state.data : null;
  const stale = status ? isStale(status) : false;
  const dot = (s: CheckState | 'checking') => (s === 'passed' ? t.live : s === 'failed' ? (t.dark ? '#ff9a9a' : '#a3262a') : s === 'running' ? t.accent : t.text2);

  return (
    <View>
      <SectionTag num="10" label="ENGINEERING" />
      <H2 em="Delivered.">{'Built. Tested. '}</H2>
      <Body style={{ marginTop: 12 }}>Engineering beyond the interface. Automated quality assurance, maintainable architecture and reliable delivery workflows.</Body>

      <View style={{ gap: 14, marginTop: 20 }}>
        {capabilities.map((c) => {
          const check = state.phase === 'loading' ? null : checkFor(status, c.statusKey);
          const pill: CheckState | 'checking' = c.statusKey ? (check ? check.state : 'checking') : 'checking';
          const label = pill === 'checking' ? 'Checking' : STATUS_LABELS[pill];
          return (
            <View key={c.id} style={{ padding: 22, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.card }}>
              <View style={{ position: 'absolute', left: 22, top: -1, width: 36, height: 2, backgroundColor: t.accent }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2.4, color: t.text2 }}>{c.number}</Text>
                <Ionicons name={ICONS[c.icon]} size={22} color={t.dark ? t.accent : '#7a5f1e'} accessibilityElementsHidden importantForAccessibility="no" />
              </View>
              <Text accessibilityRole="header" maxFontSizeMultiplier={maxScale.heading} style={{ fontFamily: 'Georgia', fontSize: 22, lineHeight: 27, color: t.ink }}>{`${c.number}. ${c.title}`}</Text>
              <Text maxFontSizeMultiplier={maxScale.body} style={{ marginTop: 8, fontSize: 15, lineHeight: 23, color: t.text3 }}>{c.description}</Text>
              {c.statusKey ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16, minHeight: 28 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 26, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: t.line }}>
                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot(pill) }} />
                    <Text maxFontSizeMultiplier={maxScale.label} style={{ fontFamily: mono, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: t.ink }}>{label}{stale && pill !== 'checking' ? ' · Stale data' : ''}</Text>
                  </View>
                  {check?.detail ? <Text maxFontSizeMultiplier={maxScale.caption} style={{ fontFamily: mono, fontSize: 11.5, color: t.text2 }}>{check.detail}</Text> : null}
                </View>
              ) : null}
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${c.link.label}, opens in browser`}
                onPress={() => openUrl(repoUrl(c.link))}
                hitSlop={8}
                style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: 8 }}
              >
                <Text style={{ fontFamily: mono, fontSize: 12, letterSpacing: 0.7, color: t.ink, textDecorationLine: 'underline' }}>{c.link.label} ↗</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 22, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: t.line, backgroundColor: t.cream2 }} accessibilityLiveRegion="polite">
        <Text accessibilityRole="header" style={{ fontFamily: mono, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase', color: t.text2 }}>Live status</Text>
        {state.phase === 'loading' ? <ActivityIndicator color={t.accent} style={{ marginVertical: 16 }} accessibilityLabel="Checking live status" /> : null}
        {status ? (
          <View style={{ marginTop: 8 }}>
            {[
              ['Latest CI run', `${STATUS_LABELS[status.ci.state]}${status.ci.detail ? ` · ${status.ci.detail}` : ''}`],
              ['Last successful build', status.lastSuccessfulBuild ? `${status.lastSuccessfulBuild.sha.slice(0, 7)} · ${formatWhen(status.lastSuccessfulBuild.at)}` : 'Not available'],
              ['Latest commit', status.commit ? `${status.commit.shortSha} ${status.commit.message}` : 'Not available'],
              ['Production deployment', STATUS_LABELS[status.deployment.state]],
              ['Jenkins', STATUS_LABELS[status.jenkins.state]],
              ['Tests and coverage', status.report ? `${status.report.tests.passed} of ${status.report.tests.total} passed · lines ${status.report.coverage.lines}% · branches ${status.report.coverage.branches}% · functions ${status.report.coverage.functions}%` : 'No report published for the latest successful build'],
            ].map(([term, value]) => (
              <View key={term} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.line }} accessible accessibilityLabel={`${term}: ${value}`}>
                <Text style={{ fontSize: 13, color: t.text2 }}>{term}</Text>
                <Text maxFontSizeMultiplier={maxScale.body} style={{ marginTop: 2, fontSize: 14, lineHeight: 20, color: t.ink }}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {state.phase === 'error' ? <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 21, color: t.ink }}>Live status is unavailable right now. Nothing on this page is guessed.</Text> : null}
        {status ? <Text style={{ marginTop: 10, fontFamily: mono, fontSize: 12, color: t.text2 }}>{stale ? `Showing stale data. Last verified ${formatWhen(status.fetchedAt)}.` : `Last verified ${formatWhen(status.fetchedAt)}.`}</Text> : null}
      </View>

      <View style={{ gap: 10, marginTop: 20 }}>
        {engineeringLinks.map((l) => (
          <Pressable
            key={l.label}
            accessibilityRole="link"
            accessibilityLabel={`${l.label}, opens in browser`}
            onPress={() => openUrl(l.href ?? repoUrl(l))}
            style={{ minHeight: 48, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: t.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: t.ink }}>{l.label}</Text>
            <Text style={{ fontSize: 14, color: t.ink }}>↗</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
