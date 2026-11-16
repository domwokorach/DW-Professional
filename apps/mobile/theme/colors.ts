/**
 * Semantic colour tokens for both appearances, in one place: a flat retro palette (cream paper, navy ink, teal and orange
 * fills). `Theme` is the app chrome (text, cards); `Retro` is the control set (fills, outlines and the text that sits on them).
 * Components never hold hex values for these roles: they read them through useTheme() / useRetro(), which follow the
 * user's appearance preference (see ./appearance.tsx).
 *
 * Each filled colour has an `on*` partner chosen for contrast: light mode uses cream on the dark fills; dark mode lifts
 * teal and orange and puts navy text on them.
 */
export const lightTheme = {
  ink: '#0F1F4B',
  ink2: '#1C7C94',
  cream: '#F8EDC4',
  cream2: '#FBF3D6',
  sand: '#EFDFA7',
  card: '#FBF3D6',
  badge: '#F3E6B0',
  line: 'rgba(15,31,75,0.35)',
  onInk: '#FFF8E1',
  text2: '#46587A',
  text3: '#2B3C63',
  live: '#1C7C94',
  accent: '#E8601C',
  dark: false,
};

export const darkTheme: typeof lightTheme = {
  ink: '#F8EDC4',
  ink2: '#7CC6D8',
  cream: '#0E1A3F',
  cream2: '#12214D',
  sand: '#1B2F68',
  card: '#15265A',
  badge: '#1B2F68',
  line: 'rgba(248,237,196,0.3)',
  onInk: '#0E1A3F',
  text2: '#B7C0D8',
  text3: '#D8DCEA',
  live: '#5CD0E6',
  accent: '#FF7A33',
  dark: true,
};

export const lightRetro = {
  dark: false,
  bg: '#F8EDC4',
  paper: '#FBF3D6',
  ink: '#0F1F4B',
  onInk: '#FFF8E1',
  teal: '#1C7C94',
  onTeal: '#FFF8E1',
  orange: '#E8601C',
  onOrange: '#FFFFFF',
  text: '#0F1F4B',
  muted: '#46587A',
  danger: '#C62828',
};

export const darkRetro: typeof lightRetro = {
  dark: true,
  bg: '#0E1A3F',
  paper: '#15265A',
  ink: '#F8EDC4',
  onInk: '#0E1A3F',
  teal: '#3FB0CB',
  onTeal: '#0E1A3F',
  orange: '#FF7A33',
  onOrange: '#0E1A3F',
  text: '#F8EDC4',
  muted: '#B7C0D8',
  danger: '#FF7B7B',
};

export type Theme = typeof lightTheme;
export type Retro = typeof lightRetro;
