export const site = {
  title: 'Dominic Olanya — Frontend Software Engineer',
  description: 'Portfolio of Dominic Olanya, a London-based frontend software engineer: accessible, high-performance web applications with React, Next.js and TypeScript.',
  /** Public origin, used for canonical URLs and metadata. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
};

/** The portfolio's home route; `/` redirects here (next.config.ts). */
export const HOME = '/en-gb';

/** Primary navigation; each label maps to a section id (lower-cased). */
export const navItems = ['About', 'Skills', 'Work', 'Experience', 'Achievements', 'Contact'] as const;
export type NavItem = (typeof navItems)[number];
