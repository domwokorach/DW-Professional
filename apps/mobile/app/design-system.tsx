import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  RetroButton, RetroDropdown, RetroHorizontalSlider, RetroIconButton, RetroInput, RetroRadioRow,
  RetroRow, RetroSearch, RetroToggle, RetroTypographyCard, RetroVerticalSlider, useToast,
} from '~/components/retro';
import { H2, Screen, SectionTag } from '~/components/ui';
import { SITE_URL } from '~/constants/site';
import { socialLinks } from '~/lib/data';
import { setHapticsEnabled } from '~/lib/haptics';
import { openUrl } from '~/lib/links';
import { maxScale } from '~/theme';
import { useRetro } from '~/theme/retro';

const PRESETS = { Balanced: [0.45, 0.7, 0.3, 0.9, 0.55], Peaks: [0.85, 0.35, 0.95, 0.2, 0.6] } as const;
type Preset = keyof typeof PRESETS;
const SORTS = ['Newest first', 'Oldest first', 'A to Z'];

/** The soft-UI kit on one page: every component is live (drag the sliders, flip the switches, type in the fields). */
export default function DesignSystem() {
  const n = useRetro();
  const router = useRouter();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const [preset, setPreset] = useState<Preset>('Balanced');
  const [bars, setBars] = useState<number[]>([...PRESETS.Balanced]);
  const [level, setLevel] = useState(0.5);
  const [haptics, setHaptics] = useState(true);
  const [values, setValues] = useState(false);
  const [sort, setSort] = useState(SORTS[0]);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const linkedin = socialLinks.find((s) => s.label === 'LinkedIn');
  // Five bars + gaps always fit: size them from the screen instead of a fixed pixel width.
  const barW = Math.max(40, Math.min(52, Math.floor((width - 40 - 4 * 14) / 5)));

  const choose = (p: Preset) => { setPreset(p); setBars([...PRESETS[p]]); };
  const nudge = (d: number) => setLevel((v) => Math.min(1, Math.max(0, Math.round((v + d) * 100) / 100)));

  return (
    <Screen>
      <View style={styles.top}>
        <RetroIconButton sf="chevron.left" fallback="chevron-back" label="Back" onPress={() => router.back()} />
      </View>
      <SectionTag label="UI KIT" />
      <H2 em="kit.">Retro </H2>

      <View style={[styles.row, { marginTop: 52 }]}>
        <RetroTypographyCard size={Math.min(128, width * 0.3)} />
        <View style={{ flex: 1, gap: 20 }}>
          <RetroButton label="Button" hint="Shows a confirmation" onPress={() => toast.show('Button pressed')} />
          <RetroInput label="Input" placeholder="Input" centered value={text} onChangeText={setText} />
        </View>
      </View>

      <View style={[styles.row, { marginTop: 32, justifyContent: 'space-between' }]}>
        <RetroIconButton sf="chevron.left" fallback="chevron-back" label="Decrease level by 10 percent" onPress={() => nudge(-0.1)} />
        <RetroIconButton sf="chevron.right" fallback="chevron-forward" label="Increase level by 10 percent" onPress={() => nudge(0.1)} />
        <View style={{ gap: 14 }}>
          <RetroToggle label="Haptics" value={haptics} onValueChange={(v) => { setHaptics(v); setHapticsEnabled(v); }} />
          <RetroToggle label="Show slider values" value={values} onValueChange={setValues} />
        </View>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Slider preset" style={[styles.row, { marginTop: 24, columnGap: 28, flexWrap: 'wrap' }]}>
        {(Object.keys(PRESETS) as Preset[]).map((p) => <RetroRadioRow key={p} label={p} selected={preset === p} onPress={() => choose(p)} />)}
      </View>

      <View style={{ marginTop: 28, gap: 20 }}>
        <RetroRow>
          <RetroButton label="Share" icon={{ sf: 'square.and.arrow.up', fallback: 'share-outline' }} hint="Opens the share sheet" onPress={() => { void Share.share({ message: `DOMINIC — Software Engineer & Frontend Developer: ${SITE_URL}`, url: SITE_URL }); }} />
          <RetroButton label="Label" icon={{ sf: 'mappin.and.ellipse', fallback: 'location-outline' }} hint="Opens London in Maps" onPress={() => openUrl('https://maps.apple.com/?q=London')} />
          <RetroButton label="Add User" icon={{ sf: 'person.badge.plus', fallback: 'person-add-outline' }} hint="Opens LinkedIn to connect" onPress={() => linkedin && openUrl(linkedin.href)} />
        </RetroRow>
        <RetroDropdown label="Sort" options={SORTS} value={sort} onChange={(v) => { setSort(v); toast.show(`Sorted: ${v}`); }} />
        <RetroSearch label="Search the kit" value={query} onChangeText={setQuery} />
        {query ? <Text accessibilityLiveRegion="polite" style={{ color: n.muted, fontSize: 15, paddingHorizontal: 8 }}>{`Searching for “${query}”`}</Text> : null}
      </View>

      <View style={[styles.bars, { marginTop: 36 }]}>
        {bars.map((b, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 10 }}>
            <RetroVerticalSlider tone={i % 2 ? 'orange' : 'teal'} label={`Slider ${i + 1}`} width={barW} height={210} value={b} onChange={(v) => setBars((cur) => cur.map((x, j) => (j === i ? v : x)))} />
            {values ? <Text maxFontSizeMultiplier={maxScale.caption} style={{ color: n.text, fontSize: 13, fontWeight: '800' }}>{Math.round(b * 100)}</Text> : null}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 28 }}>
        <RetroHorizontalSlider label="Level" value={level} onChange={setLevel} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-start', marginBottom: 8, paddingLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
});
