import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button } from '~/components/ui';
import { CONTACT_URL, RESUME_URL } from '~/constants/site';
import HeroCharacter from './HeroCharacter';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';
import { useRouter } from 'expo-router';

/** Hero: kicker, headline and portrait from the website's hero (src/components/hero); the head follows touch (HeroCharacter). */
export default function Hero() {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.kicker, { color: t.ink }]}>DOMINIC</Text>
      <Text accessibilityRole="header" style={[styles.h1, { color: t.ink }]}>
        {'Software\nEngineer &\nFrontend\nDeveloper'}
        <Text style={{ color: t.live }}>.</Text>
      </Text>
      <Text style={[styles.sub, { color: t.text2 }]}>Creative developer · AI &amp; web technology</Text>
      <View style={styles.stage}>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.watermark, { color: t.ink }]} numberOfLines={1} adjustsFontSizeToFit>DOMINIC</Text>
        <HeroCharacter height={width >= 700 ? 560 : 440} />
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
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingTop: 8 },
  watermark: { position: 'absolute', top: '24%', alignSelf: 'center', width: '100%', textAlign: 'center', fontSize: 120, fontWeight: '800', letterSpacing: -4, opacity: 0.06 },
  actions: { gap: 10 },
});
