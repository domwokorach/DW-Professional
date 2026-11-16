import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, H2, Screen, SectionTag } from '~/components/ui';
import { CONTACT_URL } from '~/constants/site';
import { contactInfo, socialLinks } from '~/lib/data';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = { Email: 'mail-outline', Location: 'location-outline', Work: 'code-slash-outline' };

export default function Contact() {
  const t = useTheme();
  return (
    <Screen>
      <SectionTag num="08" label="CONTACT" />
      <H2 em="polished interfaces.">{"Building thoughtful digital experiences from robust systems to "}</H2>
      <Body style={{ marginTop: 16 }}>I create scalable, accessible, and user-focused digital products by combining strong engineering foundations with carefully crafted frontend experiences.</Body>
      <Card style={{ marginTop: 24 }}>
        {contactInfo.map((c) => {
          const row = (
            <View style={styles.row}>
              <Ionicons name={ICONS[c.label] ?? 'ellipse-outline'} size={20} color={t.ink} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: t.text2 }]}>{c.label.toUpperCase()}</Text>
                <Text style={[styles.value, { color: t.ink }]}>{c.value}</Text>
              </View>
            </View>
          );
          return c.href ? (
            <Pressable key={c.label} accessibilityRole="link" accessibilityLabel={`${c.label}: ${c.value}`} onPress={() => openUrl(c.href!)} style={{ minHeight: 48, justifyContent: 'center' }}>{row}</Pressable>
          ) : <View key={c.label} accessible accessibilityLabel={`${c.label}: ${c.value}`}>{row}</View>;
        })}
      </Card>
      <View style={{ gap: 10, marginTop: 20 }}>
        {socialLinks.map((s) => <Button key={s.label} label={s.label} hint={`Opens ${s.label}`} icon={<Ionicons name={s.label === 'GitHub' ? 'logo-github' : 'logo-linkedin'} size={16} color={t.ink} />} onPress={() => openUrl(s.href)} />)}
        <Button primary label="Send a message" hint="Opens the contact form on the website" icon={<Ionicons name="send-outline" size={16} color={t.onInk} />} onPress={() => openUrl(CONTACT_URL)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  label: { fontFamily: mono, fontSize: 10, letterSpacing: 1.6 },
  value: { fontSize: 16, fontWeight: '600' },
});
