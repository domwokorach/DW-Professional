import type { TechGroup } from '@/types';

/**
 * Accent colours for concept icons (no brand logo), one per meaning so related skills match.
 * Each has a light-mode colour (readable on cream) and a lighter dark-mode one.
 */
const ACCENT = {
  blue: ['#2563EB', '#60A5FA'],
  protocol: ['#0891B2', '#22D3EE'],
  data: ['#0E7490', '#67E8F9'],
  green: ['#15803D', '#4ADE80'],
  amber: ['#D97706', '#FBBF24'],
  red: ['#B91C1C', '#F87171'],
  security: ['#4F46E5', '#818CF8'],
  workflow: ['#0D9488', '#2DD4BF'],
  ai: ['#7C3AED', '#A78BFA'],
} as const;
/** Icon colours for light and dark mode: [light, dark]. Dark variants are lighter so they keep 3:1 against the dark card. */
const accent = (k: keyof typeof ACCENT) => ({ color: ACCENT[k][0], colorDark: ACCENT[k][1] });

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
      { name: 'Next.js', icon: 'simple-icons:nextdotjs', color: '#000000', colorDark: '#F5F5F5' },
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
      { name: 'Less', icon: 'simple-icons:less', color: '#1D365D', colorDark: '#6C9BE0' },
      { name: 'Responsive Design', icon: 'tabler:devices', ...accent('blue') },
      { name: 'Accessibility', icon: 'tabler:accessible', ...accent('blue') },
    ],
  },
  {
    title: 'Backend & APIs',
    items: [
      { name: 'Node.js', icon: 'simple-icons:nodedotjs', color: '#5FA04E' },
      { name: 'NestJS', icon: 'simple-icons:nestjs', color: '#E0234E' },
      { name: 'Express', icon: 'simple-icons:express', color: '#000000', colorDark: '#E8E8E8' },
      { name: 'Python', icon: 'logos:python' },
      { name: 'FastAPI', icon: 'simple-icons:fastapi', color: '#009688' },
      { name: 'Django', icon: 'simple-icons:django', color: '#092E20', colorDark: '#44B78B' },
      { name: 'GraphQL', icon: 'simple-icons:graphql', color: '#E10098' },
      { name: 'REST API', icon: 'tabler:api', ...accent('protocol') },
      { name: 'Socket.IO', icon: 'simple-icons:socketdotio', color: '#010101', colorDark: '#F0F0F0' },
      { name: 'MCP', icon: 'simple-icons:modelcontextprotocol', ...accent('protocol') },
    ],
  },
  {
    title: 'Authentication & Web Security',
    items: [
      { name: 'JWT Authentication', icon: 'simple-icons:jsonwebtokens', ...accent('amber') },
      { name: 'OAuth 2.0', icon: 'tabler:brand-oauth', ...accent('blue') },
      { name: 'CORS', icon: 'tabler:world-check', ...accent('protocol') },
      { name: 'Helmet', icon: 'tabler:helmet', ...accent('security') },
      { name: 'bcrypt', icon: 'tabler:lock-password', ...accent('security') },
      { name: 'HTTPS / TLS', icon: 'tabler:lock', ...accent('green') },
      { name: 'OWASP', icon: 'simple-icons:owasp', ...accent('red') },
    ],
  },
  {
    title: 'Testing & Quality',
    items: [
      { name: 'Jest', icon: 'simple-icons:jest', color: '#C21325', colorDark: '#E8505F' },
      { name: 'React Testing Library', icon: 'simple-icons:testinglibrary', color: '#E33332' },
      { name: 'Playwright', icon: 'logos:playwright' },
      { name: 'TDD', icon: 'tabler:checklist', ...accent('green') },
      { name: 'Postman', icon: 'simple-icons:postman', color: '#FF6C37' },
      { name: 'Browser DevTools', icon: 'tabler:browser', ...accent('blue') },
    ],
  },
  {
    title: 'Databases & Data',
    items: [
      { name: 'PostgreSQL', icon: 'simple-icons:postgresql', color: '#4169E1' },
      { name: 'MongoDB', icon: 'simple-icons:mongodb', color: '#47A248' },
      { name: 'MySQL', icon: 'simple-icons:mysql', color: '#4479A1' },
      { name: 'SQLite', icon: 'simple-icons:sqlite', color: '#003B57', colorDark: '#4DA8DA' },
      { name: 'Supabase', icon: 'simple-icons:supabase', color: '#3FCF8E' },
      { name: 'Prisma', icon: 'simple-icons:prisma', color: '#2D3748', colorDark: '#A3B1D1' },
      { name: 'ORM', icon: 'tabler:database', ...accent('data') },
    ],
  },
  {
    title: 'Cloud, DevOps & Delivery',
    items: [
      { name: 'AWS', icon: 'simple-icons:amazonwebservices', color: '#B86E00', colorDark: '#FF9900' },
      { name: 'Google Cloud Platform (GCP)', icon: 'logos:google-cloud' },
      { name: 'Cloudflare', icon: 'simple-icons:cloudflare', color: '#F38020' },
      { name: 'Docker', icon: 'simple-icons:docker', color: '#2496ED' },
      { name: 'Kubernetes', icon: 'simple-icons:kubernetes', color: '#326CE5' },
      { name: 'Jenkins', icon: 'simple-icons:jenkins', color: '#D24939' },
      { name: 'GitHub Actions', icon: 'simple-icons:githubactions', color: '#2088FF' },
      { name: 'CI/CD', icon: 'tabler:infinity', ...accent('workflow') },
    ],
  },
  {
    title: 'AI',
    items: [
      { name: 'Generative AI', icon: 'tabler:sparkles', ...accent('ai') },
      { name: 'LLM', icon: 'tabler:brain', ...accent('ai') },
    ],
  },
  {
    title: 'Development & Collaboration Tools',
    items: [
      { name: 'Local Development Environment', icon: 'tabler:terminal-2', ...accent('green') },
      // GitHub was in the original list and is kept.
      { name: 'GitHub', icon: 'simple-icons:github', color: '#181717', colorDark: '#F0F6FC' },
      { name: 'JIRA', icon: 'simple-icons:jira', color: '#0052CC', colorDark: '#4C9AFF' },
      { name: 'Confluence', icon: 'simple-icons:confluence', color: '#172B4D', colorDark: '#4C9AFF' },
      { name: 'Figma', icon: 'logos:figma' },
      { name: 'Adobe', icon: 'simple-icons:adobe', color: '#FA0F00' },
    ],
  },
];
