/** Smooth unless the visitor asked for reduced motion, in which case the page jumps straight there. */
const behavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/** Scrolls to the section whose id is the lower-cased label. */
export const scrollToSection = (label: string) =>
  document.getElementById(label.toLowerCase())?.scrollIntoView({ behavior: behavior() });

export const scrollToTop = () => window.scrollTo({ top: 0, behavior: behavior() });
