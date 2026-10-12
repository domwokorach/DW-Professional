import type { Metadata } from 'next';
import AppFooter from '@/components/layout/AppFooter';
import HalloweenLayer from '@/components/halloween';
import { LanguageProvider, LanguageSwitcher } from '@/components/language';
import { CookieConsent } from '@/components/privacy';
import { site } from '@/config';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
// Flag artwork for the language switcher (SVGs are fetched only for flags actually shown).
import 'flag-icons/css/flag-icons.min.css';
// Section styles, in cascade order (split from the former single globals.css).
import '@/styles/base.css';
import '@/styles/animations.css';
import '@/styles/layout.css';
import '@/styles/hero.css';
import '@/styles/developer-id.css';
import '@/styles/skills.css';
import '@/styles/projects.css';
import '@/styles/learning.css';
import '@/styles/experience.css';
import '@/styles/achievements.css';
import '@/styles/comments.css';
import '@/styles/contact.css';
import '@/styles/legal.css';
import '@/styles/privacy.css';
import '@/styles/portfolio-access.css';
import '@/styles/halloween.css';
import '@/styles/language.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // Lets browsers style native UI (scrollbars, form controls) for either theme.
  other: { 'color-scheme': 'light dark' },
  title: site.title,
  description: site.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the inline script sets data-theme on <html> before React hydrates.
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LanguageProvider>
          <HalloweenLayer />
          {children}
          <AppFooter />
          {/* Before the consent panel in the DOM, so the panel stacks above the rail where they overlap. */}
          <LanguageSwitcher />
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
