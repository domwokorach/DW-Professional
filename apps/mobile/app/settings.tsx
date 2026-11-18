import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { RetroIconButton, RetroRadioRow } from '~/components/retro';
import { Body, Card, H2, Screen, SectionTag } from '~/components/ui';
import { select } from '~/lib/haptics';
import { maxScale, mono } from '~/theme';
import { useAppTheme, type AppearancePreference } from '~/theme/appearance';

const OPTIONS: { value: AppearancePreference; label: string; detail: string }[] = [
  { value: 'system', label: 'System', detail: 'Follow iPhone settings' },
  { value: 'light', label: 'Light', detail: 'Always use Light Mode' },
  { value: 'dark', label: 'Dark', detail: 'Always use Dark Mode' },
];

export default function Settings() {
  const router = useRouter();
  const { preference, setPreference, scheme, theme: t } = useAppTheme();
  return (
    <Screen>
      <View style={styles.top}>
        <RetroIconButton sf="chevron.left" fallback="chevron-back" label="Back" onPress={() => router.back()} />
      </View>
      <SectionTag label="SETTINGS" />
      <H2 em="Appearance.">{''}</H2>
      <View style={{ gap: 16, marginTop: 20 }}>
        <Card>
          {OPTIONS.map((o) => (
            <View key={o.value} style={styles.row}>
              <RetroRadioRow label={o.label} selected={o.value === preference} onPress={() => setPreference(o.value)} />
              <Text maxFontSizeMultiplier={maxScale.body} style={[styles.detail, { color: t.text2, flex: 1, textAlign: 'right' }]}>{o.detail}</Text>
            </View>
          ))}
        </Card>
        <Body>{preference === 'system' ? `Now showing ${scheme} mode, matching your iPhone.` : `Always ${scheme} mode, whatever your iPhone is set to.`}</Body>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: 4 },
  title: { fontSize: 17 },
  detail: { fontFamily: mono, fontSize: 11, marginTop: 2 },
  check: { fontSize: 20, fontWeight: '700' },
});
