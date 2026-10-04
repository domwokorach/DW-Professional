import type { Metadata } from 'next';
import { AppFooter } from '@/components/layout';
import { CookieConsent } from '@/components/privacy';
import { site } from '@/config';
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
import '@/styles/contact.css';
import '@/styles/legal.css';
import '@/styles/privacy.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        <AppFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
