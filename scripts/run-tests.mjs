// Runs a named suite with Node's built-in test runner (via tsx), always writing a real JUnit XML report
// to reports/junit/<suite>.xml. With --coverage it also collects V8 coverage through c8 (HTML, LCOV,
// JSON summary in reports/coverage) and enforces the thresholds in .c8rc.json.
// With --collect it only accumulates V8 coverage data (no threshold check) so suites can run in parallel;
// `npm run coverage:report` then merges everything and enforces the thresholds once.
// Reports are written by the runner itself; nothing here fabricates results.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';

const SUITES = {
  // Pure logic and server helpers; no database, browser or network.
  unit: ['admin-auth', 'clock-angles', 'design-tokens-contrast', 'experience-duration', 'engineering-data', 'engineering-status', 'github-contributions', 'linkedin-oidc', 'resume-unit', 'companies-live'],
  // Route handlers and stores; the database-backed cases need TEST_DATABASE_URL and report as skipped without it.
  integration: ['companies-db', 'resume-company', 'resume-flow', 'resume-regression'],
  // React components rendered in jsdom with Testing Library.
  component: ['certifications-carousel'],
};

const [suite = 'all', ...flags] = process.argv.slice(2);
const coverage = flags.includes('--coverage');
const collect = flags.includes('--collect');
const all = readdirSync('tests').filter((f) => f.endsWith('.test.ts')).map((f) => f.replace(/\.test\.ts$/, ''));
const names = suite === 'all' ? all : SUITES[suite];
if (!names) { console.error(`Unknown suite "${suite}". Use: all, ${Object.keys(SUITES).join(', ')}`); process.exit(2); }
const unassigned = all.filter((n) => !Object.values(SUITES).flat().includes(n));
if (suite === 'all' && unassigned.length) console.warn(`Note: not in a named suite (still run under "all"): ${unassigned.join(', ')}`);

mkdirSync('reports/junit', { recursive: true });
const nodeArgs = [
  '--import', 'tsx', '--test', '--test-concurrency=1',
  '--test-reporter=spec', '--test-reporter-destination=stdout',
  '--test-reporter=junit', `--test-reporter-destination=reports/junit/${suite}.xml`,
  ...names.map((n) => `tests/${n}.test.ts`),
];
const c8 = collect ? ['c8', '--clean=false', '--check-coverage=false', '--reporter=json-summary'] : ['c8', '--check-coverage'];
const [cmd, args] = coverage || collect ? ['npx', [...c8, 'node', ...nodeArgs]] : ['node', nodeArgs];
const result = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
process.exit(result.status ?? 1);
