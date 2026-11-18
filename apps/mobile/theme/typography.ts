import { Platform, type TextStyle } from 'react-native';

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

/**
 * Type scale. iOS uses the system font (San Francisco) because no fontFamily is set; sizes are the starting
 * point for Dynamic Type, which React Native applies automatically (`allowFontScaling`), so each style that could
 * collide with its container is capped with `maxFontSizeMultiplier` where it is used. Branding keeps the website's
 * monospace labels and italic serif-style emphasis (`em`).
 */
export const typography = {
  display: { fontSize: 44, lineHeight: 46, fontWeight: '800', letterSpacing: -1.8 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  bodySmall: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontFamily: mono, fontSize: 11, lineHeight: 16, letterSpacing: 2.4 },
  em: { fontStyle: 'italic', fontWeight: '500', fontFamily: Platform.select({ ios: 'Georgia-Italic', default: undefined }) },
} satisfies Record<string, TextStyle>;

/** Largest Dynamic Type multiplier per role: large headings cap early so they cannot overflow the screen. */
export const maxScale = { display: 1.15, title: 1.2, heading: 1.3, body: 1.6, caption: 1.5, label: 1.3 } as const;
