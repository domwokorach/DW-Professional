import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActionSheetIOS, Appearance, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Project } from '@/types';
import { RetroButton, RetroIconButton } from '~/components/retro';
import { Badge, Body, Card } from '~/components/ui';
import { localImages } from '~/lib/images';
import { openUrl } from '~/lib/links';
import { mono, spring, timing, useTheme } from '~/theme';

/** Native action sheet on iOS, share sheet elsewhere: the system's own contextual menu for a project. */
function more(title: string, url: string) {
  if (Platform.OS !== 'ios') {
    void Share.share({ message: `${title}: ${url}` });
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions({ title, options: ['Open live project', 'Share link', 'Cancel'], cancelButtonIndex: 2, userInterfaceStyle: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light' }, (i) => {
    if (i === 0) openUrl(url);
    if (i === 1) void Share.share({ message: `${title}: ${url}`, url });
  });
}

const rm = ReduceMotion.System;
const reveal = (i: number) => FadeInDown.delay(120 + i * 50).duration(timing.base).reduceMotion(rm);

function Live({ color }: { color: string }) {
  return (
    <View style={styles.live}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.liveText, { color }]}>LIVE</Text>
    </View>
  );
}

/** Collapsed card; tapping it opens the full project in a modal that springs in (the native counterpart of the web's expanding card). */
export default function ProjectCard({ project: p }: { project: Project }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const source = p.image ? localImages[p.image.src] : undefined;
  const aspect = p.image ? p.image.width / p.image.height : 1.6;

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={`${p.title}. ${p.category}. Opens project details.`} accessibilityState={{ expanded: open }} onPress={() => setOpen(true)}>
        <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
          {source ? <Image source={source} contentFit="cover" style={{ width: '100%', aspectRatio: aspect }} /> : null}
          <View style={styles.body}>
            <View style={styles.meta}>
              <Text style={[styles.cat, { color: t.text2 }]}>{p.category.toUpperCase()}</Text>
              {p.url ? <Live color={t.live} /> : null}
            </View>
            <Text style={[styles.title, { color: t.ink }]}>{p.title}</Text>
            {p.headline ? <Text style={[styles.headline, { color: t.text3 }]}>{p.headline}</Text> : null}
            <View style={styles.openRow}>
              <Text style={[styles.openText, { color: t.ink }]}>View details</Text>
              <Ionicons name="expand-outline" size={16} color={t.ink} />
            </View>
          </View>
        </Card>
      </Pressable>

      <Modal visible={open} transparent animationType="none" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn.duration(timing.base).reduceMotion(rm)} exiting={FadeOut.duration(timing.fast).reduceMotion(rm)} style={styles.backdrop}>
          <Pressable accessibilityLabel="Close project details" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        </Animated.View>
        <View style={[styles.stage, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]} pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            entering={ZoomIn.springify().stiffness(spring.gentle.stiffness).damping(spring.gentle.damping).reduceMotion(rm)}
            exiting={ZoomOut.duration(timing.fast).reduceMotion(rm)}
            style={[styles.panel, { backgroundColor: t.card, borderColor: t.line }]}
          >
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              {source ? <Image source={source} contentFit="cover" accessibilityLabel={`${p.title} website screenshot`} style={{ width: '100%', aspectRatio: aspect }} /> : null}
              <View style={styles.panelBody}>
                <Animated.View entering={reveal(0)} style={styles.meta}>
                  <Text style={[styles.cat, { color: t.text2 }]}>{p.category.toUpperCase()}</Text>
                  {p.url ? <Live color={t.live} /> : null}
                </Animated.View>
                <Text accessibilityRole="header" style={[styles.panelTitle, { color: t.ink }]}>{p.title}</Text>
                {p.headline ? <Animated.Text entering={reveal(1)} style={[styles.headline, { color: t.ink2 }]}>{p.headline}</Animated.Text> : null}
                <Animated.View entering={reveal(2)} style={{ gap: 10 }}>{p.description.map((d) => <Body key={d}>{d}</Body>)}</Animated.View>
                {p.features?.length ? (
                  <Animated.View entering={reveal(3)} style={styles.section}>
                    <Text style={[styles.label, { color: t.text2 }]}>KEY FEATURES</Text>
                    {p.features.map((f) => <Text key={f} style={[styles.feature, { color: t.text3 }]}>— {f}</Text>)}
                  </Animated.View>
                ) : null}
                <Animated.View entering={reveal(4)} style={styles.section}>
                  <Text style={[styles.label, { color: t.text2 }]}>FOCUS AREAS</Text>
                  <Text style={[styles.feature, { color: t.ink }]}>{p.focus.join(' · ')}</Text>
                </Animated.View>
                <Animated.View entering={reveal(5)} style={styles.section}>
                  <Text style={[styles.label, { color: t.text2 }]}>TECHNOLOGIES AND SKILLS</Text>
                  <View style={styles.badges}>{p.tech.map((x) => <Badge key={x}>{x}</Badge>)}</View>
                </Animated.View>
                {p.url ? (
                  <Animated.View entering={reveal(6)} style={styles.actions}>
                    <View style={{ flex: 1 }}>
                      <RetroButton primary label={p.linkLabel ?? 'View project'} hint={`Opens ${p.title} in your browser`} icon={{ sf: 'arrow.up.right.square', fallback: 'open-outline' }} onPress={() => openUrl(p.url!)} />
                    </View>
                    <RetroIconButton sf="ellipsis" fallback="ellipsis-horizontal" label={`More actions for ${p.title}`} onPress={() => more(p.title, p.url!)} />
                  </Animated.View>
                ) : null}
              </View>
            </ScrollView>
            <Pressable accessibilityRole="button" accessibilityLabel={`Close ${p.title} details`} hitSlop={8} onPress={() => setOpen(false)} style={[styles.close, { backgroundColor: t.card, borderColor: t.line }]}>
              <Ionicons name="close" size={20} color={t.ink} />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cat: { fontFamily: mono, fontSize: 10, letterSpacing: 1.8, flexShrink: 1 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontFamily: mono, fontSize: 10, letterSpacing: 2 },
  title: { fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontSize: 24, fontWeight: '600', letterSpacing: -0.4 },
  headline: { fontSize: 15, lineHeight: 22 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  openText: { fontSize: 14, fontWeight: '600' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,9,24,0.6)' },
  stage: { flex: 1, justifyContent: 'center', paddingHorizontal: 12 },
  panel: { flexShrink: 1, maxHeight: '100%', width: '100%', maxWidth: 900, alignSelf: 'center', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  panelBody: { padding: 20, gap: 12 },
  panelTitle: { fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }), fontSize: 30, fontWeight: '600', letterSpacing: -0.6 },
  section: { gap: 8, paddingTop: 14 },
  label: { fontFamily: mono, fontSize: 10, letterSpacing: 1.8 },
  feature: { fontSize: 15, lineHeight: 22 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10 },
  close: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
