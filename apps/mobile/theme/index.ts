import { Platform, useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './colors';

export type Theme = typeof lightTheme;

/** Resolved appearance colours. useColorScheme() already reflects the user's System/Light/Dark choice (ThemeProvider sets Appearance). */
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? darkTheme : lightTheme);

/** The website's mono stack (ui-monospace / Menlo) mapped to each platform's monospace face. */
export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

export const radius = { card: 18, pill: 999 };
export const space = { page: 20, section: 56 };

export { typography, maxScale } from './typography';
export { spring, timing, pressScale } from './motion';
