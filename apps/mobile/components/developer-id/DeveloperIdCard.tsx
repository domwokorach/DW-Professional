import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { encode } from 'uqr';
import { DEVELOPER_ID_SCAN_URL, PORTFOLIO_ACCESS_URL } from '~/constants/site';
import { mono } from '~/theme';

// Colours are the website's Developer ID card literals (src/styles/developer-id.css); the card is the same in light and dark.
const INK = '#25233f';
const PAPER = '#f7f3e7';
const MUTED = '#817e77';
const SKILLS = ['React', 'Next.js', 'Vue', 'TypeScript', 'Node.js', 'Python', 'AI', 'Data'];
const MASKS = [0, 1, 2, 3, 4, 5, 6, 7];
const MASK_CYCLE_MS = 5000;
const FLIP_MS = 700;
const portrait = require('../../assets/images/profile/developer-id-portrait.webp') as number;

// Same seeded PRNG as the website, so the barcode is identical.
function seeded(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function Barcode({ value }: { value: string }) {
  const { bars, width } = useMemo(() => {
    const rand = seeded(value);
    const out: { x: number; w: number }[] = [];
    let x = 0;
    const push = (w: number, gap: number) => { out.push({ x, w }); x += w + gap; };
    push(1, 1); push(1, 1);
    for (let i = 0; i < 46; i++) push(1 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 2));
    push(1, 1); push(1, 0);
    return { bars: out, width: x };
  }, [value]);
  return (
    <View style={styles.barcode} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height={30} viewBox={`0 0 ${width} 10`} preserveAspectRatio="none">
        {bars.map((b, i) => <Rect key={i} x={b.x} y={0} width={b.w} height={10} fill={INK} />)}
      </Svg>
      <Text style={styles.barText}>*{value.replace(/-/g, '')}*</Text>
    </View>
  );
}

/** Front-of-card QR: a real code for the scan-confirmation page. Cycles through the 8 mask patterns like the website; every one decodes to the same URL. */
function MailQr() {
  const codes = useMemo(() => MASKS.map((maskPattern) => {
    const { size, data } = encode(DEVELOPER_ID_SCAN_URL, { ecc: 'Q', boostEcc: false, maskPattern });
    let d = '';
    data.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c} ${r}h1v1h-1z`; }));
    return { size, d };
  }), []);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % codes.length), MASK_CYCLE_MS);
    return () => clearInterval(id);
  }, [codes.length]);
  const { size, d } = codes[i];
  return (
    <View style={styles.mailQr} accessible accessibilityRole="image" accessibilityLabel="QR code that opens a page with a button to email Dominic">
      <Svg width="100%" height="100%" viewBox={`-1 -1 ${size + 2} ${size + 2}`}><Path d={d} fill={INK} stroke={INK} strokeWidth={0.03} /></Svg>
    </View>
  );
}

/** Back-of-card QR: the Portfolio Access page, with four modules of quiet zone. */
function AccessQr() {
  const { size, d } = useMemo(() => {
    const { size, data } = encode(PORTFOLIO_ACCESS_URL, { ecc: 'L', boostEcc: false });
    let d = '';
    data.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c} ${r}h1v1h-1z`; }));
    return { size, d };
  }, []);
  const q = 4;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="QR code that opens DOMINIC's portfolio access page" style={styles.accessQr}>
      <Svg width="100%" height="100%" viewBox={`${-q} ${-q} ${size + q * 2} ${size + q * 2}`}>
        <Rect x={-q} y={-q} width={size + q * 2} height={size + q * 2} fill={PAPER} />
        <Path d={d} fill={INK} stroke={INK} strokeWidth={0.03} />
      </Svg>
    </View>
  );
}

