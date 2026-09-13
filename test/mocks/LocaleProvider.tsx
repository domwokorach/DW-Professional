/**
 * Global test double for `@/i18n/LocaleProvider`, wired in via jest.config.ts's
 * jsdom-project moduleNameMapper. The real provider runs a live-DOM
 * translation pipeline (MutationObserver + a translation API call) that has
 * no place in a component test — every component here only ever reads
 * `localiseHref`, which in the real implementation just no-ops for the
 * default locale, so this mock keeps that one behavior and drops the rest.
 */
import type { ReactNode } from 'react';

export function useLocale() {
  return {
    locale: 'en' as const,
    changeLocale: jest.fn(),
    localiseHref: (href: string) => href,
    isTranslating: false,
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return children;
}
