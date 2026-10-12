// Names and product terms that must survive translation unchanged. The server wraps them in
// <span translate="no"> before calling Google, which leaves their contents alone.

export const PROTECTED_TERMS: readonly string[] = [
  'Dominic Wokorach Olanya', 'Dominic Wokorach', 'Wokorach', 'Olanya', 'Dominic', 'DOMINIC',
  'Next.js', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL', 'Prisma', 'GraphQL',
  'Vercel', 'GitHub', 'LinkedIn', 'Cloudinary', 'Figma', 'Docker', 'Kubernetes', 'AWS', 'Amazon S3',
  'Google Cloud', 'Resend', 'Stripe', 'Three.js', 'Rolex', 'Submariner',
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Longest terms first so "Dominic Wokorach Olanya" wins over "Dominic". */
export const PROTECTED_RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${[...PROTECTED_TERMS].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`,
  'gu',
);
