/** Smooth-scrolls to the section whose id is the lower-cased label. */
export const scrollToSection = (label: string) =>
  document.getElementById(label.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });

export const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