export default function DeveloperIdCard() {
  const [flipped, setFlipped] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const turn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    if (reduceMotion) turn.setValue(next ? 1 : 0);
    else Animated.timing(turn, { toValue: next ? 1 : 0, duration: FLIP_MS, easing: Easing.bezier(0.65, 0, 0.35, 1), useNativeDriver: true }).start();
  };

  const rot = (from: string, to: string) => ({ transform: [{ perspective: 1200 }, { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }] });

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: flipped }}
        accessibilityLabel={flipped ? 'Developer ID card, back side. Activate to show the front.' : 'Developer ID card, front side. Activate to show the back.'}
        onPress={toggle}
        style={styles.card}
      >
        {/* Front */}
        <Animated.View pointerEvents={flipped ? 'none' : 'auto'} style={[styles.face, styles.front, rot('0deg', '180deg')]}>
          <View style={styles.head}>
            <View style={styles.headMark}><Text style={styles.headMarkText}>DO</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headTitle}>DEVELOPER ID</Text>
              <Text style={styles.headSub}>Portfolio · 2026</Text>
            </View>
            <View style={styles.chip} />
          </View>
          <View style={styles.photo}>
            <Image source={portrait} contentFit="cover" contentPosition="center" style={{ ...StyleSheet.absoluteFill as object, transform: [{ scale: 1.1 }] }} accessibilityLabel="DOMINIC" transition={250} />
          </View>
          <Text style={styles.name}>DOMINIC</Text>
          <Text style={styles.role}>Software Engineer &amp; Frontend Developer.</Text>
          <View style={styles.details}>
            {[['ID NO.', 'DO-0001', 1], ['DEPT.', 'Engineering', 1.3], ['VALID TILL', '2027', 0.9]].map(([k, v, f]) => (
              <View key={k as string} style={[styles.detail, { flex: f as number }]}>
                <Text style={styles.dt}>{k}</Text>
                <Text style={styles.dd} numberOfLines={1}>{v}</Text>
              </View>
            ))}
          </View>
          <MailQr />
          <Barcode value="DO-0001-2027" />
        </Animated.View>

        {/* Back */}
        <Animated.View pointerEvents={flipped ? 'auto' : 'none'} style={[styles.face, styles.back, rot('180deg', '360deg')]}>
          <View style={styles.backHead}>
            <Text style={styles.backHeadText}>DEVELOPER PROFILE</Text>
            <View style={[styles.headMark, { width: 26, height: 26 }]}><Text style={[styles.headMarkText, { fontSize: 9 }]}>DO</Text></View>
          </View>
          <Text style={styles.backName}>DOMINIC</Text>
          <Text style={styles.backRole}>SOFTWARE ENGINEER &amp; FRONTEND DEVELOPER.</Text>
          <Text style={styles.bio}>I build responsive web applications, interactive digital experiences, and AI-powered platforms.</Text>
          <View style={styles.skills}>{SKILLS.map((s) => <Text key={s} style={styles.skill}>{s}</Text>)}</View>
          <View style={styles.access}>
            <View style={{ gap: 6, flexShrink: 1 }}>
              <Text style={[styles.accessText, { fontWeight: '700', opacity: 1 }]}>PORTFOLIO ACCESS</Text>
              <View style={styles.status}><View style={styles.dot} /><Text style={styles.accessText}>STATUS: ACTIVE</Text></View>
              <Text style={styles.accessText}>ID: DO-0001</Text>
            </View>
            <AccessQr />
          </View>
          <Text style={styles.hint}>Tap to return</Text>
        </Animated.View>
      </Pressable>
      <Text style={styles.caption}>Tap the card to flip</Text>
    </View>
  );
}

const fs = { fontFamily: mono } as const;
const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 8 },
  card: { width: '100%', maxWidth: 290, aspectRatio: 290 / 460, transform: [{ rotate: '-2deg' }] },
  face: { ...StyleSheet.absoluteFill as object, borderRadius: 14, backfaceVisibility: 'hidden', shadowColor: '#25233f', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  front: { backgroundColor: PAPER, borderWidth: 1, borderColor: INK, overflow: 'hidden' },
  back: { backgroundColor: INK, padding: 20, overflow: 'hidden' },
  head: { height: 64, backgroundColor: INK, flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16 },
  headMark: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  headMarkText: { color: '#fff', fontSize: 11 },
  headTitle: { ...fs, color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  headSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 },
  chip: { width: 26, height: 20, borderRadius: 4, backgroundColor: '#c9bf93' },
  photo: { width: '33%', aspectRatio: 4 / 5, alignSelf: 'center', marginTop: 14, marginBottom: 10, borderWidth: 2, borderColor: INK, borderRadius: 14, overflow: 'hidden', backgroundColor: '#e6e0ce' },
  name: { textAlign: 'center', color: INK, fontSize: 15, fontWeight: '700', letterSpacing: 0.9, marginTop: 6 },
  role: { textAlign: 'center', color: MUTED, fontSize: 10, marginTop: 3, paddingHorizontal: 12 },
  details: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  detail: { borderTopWidth: 1, borderTopColor: 'rgba(37,35,63,0.16)', paddingTop: 7 },
  dt: { ...fs, fontSize: 7, letterSpacing: 0.9, color: MUTED },
  dd: { color: INK, fontSize: 9, fontWeight: '700', marginTop: 3 },
  mailQr: { width: '26%', minWidth: 64, maxWidth: 76, aspectRatio: 1, alignSelf: 'center', marginVertical: 'auto' as never, padding: 4, backgroundColor: '#fff', borderRadius: 3 },
  barcode: { marginHorizontal: 16, marginTop: 8, marginBottom: 14, gap: 3 },
  barText: { ...fs, fontSize: 7, letterSpacing: 3, textAlign: 'center', color: MUTED },
  backHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)' },
  backHeadText: { ...fs, color: 'rgba(247,243,231,0.7)', fontSize: 9, letterSpacing: 1.8 },
  backName: { color: PAPER, fontSize: 21, fontWeight: '700', marginTop: 18, marginBottom: 4 },
  backRole: { ...fs, color: 'rgba(247,243,231,0.7)', fontSize: 9, letterSpacing: 2 },
  bio: { color: 'rgba(247,243,231,0.85)', fontSize: 11.5, lineHeight: 18, marginVertical: 14 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skill: { color: PAPER, fontSize: 9.5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  access: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  accessText: { ...fs, color: PAPER, fontSize: 8.5, letterSpacing: 1.2, opacity: 0.75 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9fe0a8' },
  accessQr: { width: 88, height: 88, borderRadius: 6, overflow: 'hidden' },
  hint: { ...fs, color: PAPER, fontSize: 7.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.4, textAlign: 'center', marginTop: 12 },
  caption: { ...fs, color: MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 22 },
});
