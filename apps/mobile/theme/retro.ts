import { useColorScheme } from 'react-native';
import { darkRetro, lightRetro, type Retro } from './colors';

export type { Retro };
export const useRetro = (): Retro => (useColorScheme() === 'dark' ? darkRetro : lightRetro);

/** Fill / text / outline colours for each control tone, so every component maps tone to colour the same way. */
export type Tone = 'outline' | 'teal' | 'navy' | 'orange';
export const toneColors = (r: Retro, tone: Tone) =>
  tone === 'teal' ? { bg: r.teal, fg: r.onTeal, border: r.teal }
  : tone === 'navy' ? { bg: r.ink, fg: r.onInk, border: r.ink }
  : tone === 'orange' ? { bg: r.orange, fg: r.onOrange, border: r.orange }
  : { bg: 'transparent', fg: r.teal, border: r.teal };
