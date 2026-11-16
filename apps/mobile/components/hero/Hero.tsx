import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RetroButton } from '~/components/retro';
import { CONTACT_URL, RESUME_URL } from '~/constants/site';
import HeroCharacter from './HeroCharacter';
import { openUrl } from '~/lib/links';
import { mono, useTheme } from '~/theme';
import { useScrollToSection } from '~/components/portfolio/ScrollContext';

/** Hero: kicker, headline and portrait from the website's hero (src/components/hero); the head follows touch (HeroCharacter). */
export default function Hero() {
  const t = useTheme();
  const scrollTo = useScrollToSection();
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
        <RetroButton primary label="Explore work" hint="Scrolls to the Projects section" icon={{ sf: "briefcase", fallback: "briefcase-outline" }} onPress={() => scrollTo('projects')} />
        <RetroButton label="Let's talk" hint="Scrolls to the Contact section" icon={{ sf: "paperplane", fallback: "send-outline" }} onPress={() => scrollTo('contact')} />
        <RetroButton label="Resume" hint="Opens the résumé request on the website" icon={{ sf: "arrow.down.circle", fallback: "download-outline" }} onPress={() => openUrl(RESUME_URL)} />
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
