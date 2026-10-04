/** Media queries shared by components (keep in sync with the breakpoints in src/styles). */
export const media = {
  tablet: '(max-width: 1050px)',
  phone: '(max-width: 720px)',
  /** A foldable/dual-screen device spanning both screens side by side (e.g. Surface Duo). */
  dualScreen: '(horizontal-viewport-segments: 2)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** A mouse or trackpad (not touch), so there is a pointer to follow. */
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;
