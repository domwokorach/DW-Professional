import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { darkRetro, darkTheme, lightRetro, lightTheme, type Retro, type Theme } from './colors';

export type AppearancePreference = 'system' | 'light' | 'dark';
const KEY = 'appearance.preference';

type Ctx = { preference: AppearancePreference; setPreference: (p: AppearancePreference) => void };
const AppearanceContext = createContext<Ctx>({ preference: 'system', setPreference: () => {} });

void SplashScreen.preventAutoHideAsync().catch(() => {});

const isPreference = (v: unknown): v is AppearancePreference => v === 'system' || v === 'light' || v === 'dark';

/** Applies the preference to the native layer: with an override, useColorScheme(), glass, segmented controls, sheets and the keyboard all follow it; `unspecified` hands control back to iOS. */
const apply = (p: AppearancePreference) => Appearance.setColorScheme(p === 'system' ? 'unspecified' : p);

/**
 * Owns the System / Light / Dark preference. It is stored in AsyncStorage, applied through `Appearance.setColorScheme`
 * (so iOS appearance changes still flow through in System mode), and the app stays on the splash screen until the saved
 * value is applied, so a stored choice never flashes the wrong theme. The provider never remounts its children when the
 * theme changes, so scroll position and navigation state are kept.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<AppearancePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(KEY)
      .then((v) => { if (live && isPreference(v)) { setPref(v); apply(v); } })
      .catch(() => {})
      .finally(() => { if (live) { setReady(true); void SplashScreen.hideAsync().catch(() => {}); } });
    return () => { live = false; };
  }, []);

  const setPreference = useCallback((p: AppearancePreference) => {
    setPref(p);
    apply(p);
    void AsyncStorage.setItem(KEY, p).catch(() => {});
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <AppearanceContext.Provider value={value}>{ready ? children : null}</AppearanceContext.Provider>;
}

/** Everything a component needs about appearance: the preference and setter, the resolved scheme, and both token sets. */
export function useAppTheme(): { preference: AppearancePreference; setPreference: (p: AppearancePreference) => void; scheme: 'light' | 'dark'; theme: Theme; retro: Retro } {
  const { preference, setPreference } = useContext(AppearanceContext);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { preference, setPreference, scheme, theme: scheme === 'dark' ? darkTheme : lightTheme, retro: scheme === 'dark' ? darkRetro : lightRetro };
}
