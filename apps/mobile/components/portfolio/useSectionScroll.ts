import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, ScrollView } from 'react-native';
import { SECTIONS, type SectionId } from './sections';

const ORDER = SECTIONS.map((s) => s.id);
/** A programmatic scroll normally ends well inside this; it only guards against a missed momentum-end event. */
const LOCK_FALLBACK_MS = 1200;

/**
 * One shared scroll container's section logic: measured positions, tap-to-scroll, and the active section.
 *
 * - Positions come from each section wrapper's `onLayout`, so they follow changing heights (filters, expanding cards).
 * - The active section is derived from the scroll offset, but state is only set when the section actually changes, so
 *   scrolling never re-renders per frame.
 * - While a tap-initiated scroll is running the target is held as active (`lock`), so the indicator does not flicker
 *   through the sections in between. A drag by the user releases the lock immediately.
 */
export function useSectionScroll({ topInset, bottomInset }: { topInset: number; bottomInset: number }) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const positions = useRef<Partial<Record<SectionId, { y: number; h: number }>>>({});
  const metrics = useRef({ y: 0, viewport: 0, content: 0 });
  const lock = useRef<{ id: SectionId; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [active, setActive] = useState<SectionId>('home');
  const activeRef = useRef<SectionId>('home');
  const reduceMotion = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v; });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduceMotion.current = v; });
    return () => { sub.remove(); if (lock.current) clearTimeout(lock.current.timer); };
  }, []);

  const commit = useCallback((id: SectionId) => {
    if (activeRef.current === id) return;
    activeRef.current = id;
    setActive(id);
  }, []);

  /** Section whose top has passed a probe line a little below the top inset; the last section wins at the very bottom. */
  const detect = useCallback((): SectionId => {
    const { y, viewport, content } = metrics.current;
    if (content > viewport && y + viewport >= content - 4) return ORDER[ORDER.length - 1];
    const probe = y + topInset + viewport * 0.25;
    let current: SectionId = ORDER[0];
    for (const id of ORDER) {
      const p = positions.current[id];
      if (p && p.y <= probe) current = id;
    }
    return current;
  }, [topInset]);

  const release = useCallback(() => {
    if (!lock.current) return;
    clearTimeout(lock.current.timer);
    lock.current = null;
    commit(detect());
  }, [commit, detect]);

  const onSectionLayout = useCallback((id: SectionId) => (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    positions.current[id] = { y, h: height };
    if (!lock.current) commit(detect());
  }, [commit, detect]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    metrics.current = { y: contentOffset.y, viewport: layoutMeasurement.height, content: contentSize.height };
    if (!lock.current) commit(detect());
  }, [commit, detect]);

  const scrollTo = useCallback((id: SectionId) => {
    const p = positions.current[id];
    if (!p) return;
    // Land so the section's heading sits just below the status bar / Dynamic Island.
    const y = Math.max(0, p.y - topInset - 8);
    const animated = !reduceMotion.current;
    if (lock.current) clearTimeout(lock.current.timer);
    lock.current = { id, timer: setTimeout(release, LOCK_FALLBACK_MS) };
    commit(id);
    scroll.current?.scrollTo({ y, animated });
    if (!animated) release();
  }, [commit, release, topInset]);

  const step = useCallback((dir: 1 | -1) => {
    const from = lock.current?.id ?? activeRef.current;
    const next = ORDER[ORDER.indexOf(from) + dir];
    if (next) scrollTo(next);
  }, [scrollTo]);

  return {
    scroll, active, scrollTo, step, onSectionLayout, onScroll,
    onMomentumScrollEnd: release,
    onScrollBeginDrag: release,
    hasNext: ORDER.indexOf(active) < ORDER.length - 1,
    hasPrevious: ORDER.indexOf(active) > 0,
    bottomInset,
  };
}
