/**
 * Facts the legal pages rely on. Values set to null are operational details that aren't
 * known from the code (they depend on where and how the site is run); the pages show them as
 * "to be confirmed" rather than guessing. Fill them in before publishing.
 */
export const legal = {
  owner: 'Dominic Olanya',
  location: 'London, United Kingdom',
  lastUpdated: '4 October 2026',
  /** Company that hosts the site and may keep standard server/access logs, e.g. "Vercel Inc.". */
  hostingProvider: 'Vercel Inc.' as string | null,
  /** How long enquiries are kept: the emails, the saved database copy, and any file stored in S3. */
  enquiryRetention: '12 months' as string | null,
};

export const legalLinks = [
  { label: 'Terms and Conditions', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookie', href: '/cookies' },
  { label: 'Accessibility and disability', href: '/accessibility' },
] as const;
