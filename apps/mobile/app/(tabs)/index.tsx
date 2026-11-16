import { View } from 'react-native';
import Hero from '~/components/hero/Hero';
import Achievements from '~/components/learning/Achievements';
import Certifications from '~/components/learning/Certifications';
import { Card, H2, Screen, SectionTag } from '~/components/ui';
import TechIcon from '~/components/ui/TechIcon';
import { Text, StyleSheet } from 'react-native';
import { coreTechGroups } from '~/lib/data';
import { mono, useTheme } from '~/theme';

export default function Home() {
  const t = useTheme();
  return (
    <Screen>
      <Hero />
      <SectionTag num="02" label="SKILLS" />
      <H2 em="stack.">Core </H2>
      <View style={{ gap: 14, marginTop: 20 }}>
        {coreTechGroups.map((g) => (
          <Card key={g.title}>
            <Text accessibilityRole="header" style={[styles.group, { color: t.ink }]}>{g.title.toUpperCase()}</Text>
            <View style={styles.grid}>
              {g.items.map((it) => (
                <View key={it.name} style={styles.item} accessible accessibilityLabel={it.name}>
                  <TechIcon tech={it} />
                  <Text style={[styles.name, { color: t.text3 }]}>{it.name}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>
      <SectionTag num="04" label="CERTIFICATIONS" />
      <H2 em="certified.">Proudly </H2>
      <View style={{ marginTop: 20 }}><Certifications /></View>
      <SectionTag num="06" label="ACHIEVEMENTS" />
      <H2 em="moments.">Proud </H2>
      <View style={{ marginTop: 20 }}><Achievements /></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { fontFamily: mono, fontSize: 11, letterSpacing: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: '45%', paddingVertical: 4 },
  name: { fontSize: 14 },
});
