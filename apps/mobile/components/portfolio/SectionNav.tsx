import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { RetroIconButton, Symbol } from '~/components/retro';
import { useRetro } from '~/theme/retro';
import { select } from '~/lib/haptics';
import { maxScale, spring } from '~/theme';
import { SECTIONS, type SectionId } from './sections';

const ITEM_W = 62;
const BAR_H = 56;
const PAD = 4;

type Props = {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  bottomInset: number;
};

/**
 * Floating footer: one navy bar with a sliding orange selection tile, plus a separate round orange control for
 * "next section" (it becomes "previous section" on the last one, so there is always a useful step button).
 * Tapping an item
 * scrolls the page; it never navigates.
 */
export default function SectionNav({ active, onSelect, onNext, onPrevious, hasNext, hasPrevious, bottomInset }: Props) {
  const r = useRetro();
  const index = SECTIONS.findIndex((s) => s.id === active);
  const x = useSharedValue(index * ITEM_W);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    x.value = ready ? withSpring(index * ITEM_W, spring.gentle) : index * ITEM_W;
    setReady(true);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: Math.max(bottomInset, 12) }]}>
      <View style={styles.row}>
        <View style={[styles.capsule, { backgroundColor: r.ink }]}>
          <View style={styles.items} accessibilityRole="tablist">
            <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: r.orange }, pill]} />
            {SECTIONS.map((s) => {
              const selected = s.id === active;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="tab"
                  accessibilityLabel={s.label}
                  accessibilityHint="Scrolls to this section"
                  accessibilityState={{ selected }}
                  onPress={() => { select(); onSelect(s.id); }}
                  style={styles.item}
                >
                  <Symbol sf={s.sf} selectedSf={s.selectedSf} fallback={s.fallback} size={20} color={selected ? r.onOrange : r.onInk} selected={selected} />
                  <Text numberOfLines={1} maxFontSizeMultiplier={maxScale.label} style={[styles.label, { color: selected ? r.onOrange : r.onInk, fontWeight: '800' }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {hasNext ? (
          <RetroIconButton round tone="orange" sf="chevron.down" fallback="chevron-down" label="Next section" hint="Scrolls to the next section" onPress={onNext} size={BAR_H} />
        ) : hasPrevious ? (
          <RetroIconButton round tone="orange" sf="chevron.up" fallback="chevron-up" label="Previous section" hint="Scrolls to the previous section" onPress={onPrevious} size={BAR_H} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  capsule: { height: BAR_H, borderRadius: 20, padding: PAD, justifyContent: 'center' },
  items: { flexDirection: 'row', height: BAR_H - PAD * 2 },
  pill: { position: 'absolute', left: 0, top: 0, width: ITEM_W, height: BAR_H - PAD * 2, borderRadius: 16 },
  item: { width: ITEM_W, height: BAR_H - PAD * 2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
});
