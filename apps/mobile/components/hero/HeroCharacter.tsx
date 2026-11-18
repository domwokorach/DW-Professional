import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, type GestureResponderEvent, StyleSheet, View } from 'react-native';
import { HERO_LOOK_FADE, HERO_LOOK_ZONES, heroAlt, type HeroLook } from '@/config/hero';
import { heroBody, heroHeads } from '~/lib/images';

/** Layer order: the eight turned heads, then the body render's own (centre) head, as on the website. */
const LOOKS = ['upLeft', 'up', 'upRight', 'left', 'right', 'downLeft', 'down', 'downRight', 'centre'] as const satisfies readonly HeroLook[];
/** The eight 45° sectors, clockwise from pointing right (screen y runs down). */
const SECTORS: HeroLook[] = ['right', 'downRight', 'down', 'downLeft', 'left', 'upLeft', 'up', 'upRight'];

/** Same sector/hysteresis logic as the website's pickLook (src/components/hero/HeroPortrait.tsx). */
function pickLook(x: number, y: number, current: HeroLook): HeroLook {
  const { deadZone, hysteresis, angleHysteresis } = HERO_LOOK_ZONES;
  if (Math.hypot(x, y) < (current === 'centre' ? deadZone + hysteresis : deadZone - hysteresis)) return 'centre';
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const held = SECTORS.indexOf(current);
  if (held >= 0 && Math.abs(((angle - held * 45 + 540) % 360) - 180) <= 22.5 + angleHysteresis) return current;
  return SECTORS[(Math.round(angle / 45) + 8) % 8];
}

/**
 * The hero character: a static body with the head area removed, plus a head box on top. The head follows a finger
 * dragged anywhere over the character (the touch equivalent of the website's mouse-follow) and returns to face
 * forward on release. Heads are stacked and only their opacity animates, so nothing flickers or shifts. With
 * "reduce motion" on, the forward head stays and touches do nothing; the static character is always the fallback.
 */
export default function HeroCharacter({ height = 440 }: { height?: number }) {
  const opacity = useRef(LOOKS.map((l) => new Animated.Value(l === 'centre' ? 1 : 0))).current;
  const [order, setOrder] = useState<number[]>(() => LOOKS.map((_, i) => i)); // bottom → top; centre starts on top
  const look = useRef<HeroLook>('centre');
  const headRef = useRef<React.ComponentRef<typeof View>>(null);
  const box = useRef<{ cx: number; cy: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const setLook = useCallback((next: HeroLook) => {
    if (next === look.current) return;
    look.current = next;
    const target = LOOKS.indexOf(next);
    setOrder((o) => [...o.filter((i) => i !== target), target]);
    Animated.timing(opacity[target], { toValue: 1, duration: HERO_LOOK_FADE, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
      // Once the incoming head is fully shown, the heads beneath it are hidden.
      if (finished) opacity.forEach((v, i) => i !== target && v.setValue(0));
    });
  }, [opacity]);

  const measure = () => headRef.current?.measureInWindow((x, y, w, h) => { box.current = { cx: x + w / 2, cy: y + h / 2 }; });

  const onTouch = (e: GestureResponderEvent) => {
    if (reduceMotion || !box.current) return;
    const { pageX, pageY } = e.nativeEvent;
    const { width, height: screenH } = Dimensions.get('window');
    setLook(pickLook((pageX - box.current.cx) / (width / 2), (pageY - box.current.cy) / (screenH / 2), look.current));
  };
  const rest = () => setLook('centre');

  return (
    <View
      style={{ height, aspectRatio: 500 / 941 }}
      onTouchStart={(e) => { measure(); setTimeout(() => onTouch(e), 0); }}
      onTouchMove={onTouch}
      onTouchEnd={rest}
      onTouchCancel={rest}
      accessible
      accessibilityRole="image"
      accessibilityLabel={heroAlt}
    >
      <Image source={heroBody} contentFit="contain" contentPosition="bottom" style={StyleSheet.absoluteFill} priority="high" cachePolicy="memory-disk" />
      <View ref={headRef} collapsable={false} pointerEvents="none" style={styles.head} onLayout={measure}>
        {order.map((i, z) => (
          <Animated.View key={LOOKS[i]} style={[StyleSheet.absoluteFill, { opacity: opacity[i], zIndex: z + 1 }]}>
            {/* The crops differ by a few pixels; each is stretched to the head box, which is the fitted scale. */}
            <Image source={heroHeads[LOOKS[i]]} contentFit="fill" style={StyleSheet.absoluteFill} priority="high" cachePolicy="memory-disk" />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// Head box in the body crop's own proportions: x 130, y 0, 260×290 of 500×941.
const styles = StyleSheet.create({ head: { position: 'absolute', left: '26%', top: 0, width: '52%', height: '30.8183%' } });
