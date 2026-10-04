import type { TechGroup } from '@/types';

/**
 * Accent colours for concept icons (no brand logo), one per meaning so related skills match.
 * All are dark enough to read on the cream background.
 */
const ACCENT = {
  blue: '#2563EB',
  protocol: '#0891B2',
  data: '#0E7490',
  green: '#15803D',
  amber: '#D97706',
  red: '#B91C1C',
  security: '#4F46E5',
  workflow: '#0D9488',
  ai: '#7C3AED',
} as const;

/**
 * Core technologies in the Skills section, grouped. Each name appears once. Icons are Iconify ids
 * from the offline set (npm run icons): simple-icons brand marks drawn in `color` (official brand
 * colour; React's cyan uses react.dev's darker variant so it reads on cream), `logos:` for
 * brands whose logo is naturally multi-colour (no `color`), tabler for concepts in an ACCENT.
 */
export const coreTechGroups: TechGroup[] = [
  {
    title: 'Frontend',
    items: [
      { name: 'React', icon: 'simple-icons:react', color: '#087EA4' },
      { name: 'Next.js', icon: 'simple-icons:nextdotjs', color: '#000000' },
      { name: 'React Native', icon: 'simple-icons:react', color: '#087EA4' },
      { name: 'TypeScript', icon: 'simple-icons:typescript', color: '#3178C6' },
      { name: 'JavaScript', icon: 'logos:javascript' },
      { name: 'HTML5', icon: 'simple-icons:html5', color: '#E34F26' },
      { name: 'CSS', icon: 'simple-icons:css', color: '#1572B6' },
      { name: 'PostCSS', icon: 'simple-icons:postcss', color: '#DD3A0A' },
      { name: 'D3.js', icon: 'simple-icons:d3', color: '#F9A03C' },
      { name: 'MUI', icon: 'simple-icons:mui', color: '#007FFF' },
      { name: 'Tailwind CSS', icon: 'simple-icons:tailwindcss', color: '#06B6D4' },
      { name: 'Sass', icon: 'simple-icons:sass', color: '#CC6699' },
      { name: 'Less', icon: 'simple-icons:less', color: '#1D365D' },
      { name: 'Responsive Design', icon: 'tabler:devices', color: ACCENT.blue },
      { name: 'Accessibility', icon: 'tabler:accessible', color: ACCENT.blue },
    ],
  },
  {
    title: 'Backend & APIs',
    items: [
      { name: 'Node.js', icon: 'simple-icons:nodedotjs', color: '#5FA04E' },
      { name: 'NestJS', icon: 'simple-icons:nestjs', color: '#E0234E' },
      { name: 'Express', icon: 'simple-icons:express', color: '#000000' },
      { name: 'Python', icon: 'logos:python' },
      { name: 'FastAPI', icon: 'simple-icons:fastapi', color: '#009688' },
      { name: 'Django', icon: 'simple-icons:django', color: '#092E20' },
      { name: 'GraphQL', icon: 'simple-icons:graphql', color: '#E10098' },
      { name: 'REST API', icon: 'tabler:api', color: ACCENT.protocol },
      { name: 'Socket.IO', icon: 'simple-icons:socketdotio', color: '#010101' },
      { name: 'MCP', icon: 'simple-icons:modelcontextprotocol', color: ACCENT.protocol },
    ],
  },
  {
    title: 'Authentication & Web Security',
    items: [
      { name: 'JWT Authentication', icon: 'simple-icons:jsonwebtokens', color: ACCENT.amber },
      { name: 'OAuth 2.0', icon: 'tabler:brand-oauth', color: ACCENT.blue },
      { name: 'CORS', icon: 'tabler:world-check', color: ACCENT.protocol },
      { name: 'Helmet', icon: 'tabler:helmet', color: ACCENT.security },
      { name: 'bcrypt', icon: 'tabler:lock-password', color: ACCENT.security },
      { name: 'HTTPS / TLS', icon: 'tabler:lock', color: ACCENT.green },
      { name: 'OWASP', icon: 'simple-icons:owasp', color: ACCENT.red },
    ],
  },
  {
    title: 'Testing & Quality',
    items: [
      { name: 'Jest', icon: 'simple-icons:jest', color: '#C21325' },
      { name: 'React Testing Library', icon: 'simple-icons:testinglibrary', color: '#E33332' },
      { name: 'Playwright', icon: 'logos:playwright' },
      { name: 'TDD', icon: 'tabler:checklist', color: ACCENT.green },
      { name: 'Postman', icon: 'simple-icons:postman', color: '#FF6C37' },
      { name: 'Browser DevTools', icon: 'tabler:browser', color: ACCENT.blue },
    ],
  },
  {
    title: 'Databases & Data',
    items: [
      { name: 'PostgreSQL', icon: 'simple-icons:postgresql', color: '#4169E1' },
      { name: 'MongoDB', icon: 'simple-icons:mongodb', color: '#47A248' },
      { name: 'MySQL', icon: 'simple-icons:mysql', color: '#4479A1' },
      { name: 'SQLite', icon: 'simple-icons:sqlite', color: '#003B57' },
      { name: 'Supabase', icon: 'simple-icons:supabase', color: '#3FCF8E' },
      { name: 'Prisma', icon: 'simple-icons:prisma', color: '#2D3748' },
      { name: 'ORM', icon: 'tabler:database', color: ACCENT.data },
    ],
  },
  {
    title: 'Cloud, DevOps & Delivery',
    items: [
      { name: 'AWS', icon: 'logos:aws' },
      { name: 'Google Cloud Platform (GCP)', icon: 'logos:google-cloud' },
      { name: 'Cloudflare', icon: 'simple-icons:cloudflare', color: '#F38020' },
      { name: 'Docker', icon: 'simple-icons:docker', color: '#2496ED' },
      { name: 'Kubernetes', icon: 'simple-icons:kubernetes', color: '#326CE5' },
      { name: 'Jenkins', icon: 'simple-icons:jenkins', color: '#D24939' },
      { name: 'GitHub Actions', icon: 'simple-icons:githubactions', color: '#2088FF' },
      { name: 'CI/CD', icon: 'tabler:infinity', color: ACCENT.workflow },
    ],
  },
  {
    title: 'AI',
    items: [
      { name: 'Generative AI', icon: 'tabler:sparkles', color: ACCENT.ai },
      { name: 'LLM', icon: 'tabler:brain', color: ACCENT.ai },
    ],
  },
  {
    title: 'Development & Collaboration Tools',
    items: [
      { name: 'Local Development Environment', icon: 'tabler:terminal-2', color: ACCENT.green },
      // GitHub was in the original list and is kept.
      { name: 'GitHub', icon: 'simple-icons:github', color: '#181717' },
      { name: 'JIRA', icon: 'simple-icons:jira', color: '#0052CC' },
      { name: 'Confluence', icon: 'simple-icons:confluence', color: '#172B4D' },
      { name: 'Figma', icon: 'logos:figma' },
      { name: 'Adobe', icon: 'simple-icons:adobe', color: '#FA0F00' },
    ],
  },
];
