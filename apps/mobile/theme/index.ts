import { Platform, useColorScheme } from 'react-native';

// Mirrors the website tokens in src/styles/base.css (light :root and [data-theme="dark"]).
const light = {
  ink: '#25233f',
  ink2: '#383653',
  cream: '#f1eedf',
  cream2: '#f8f5e9',
  sand: '#e6e0ce',
  card: '#fffdf7',
  badge: '#f4f1e7',
  line: 'rgba(37,35,63,0.16)',
  onInk: '#ffffff',
  text2: '#5f5c56',
  text3: '#4f4c47',
  live: '#2f7a4c',
  dark: false,
};

const dark: typeof light = {
  ink: '#ece8d9',
  ink2: '#d2cee3',
  cream: '#14132a',
  cream2: '#1a1933',
  sand: '#272547',
  card: '#1d1c38',
  badge: '#2a2850',
  line: 'rgba(236,232,217,0.16)',
  onInk: '#17162b',
  text2: '#b3b0c4',
  text3: '#c8c5d6',
  live: '#5fd08f',
  dark: true,
};

export type Theme = typeof light;

export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

/** The website's mono stack (ui-monospace / Menlo) mapped to each platform's monospace face. */
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

export const radius = { card: 18, pill: 999 };
export const space = { page: 20, section: 56 };
