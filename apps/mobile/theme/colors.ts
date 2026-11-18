/**
 * Semantic colour tokens for both appearances. Values come from the website's tokens (src/styles/base.css, generated
 * into src/styles/tokens.generated.ts) so web and Expo share one palette. `Theme` is the app chrome (text, cards);
 * `Retro` is the control set (fills, outlines and the text that sits on them). Components read them through
 * useTheme() / useRetro(), which follow the user's appearance preference (see ./appearance.tsx).
 *
 * `accent` / `orange` map to the champagne gold: use it for fills, rules and borders, never as text on cream.
 * `teal` is the secondary ink (--ink2); the key names are kept so existing components need no change.
 */
import { darkTokens as d, lightTokens as l } from '@/styles/tokens.generated';

type Widen<T> = { -readonly [K in keyof T]: T[K] extends boolean ? boolean : string };

const lineOf = (rgb: string) => `rgba(${rgb},0.16)`;

const lightThemeValues = {
  ink: l.ink,
  ink2: l.ink2,
  cream: l.cream,
  cream2: l.cream2,
  sand: l.sand,
  card: l.white,
  badge: l.badge,
  line: lineOf(l['ink-rgb']),
  onInk: l['on-ink'],
  text2: l['text-2'],
  text3: l['text-3'],
  live: l.live,
  accent: l.gold,
  dark: false,
};

export const lightTheme: Widen<typeof lightThemeValues> = lightThemeValues;

export const darkTheme: typeof lightTheme = {
  ink: d.ink,
  ink2: d.ink2,
  cream: d.cream,
  cream2: d.cream2,
  sand: d.sand,
  card: d.white,
  badge: d.badge,
  line: lineOf(d['ink-rgb']),
  onInk: d['on-ink'],
  text2: d['text-2'],
  text3: d['text-3'],
  live: d.live,
  accent: d.gold,
  dark: true,
};

const lightRetroValues = {
  dark: false,
  bg: l.cream,
  paper: l.white,
  ink: l.ink,
  onInk: l['on-ink'],
  teal: l.ink2,
  onTeal: l['on-ink'],
  orange: l.gold,
  onOrange: l['on-gold'],
  text: l.ink,
  muted: l['text-2'],
  danger: '#B42318',
};

export const lightRetro: Widen<typeof lightRetroValues> = lightRetroValues;

export const darkRetro: typeof lightRetro = {
  dark: true,
  bg: d.cream,
  paper: d.white,
  ink: d.ink,
  onInk: d['on-ink'],
  teal: d.ink2,
  onTeal: d['on-ink'],
  orange: d.gold,
  onOrange: d['on-gold'],
  text: d.ink,
  muted: d['text-2'],
  danger: '#FF7B7B',
};

export type Theme = typeof lightTheme;
export type Retro = typeof lightRetro;
