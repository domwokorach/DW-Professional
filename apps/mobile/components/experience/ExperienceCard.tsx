import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Experience, ExperienceGroup, ExperienceItem } from '@/types';
import { Badge, Body, Card } from '~/components/ui';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

const isGroup = (e: ExperienceItem): e is ExperienceGroup => 'roles' in e;
const range = (e: { start: { label: string }; end?: { label: string } }) => `${e.start.label} – ${e.end?.label ?? 'Present'}`;

function Mark({ logo, mark, title }: { logo?: { src: string; alt: string }; mark?: string; title: string }) {
  const t = useTheme();
  return (
    <View style={[styles.mark, { backgroundColor: t.sand, borderColor: t.line }]}>
      {logo ? <Image source={{ uri: logo.src }} style={styles.logo} contentFit="cover" accessibilityLabel={logo.alt} /> : <Text style={[styles.markText, { color: t.ink }]}>{(mark ?? title).slice(0, 3)}</Text>}
    </View>
  );
}

function RoleBody({ role }: { role: Experience }) {
  const t = useTheme();
  return (
    <View style={{ gap: 10 }}>
      {role.bullets.map((b) => (
        <View key={b} style={styles.bullet}>
          <Text style={{ color: t.ink }}>•</Text>
          <Body style={{ flex: 1 }}>{b}</Body>
        </View>
      ))}
      {role.skills?.length ? <View style={styles.badges}>{role.skills.map((s) => <Badge key={s}>{s}</Badge>)}</View> : null}
      {role.projects?.length ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.sub, { color: t.ink }]}>{`${role.projectsLabel ?? 'Projects'} (${role.projects.length})`.toUpperCase()}</Text>
          {role.projects.map((p) => (
            <View key={p.name} style={[styles.project, { borderColor: t.line, backgroundColor: t.cream2 }]}>
              <Text style={[styles.projectName, { color: t.ink }]}>{p.name}</Text>
              <Body style={{ fontSize: 14, lineHeight: 21 }}>{p.description}</Body>
              {p.url ? (
                <Pressable accessibilityRole="link" accessibilityLabel={p.actionLabel ?? p.linkLabel ?? `View project — ${p.name}`} onPress={() => openUrl(p.url!)} style={styles.link} hitSlop={8}>
                  <Text style={[styles.linkText, { color: t.ink }]}>{p.linkLabel ?? 'View Project'}</Text>
                  <Ionicons name="open-outline" size={14} color={t.ink} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      {role.projectGallery?.length ? (
        <View style={styles.gallery}>
          {role.projectGallery.map((g) => <Image key={g.src} source={{ uri: g.src }} style={{ width: '48%', aspectRatio: 1.4, borderRadius: 10 }} contentFit="cover" accessibilityLabel={g.alt} />)}
        </View>
      ) : null}
    </View>
  );
}

export default function ExperienceCard({ item }: { item: ExperienceItem }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const title = isGroup(item) ? item.employer : item.role;
  const subtitle = isGroup(item) ? item.roles.map((r) => r.role).join(' · ') : item.company ?? item.description;
  const meta = isGroup(item) ? [item.employmentType, item.location] : [item.employmentType, item.workplaceType, item.location];
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${range(item)}. ${open ? 'Collapse' : 'Expand'} details`}
        onPress={() => setOpen((v) => !v)}
        style={styles.head}
      >
        <Mark logo={item.logo} mark={item.mark} title={title} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.title, { color: t.ink }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: t.ink2 }]}>{subtitle}</Text> : null}
          <Text style={[styles.meta, { color: t.text2 }]}>{range(item)}</Text>
          <Text style={[styles.meta, { color: t.text2 }]}>{meta.filter(Boolean).join(' · ')}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={t.ink} />
      </Pressable>
      {open ? (isGroup(item) ? <View style={{ gap: 20 }}>{item.roles.map((r) => (
        <View key={r.role + r.start.iso} style={{ gap: 8 }}>
          <Text style={[styles.title, { color: t.ink, fontSize: 17 }]}>{r.role}</Text>
          <Text style={[styles.meta, { color: t.text2 }]}>{range(r)}</Text>
          <RoleBody role={r} />
        </View>
      ))}</View> : <RoleBody role={item} />) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 14, alignItems: 'center', minHeight: 48 },
  mark: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 48, height: 48 },
  markText: { fontFamily: mono, fontSize: 13, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  meta: { fontFamily: mono, fontSize: 11, letterSpacing: 0.3 },
  bullet: { flexDirection: 'row', gap: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sub: { fontFamily: mono, fontSize: 11, letterSpacing: 1.6, marginTop: 6 },
  project: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 },
  projectName: { fontSize: 15, fontWeight: '700' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  linkText: { fontFamily: mono, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
});
