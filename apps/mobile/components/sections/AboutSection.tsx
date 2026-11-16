import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { RetroButton, RetroRow } from '~/components/retro';
import DeveloperIdCard from '~/components/developer-id/DeveloperIdCard';
import { Body, Card, H2, SectionTag } from '~/components/ui';
import { RESUME_URL } from '~/constants/site';
import { ABOUT, quickFacts, socialLinks, testimonials } from '~/lib/data';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

export function AboutSection() {
  const t = useTheme();
  const router = useRouter();
  return (
    <View>
      <SectionTag num="01" label="ABOUT" />
      <H2 em="DOMINIC.">Hi, I&apos;m </H2>
      <View style={{ gap: 14, marginTop: 16 }}>
        {ABOUT.map((p) => <Body key={p}>{p}</Body>)}
        <RetroRow>
          <RetroButton primary label="Resume" hint="Opens the résumé request on the website" icon={{ sf: "arrow.down.circle", fallback: "download-outline" }} onPress={() => openUrl(RESUME_URL)} />
          {socialLinks.map((s) => <RetroButton key={s.label} label={s.label} hint={`Opens ${s.label}`} icon={{ sf: "link", fallback: "link-outline" }} onPress={() => openUrl(s.href)} />)}
          <RetroButton label="Appearance" hint="Opens Settings to choose System, Light or Dark" icon={{ sf: 'circle.lefthalf.filled', fallback: 'contrast-outline' }} onPress={() => router.push('/settings')} />
          <RetroButton label="UI kit" hint="Opens the interactive component showcase" icon={{ sf: 'slider.horizontal.3', fallback: 'options-outline' }} onPress={() => router.push('/design-system')} />
        </RetroRow>
      </View>
      <View style={{ marginTop: 36 }}><SectionTag label="DEVELOPER ID" /><DeveloperIdCard /></View>
      <Card style={{ marginTop: 28 }}>
        <Text style={[styles.mini, { color: t.ink }]}>QUICK FACTS</Text>
        {quickFacts.map((f) => (
          <View key={f.label} style={styles.fact}>
            <Text style={[styles.label, { color: t.text2 }]}>{f.label}</Text>
            <Text style={[styles.value, { color: t.ink }]}>{f.value}</Text>
          </View>
        ))}
        <Text style={[styles.quote, { color: t.ink2 }]}>“From the database to the last pixel.”</Text>
      </Card>
      <SectionTag num="07" label="TESTIMONIALS" />
      <View style={{ gap: 14 }}>
        {testimonials.map((q) => (
          <Card key={q.id}>
            <Body style={{ fontStyle: 'italic' }}>“{q.quote}”</Body>
            <Text style={[styles.value, { color: t.ink }]}>{q.attribution}</Text>
            <Text style={[styles.label, { color: t.text2 }]}>{`${q.organisation} · ${q.company}`}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mini: { fontFamily: mono, fontSize: 11, letterSpacing: 2.4 },
  fact: { gap: 2, paddingVertical: 4 },
  label: { fontFamily: mono, fontSize: 11, letterSpacing: 0.4 },
  value: { fontSize: 16, fontWeight: '600' },
  quote: { fontSize: 15, fontStyle: 'italic', marginTop: 8 },
});
