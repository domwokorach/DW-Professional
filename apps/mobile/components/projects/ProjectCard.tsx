import { Image } from 'expo-image';
import { ActionSheetIOS, Appearance, Platform, Share, StyleSheet, Text, View } from 'react-native';
import type { Project } from '@/types';
import { RetroButton, RetroIconButton } from '~/components/retro';
import { Badge, Body, Card } from '~/components/ui';
import { localImages } from '~/lib/images';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

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

export default function ProjectCard({ project: p }: { project: Project }) {
  const t = useTheme();
  const source = p.image ? localImages[p.image.src] : undefined;
  return (
    <Card style={{ padding: 0, overflow: 'hidden', gap: 0 }}>
      {source ? (
        <Image source={source} contentFit="cover" style={{ width: '100%', aspectRatio: 1.6 }} accessibilityLabel={`${p.title} preview`} />
      ) : null}
      <View style={styles.body}>
        {p.url ? (
          <View style={styles.live}>
            <View style={[styles.dot, { backgroundColor: t.live }]} />
            <Text style={[styles.liveText, { color: t.live }]}>LIVE</Text>
          </View>
        ) : null}
        <Text accessibilityRole="header" style={[styles.title, { color: t.ink }]}>{p.title}</Text>
        {p.headline ? <Text style={[styles.headline, { color: t.ink2 }]}>{p.headline}</Text> : null}
        {p.description.map((d) => <Body key={d}>{d}</Body>)}
        <View style={styles.badges}>{p.tech.map((x) => <Badge key={x}>{x}</Badge>)}</View>
        {p.url ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <RetroButton primary label={p.linkLabel ?? 'View project'} hint={`Opens ${p.title} in your browser`} icon={{ sf: "arrow.up.right.square", fallback: "open-outline" }} onPress={() => openUrl(p.url!)} />
            </View>
            <RetroIconButton sf="ellipsis" fallback="ellipsis-horizontal" label={`More actions for ${p.title}`} onPress={() => more(p.title, p.url!)} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontFamily: mono, fontSize: 10, letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.8 },
  headline: { fontSize: 16, fontWeight: '600', lineHeight: 23 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
