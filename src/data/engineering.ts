import { DEFAULT_BRANCH, REPO_URL } from '@/lib/engineering/types';

/** Which live check (from /api/engineering/status) a card reports, if any. Cards without one show no status. */
export type StatusKey = 'report' | 'jenkins' | 'ci' | 'deployment' | 'commit';
export type EngineeringIcon = 'testing' | 'jenkins' | 'actions' | 'typescript' | 'quality' | 'security' | 'accessibility' | 'vercel' | 'source' | 'architecture';

export interface RepoLink {
  label: string;
  /** Path in the repository ('' = repository root). Verified to exist by tests/engineering-data.test.ts. */
  path: string;
  kind: 'blob' | 'tree';
}

export interface Capability {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: EngineeringIcon;
  statusKey?: StatusKey;
  link: RepoLink;
}

export const repoUrl = (link: Pick<RepoLink, 'path' | 'kind'>) =>
  link.path ? `${REPO_URL}/${link.kind}/${DEFAULT_BRANCH}/${link.path}` : REPO_URL;

// Descriptions state only what the repository actually contains.
export const capabilities: Capability[] = [
  { id: 'testing', number: '01', title: 'Automated Testing', icon: 'testing', statusKey: 'report', link: { label: 'Testing guide', path: 'docs/TESTING.md', kind: 'blob' },
    description: 'Node test runner with unit, integration and component suites, Playwright browser tests, c8 coverage and JUnit reports.' },
  { id: 'jenkins', number: '02', title: 'Jenkins CI/CD', icon: 'jenkins', statusKey: 'jenkins', link: { label: 'Jenkinsfile', path: 'Jenkinsfile', kind: 'blob' },
    description: 'Declarative pipeline: parallel static analysis and test stages, reports always published, build artefacts archived.' },
  { id: 'actions', number: '03', title: 'GitHub Actions', icon: 'actions', statusKey: 'ci', link: { label: 'Workflows', path: '.github/workflows', kind: 'tree' },
    description: 'Pull-request and master validation, CodeQL, dependency review, accessibility and post-deployment smoke tests, with pinned actions.' },
  { id: 'typescript', number: '04', title: 'TypeScript', icon: 'typescript', link: { label: 'tsconfig.json', path: 'tsconfig.json', kind: 'blob' },
    description: 'Strict mode across the Next.js app and the Expo app, type-checked separately in every pipeline.' },
  { id: 'quality', number: '05', title: 'Code Quality', icon: 'quality', link: { label: 'Contributing', path: 'CONTRIBUTING.md', kind: 'blob' },
    description: 'ESLint flat config with Next.js, TypeScript, React Hooks and accessibility rules; Conventional Commits; coverage thresholds.' },
  { id: 'security', number: '06', title: 'Security', icon: 'security', link: { label: 'Security policy', path: 'SECURITY.md', kind: 'blob' },
    description: 'Dependabot, CodeQL, npm audit gates, secure headers, server-side validation and a responsible-disclosure policy.' },
  { id: 'accessibility', number: '07', title: 'Accessibility', icon: 'accessibility', link: { label: 'Accessibility guide', path: 'docs/ACCESSIBILITY.md', kind: 'blob' },
    description: 'axe-core checks on both themes and viewports, keyboard and touch-target tests, plus manual screen-reader guidance for WCAG 2.2 AA.' },
  { id: 'vercel', number: '08', title: 'Vercel Deployment', icon: 'vercel', statusKey: 'deployment', link: { label: 'Deployment guide', path: 'docs/DEPLOYMENT.md', kind: 'blob' },
    description: 'Git-integrated preview and production deployments, build validation, smoke tests on the live URL and a documented rollback.' },
  { id: 'source', number: '09', title: 'GitHub Source Code', icon: 'source', statusKey: 'commit', link: { label: 'Repository', path: '', kind: 'tree' },
    description: 'Public monorepo: the Next.js site, the Expo app and a design-token package, with contribution guidelines.' },
  { id: 'architecture', number: '10', title: 'System Architecture', icon: 'architecture', link: { label: 'Architecture', path: 'docs/ARCHITECTURE.md', kind: 'blob' },
    description: 'Documented App Router, API, Prisma and PostgreSQL, authentication and delivery flows, with Mermaid diagrams.' },
];

export const engineeringLinks: (RepoLink & { href?: string })[] = [
  { label: 'View GitHub Source Code', path: '', kind: 'tree' },
  { label: 'View CI/CD Pipelines', path: '', kind: 'tree', href: `${REPO_URL}/actions` },
  { label: 'Explore Automated Tests', path: 'tests', kind: 'tree' },
  { label: 'View Jenkins Pipeline', path: 'Jenkinsfile', kind: 'blob' },
  { label: 'View Engineering Documentation', path: 'docs', kind: 'tree' },
];
