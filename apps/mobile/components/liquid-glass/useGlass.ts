import { isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Display preferences that decide how glass is drawn. `native` is true only where the system Liquid Glass API
 * exists (iOS 26+) and the user has not asked for less transparency or more contrast; everywhere else callers draw a
 * plain opaque surface instead of imitating glass with blur.
 */
export function useGlass() {
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const subs = [AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)];
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    if (Platform.OS === 'ios') {
      void AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
      void AccessibilityInfo.isDarkerSystemColorsEnabled().then(setHighContrast);
      subs.push(
        AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency),
        AccessibilityInfo.addEventListener('darkerSystemColorsChanged', setHighContrast),
      );
    }
    return () => subs.forEach((s) => s.remove());
  }, []);

  const available = Platform.OS === 'ios' && isGlassEffectAPIAvailable();
  return { native: available && !reduceTransparency && !highContrast, reduceMotion, highContrast };
}
