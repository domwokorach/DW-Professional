export const site = {
  title: 'DOMINIC — Software Engineer & Frontend Developer.',
  description: 'Portfolio of DOMINIC, a London-based Software Engineer & Frontend Developer: accessible, high-performance web applications with React, Next.js and TypeScript.',
  /** Public origin, used for canonical URLs and metadata. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/** The portfolio's home route; `/` redirects here (next.config.ts). */
export const HOME = '/en-gb';

/** Primary navigation; each label maps to a section id (lower-cased). */
export const navItems = ['About', 'Skills', 'Work', 'Experience', 'Achievements', 'Contact'] as const;
export type NavItem = (typeof navItems)[number];
