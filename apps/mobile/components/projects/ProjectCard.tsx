import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { Project } from '@/types';
import { Badge, Body, Button, Card } from '~/components/ui';
import { localImages } from '~/lib/images';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

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
          <Button primary label={p.linkLabel ?? 'View project'} hint={`Opens ${p.title} in your browser`} icon={<Ionicons name="open-outline" size={16} color={t.onInk} />} onPress={() => openUrl(p.url!)} />
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
