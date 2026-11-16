import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { select, tap } from '~/lib/haptics';
import { maxScale, pressScale, radius, spring, useTheme } from '~/theme';
import GlassSurface from './GlassSurface';
import Symbol from './Symbol';
import { useGlass } from './useGlass';
import type { SFSymbol } from 'expo-symbols';

export const TAB_BAR_HEIGHT = 64;
/** Active tint: the orange-red of the reference footer, in both appearances. */
const ACTIVE = '#FF4A2F';
const GAP = 12;
const SIDE = 16;
const PAD = 4;

export type TabItem = { id: string; label: string; sf: SFSymbol; selectedSf: SFSymbol; fallback: React.ComponentProps<typeof Symbol>['fallback'] };
export type StepAction = { sf: SFSymbol; fallback: React.ComponentProps<typeof Symbol>['fallback']; label: string; hint: string; onPress: () => void };

type Props = {
  items: TabItem[];
  active: string;
  onSelect: (id: string) => void;
  /** The separate round control to the right of the capsule. Omitted when there is nothing for it to do. */
  action?: StepAction | null;
  bottomInset: number;
};

/**
 * Floating footer: one pill of tabs and a separate round glass control, both drawn by `GlassSurface` (system Liquid Glass
 * on iOS 26+, an opaque translucent surface elsewhere). The selected tab gets a sliding rounded highlight and a filled,
 * orange-red symbol. The glass is never opacity-animated; only the highlight and icon scale move.
 */
export default function LiquidGlassTabBar({ items, active, onSelect, action, bottomInset }: Props) {
  const t = useTheme();
  const { reduceMotion } = useGlass();
  const { width } = useWindowDimensions();
  const hasAction = !!action;
  const room = width - SIDE * 2 - (hasAction ? GAP + TAB_BAR_HEIGHT : 0) - PAD * 2;
  const itemW = Math.max(48, Math.min(72, Math.floor(room / items.length)));
  const index = Math.max(0, items.findIndex((i) => i.id === active));

  const x = useSharedValue(index * itemW);
  const first = useRef(true);
  useEffect(() => {
    const to = index * itemW;
    x.value = first.current || reduceMotion ? to : withSpring(to, spring.gentle);
    first.current = false;
  }, [index, itemW, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const shadow = { shadowColor: '#000', shadowOpacity: t.dark ? 0.5 : 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } };
  const inactive = t.dark ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.82)';

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <View pointerEvents="box-none" style={styles.row}>
        <View style={[styles.shadowWrap, shadow, { borderRadius: radius.pill }]}>
          <GlassSurface style={styles.capsule}>
            <View style={{ flexDirection: 'row', height: TAB_BAR_HEIGHT - PAD * 2 }} accessibilityRole="tablist">
              <Animated.View
                pointerEvents="none"
                style={[styles.pill, { width: itemW, backgroundColor: t.dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)' }, pill]}
              />
              {items.map((item) => (
                <TabButton key={item.id} item={item} width={itemW} selected={item.id === active} idle={inactive} onPress={() => { select(); onSelect(item.id); }} />
              ))}
            </View>
          </GlassSurface>
        </View>
        {action ? <ActionButton action={action} color={inactive} shadow={shadow} /> : null}
      </View>
    </View>
  );
}

function TabButton({ item, width, selected, idle, onPress }: { item: TabItem; width: number; selected: boolean; idle: string; onPress: () => void }) {
  const color = selected ? ACTIVE : idle;
  const scale = useSharedValue(selected ? 1.06 : 1);
  useEffect(() => { scale.value = withSpring(selected ? 1.06 : 1, spring.press); }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityHint="Scrolls to this section"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ width, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[styles.itemInner, style]}>
        <Symbol sf={item.sf} selectedSf={item.selectedSf} fallback={item.fallback} size={22} color={color} selected={selected} weight="medium" />
        <Text numberOfLines={1} maxFontSizeMultiplier={maxScale.label} style={[styles.label, { color }]}>{item.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function ActionButton({ action, color, shadow }: { action: StepAction; color: string; shadow: object }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, shadow, { borderRadius: radius.pill }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityHint={action.hint}
        onPress={() => { tap(); action.onPress(); }}
        onPressIn={() => { scale.value = withSpring(pressScale, spring.press); }}
        onPressOut={() => { scale.value = withSpring(1, spring.press); }}
        style={{ borderRadius: radius.pill }}
      >
        <GlassSurface interactive style={styles.round}>
          <Symbol sf={action.sf} fallback={action.fallback} size={24} color={color} weight="medium" />
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: SIDE },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: GAP },
  shadowWrap: {},
  capsule: { height: TAB_BAR_HEIGHT, borderRadius: radius.pill, padding: PAD, justifyContent: 'center', overflow: 'hidden' },
  pill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.pill },
  itemInner: { alignItems: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  round: { width: TAB_BAR_HEIGHT, height: TAB_BAR_HEIGHT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
