import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { success } from '~/lib/haptics';
import { maxScale, typography } from '~/theme';
import { useRetro } from '~/theme/retro';
import Symbol from './Symbol';

type Ctx = { show: (message: string) => void };
const ToastContext = createContext<Ctx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

/** Confirmation toast under the status bar: glass surface, animated check, success haptic, announced to VoiceOver, gone after 2.4 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const r = useRetro();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    clearTimeout(timer.current);
    setMessage(m);
    success();
    AccessibilityInfo.announceForAccessibility(m);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Animated.View
          key={message}
          entering={FadeInUp.springify().damping(20).reduceMotion(ReduceMotion.System)}
          exiting={FadeOutUp.duration(200).reduceMotion(ReduceMotion.System)}
          pointerEvents="none"
          style={[styles.wrap, { top: insets.top + 8 }]}
        >
          <View style={[styles.pill, { backgroundColor: r.ink }]}>
            <Symbol sf="checkmark.circle.fill" fallback="checkmark-circle" size={20} color={r.orange} selected />
            <View style={{ flexShrink: 1 }}><Text maxFontSizeMultiplier={maxScale.caption} style={[typography.bodySmall, styles.text, { color: r.onInk }]}>{message}</Text></View>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, maxWidth: '100%' },
  text: { fontWeight: '600' },
});
