const REPO = 'https://github.com/domwokorach/DW-Professional';
const BLOB = `${REPO}/blob/master`;

export type EngineeringLink = { label: string; href: string };

/** Every URL points at a file or page that exists in the repository or on the live site. */
export const engineeringLinks = {
  source: { label: 'View GitHub Source Code', href: REPO },
  pipelines: { label: 'View CI/CD Pipelines', href: `${REPO}/actions` },
  tests: { label: 'Explore Automated Tests', href: `${REPO}/tree/master/tests` },
  jenkins: { label: 'View Jenkins Pipeline', href: `${BLOB}/Jenkinsfile` },
  docs: { label: 'View Engineering Documentation', href: `${REPO}/tree/master/docs` },
  live: { label: 'View Live Deployment', href: 'https://www.dominicwokorach.me/en-gb' },
} as const satisfies Record<string, EngineeringLink>;

export type EngineeringCard = { title: string; text: string; link: EngineeringLink };

export const engineeringCards: readonly EngineeringCard[] = [
  { title: 'Automated Testing', text: 'Unit, integration, component and end-to-end suites, run on every change with coverage reporting.', link: { label: 'Testing guide', href: `${BLOB}/docs/TESTING.md` } },
  { title: 'Jenkins CI/CD', text: 'A declarative pipeline with JUnit and coverage reports, a dependency audit and archived build artefacts.', link: { label: 'Jenkinsfile', href: `${BLOB}/Jenkinsfile` } },
  { title: 'GitHub Actions', text: 'Lint, type-check, test, accessibility, audit and production-build gates with least-privilege permissions.', link: { label: 'Workflows', href: `${REPO}/tree/master/.github/workflows` } },
  { title: 'TypeScript', text: 'Strict mode across the web app and the Expo mobile app, checked in every pipeline run.', link: { label: 'tsconfig.json', href: `${BLOB}/tsconfig.json` } },
  { title: 'Code Quality', text: 'ESLint with the Next.js rules, enforced coverage thresholds and conventional commits.', link: { label: 'Contributing', href: `${BLOB}/CONTRIBUTING.md` } },
  { title: 'Security', text: 'Dependabot, CodeQL, dependency review and npm audit gates; secrets stay out of the repository.', link: { label: 'Security policy', href: `${BLOB}/SECURITY.md` } },
  { title: 'Accessibility', text: 'Automated axe-core checks in light and dark themes, plus keyboard and reduced-motion support.', link: { label: 'Accessibility notes', href: `${BLOB}/docs/ACCESSIBILITY.md` } },
  { title: 'Vercel Deployment', text: 'Git-integrated preview and production deployments, verified by a post-deploy smoke test.', link: { label: 'Deployment guide', href: `${BLOB}/docs/DEPLOYMENT.md` } },
  { title: 'GitHub Source Code', text: 'A Next.js and Expo monorepo with a published design-token package.', link: { label: 'Repository', href: REPO } },
  { title: 'System Architecture', text: 'Web and mobile architecture, data flow and delivery pipeline, documented with diagrams.', link: { label: 'Architecture', href: `${BLOB}/docs/ARCHITECTURE.md` } },
];
