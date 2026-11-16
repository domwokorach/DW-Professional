import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '~/components/ui';
import { CONTACT_URL, RESUME_URL } from '~/constants/site';
import { heroBody } from '~/lib/images';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';
import { useRouter } from 'expo-router';

/** Hero: kicker, headline and portrait from the website's hero (src/components/hero), minus the pointer-driven head tracking. */
export default function Hero() {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: t.ink }]}>DOMINIC</Text>
      <Text accessibilityRole="header" style={[styles.h1, { color: t.ink }]}>
        {'Software\nEngineer &\nFrontend\nDeveloper'}
        <Text style={{ color: t.live }}>.</Text>
      </Text>
      <Text style={[styles.sub, { color: t.text2 }]}>Creative developer · AI &amp; web technology</Text>
      <View style={[styles.portrait, { backgroundColor: t.sand, borderColor: t.line }]}>
        <Image source={heroBody} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} accessibilityLabel="Portrait of Dominic" />
      </View>
      <View style={styles.actions}>
        <Button primary label="Explore work" hint="Opens the Projects tab" icon={<Ionicons name="briefcase-outline" size={16} color={t.onInk} />} onPress={() => router.push('/projects')} />
        <Button label="Let's talk" hint="Opens the Contact tab" icon={<Ionicons name="send-outline" size={16} color={t.ink} />} onPress={() => router.push('/contact')} />
        <Button label="Resume" hint="Opens the résumé request on the website" icon={<Ionicons name="download-outline" size={16} color={t.ink} />} onPress={() => openUrl(RESUME_URL)} />
      </View>
    </View>
  );
}

export { CONTACT_URL };

const styles = StyleSheet.create({
  wrap: { gap: 16, paddingTop: 12 },
  kicker: { fontFamily: mono, fontSize: 11, letterSpacing: 4 },
  h1: { fontSize: 52, lineHeight: 56, fontWeight: '800', letterSpacing: -2 },
  sub: { fontFamily: mono, fontSize: 12, letterSpacing: 1 },
  portrait: { height: 360, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  actions: { gap: 10 },
});
