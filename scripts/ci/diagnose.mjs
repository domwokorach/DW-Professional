#!/usr/bin/env node
// Failure diagnostics for the Jenkins pipelines. Dependency-free (runs even when `npm ci` failed).
//
//   diagnose.mjs report                 write failure-report.{md,json} and failure-summary.txt from what the build recorded
//   diagnose.mjs classify <exit> <log>  print the category of one failure
//   diagnose.mjs summary <outdir>        write <outdir>/summary.md from every scenario's verification.json
//   diagnose.mjs verify <scenario> <dir> check a controlled-failure scenario (see diagnostic-scenarios.sh): exit 0 only if the
//                                        failure really happened with the expected exit code, left the expected evidence,
//                                        and was classified correctly
//
// It only describes what Jenkins and the commands really reported. It never changes a build result, never writes a
// passing report for a failed stage, and reports a stage as "not executed" (never "passed") when it did not run.
//
// Inputs for `report` (environment): REPORTS (default reports/ci), JOB_NAME, BUILD_NUMBER, BUILD_URL, BUILD_RESULT,
// DIAGNOSTIC_RUN ("true" for the controlled-failure pipeline). The build writes $REPORTS/diagnostics/execution.json:
//   { stages: [ordered leaf stage names], entered: [names], failures: [{stage, exitCode, message, slug, ts}] }
// and each bash stage leaves $REPORTS/diagnostics/<slug>.log (its output) and <slug>.cmd (the command that failed).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** First matching rule wins. `test` runs against the stage name, command, Jenkins message and the end of the log. */
export const RULES = [
  { id: 'docker', test: /Docker is unavailable|Cannot connect to the Docker daemon|docker: command not found|docker\.sock/i,
    cause: 'The Docker daemon is not running or not reachable by the Jenkins user, so the disposable PostgreSQL container cannot be created.',
    fix: 'Start Docker Desktop (or `colima start`), confirm `docker info` works as the Jenkins user, and make sure the Docker CLI directory is on the PATH Jenkins uses.' },
  { id: 'database-container', test: /PostgreSQL did not become ready|Could not discover the dynamically allocated PostgreSQL port|No such container/i,
    cause: 'The disposable PostgreSQL container started but never accepted connections (or its port could not be found).',
    fix: 'Inspect `docker logs` for the container (included in the log excerpt), free memory or disk, and confirm the image `postgres:16-alpine` is present.' },
  { id: 'database-connection', test: /P1001|P1000|Can't reach database server|ECONNREFUSED|connect ECONN|database .* does not exist|password authentication failed/i,
    cause: 'The database could not be reached or authenticated against: wrong host or port, the container is not running, or the credentials are wrong.',
    fix: 'Check that the disposable database container is running and that TEST_DATABASE_URL points at its mapped loopback port. Never point it at a production database.' },
  { id: 'database-migration', test: /P3009|P3018|P3005|migration .* failed|prisma migrate|Migration failed/i,
    cause: 'A Prisma migration failed or the target database is in an unexpected state.',
    fix: 'Read the failing migration in the log excerpt, fix the SQL or schema, and re-run against a fresh disposable database.' },
  { id: 'test-did-not-complete', test: /TESTING DID NOT COMPLETE|no valid JUnit report|JUnit.*(missing|cannot be read|incomplete)|contains no test cases/i,
    cause: 'The test runner finished without producing a complete, valid JUnit report, so the results cannot be trusted. The incomplete files are quarantined and nothing is published as passing.',
    fix: 'Open the quarantined output under reports/ci/diagnostics/, look for a crash, timeout or interrupted run, and fix it. Re-run once a complete report is produced.' },
  { id: 'tests-skipped', test: /skipped test\(s\)|integration tests did not all run/i,
    cause: 'Integration tests were skipped, which this pipeline treats as a failure because the database tests must really run.',
    fix: 'Make sure TEST_DATABASE_URL is set and reachable so the database-backed tests execute.' },
  { id: 'coverage-threshold', test: /below the (required|minimum)|Coverage .* below|coverage threshold/i,
    cause: 'Measured coverage is below the required threshold.',
    fix: 'Add tests for the uncovered code, or (deliberately and with review) change the threshold. Do not lower it just to pass.' },
  { id: 'coverage-unavailable', test: /Coverage unavailable|lcov\.info (is empty|cannot be read|has no complete)/i,
    cause: 'No valid LCOV coverage data was produced, so coverage cannot be measured.',
    fix: 'Check that the test run completed and wrote lcov.info; fix the runner rather than skipping the coverage check.' },
  { id: 'tests-failed', test: /# fail [1-9]|✖ .*\(\d|AssertionError|ERR_ASSERTION|failing tests:|[1-9]\d* failed/i,
    cause: 'One or more automated tests failed.',
    fix: 'Open the failing test in the JUnit report (Test Result page) and the log excerpt, reproduce it locally, and fix the code or the test.' },
  { id: 'typescript', test: /error TS\d+/i,
    cause: 'TypeScript compilation failed: the code contains type errors.',
    fix: 'Fix each reported `error TSxxxx` (file and line are in the log excerpt); run `npm run typecheck` locally to confirm.' },
  { id: 'eslint', test: /✖ \d+ problems?|eslint.*error|\d+ errors?, \d+ warnings?/i,
    cause: 'ESLint reported errors.',
    fix: 'Run `npm run lint` locally, fix the reported rules (or justify a narrow, reviewed disable).' },
  { id: 'security-audit', test: /npm audit|found \d+ vulnerabilit|Vulnerabilities \(production/i,
    cause: 'The dependency audit found a vulnerability at or above the blocking severity (high), or the audit could not run.',
    fix: 'Read reports/ci/npm-audit.json, update the affected package with a normal (non-breaking) update, and re-run. Never use `npm audit fix --force` blindly.' },
  { id: 'dependency-install', test: /npm (ERR|error)|ERESOLVE|EINTEGRITY|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|E404|lockfile|npm ci/i,
    cause: 'Installing dependencies failed: a network problem, an integrity or lockfile mismatch, or an unresolvable dependency.',
    fix: 'Check the network and registry access, make package-lock.json consistent with package.json (`npm install` locally and commit the lock file), then re-run.' },
  { id: 'nextjs-build', test: /Failed to compile|Build failed|Build error occurred|next build|Turbopack build failed|Parsing ecmascript source code failed|Type error:/i,
    cause: 'The Next.js production build failed: a compile, type or runtime error in a page or route.',
    fix: 'Read the first error in reports/ci/next-build.log (file and line are shown), fix it, and run `npx next build` locally.' },
  { id: 'expo-export', test: /expo export|Unable to resolve|Metro|expo-router|Bundling failed/i,
    cause: 'The Expo web export failed: Metro could not resolve or bundle part of the mobile app.',
    fix: 'Read reports/ci/expo-export.log for the unresolved module or bundling error and fix the import or dependency.' },
  { id: 'timeout', test: /Timeout has been exceeded|timed out|Timeout set to expire/i,
    cause: 'A stage exceeded its time limit, usually because the agent was starved of CPU or memory or a command hung.',
    fix: 'Check the load and swap lines printed by Validate environment, free resources on the agent, and re-run; raise the limit only if the work is genuinely slower.' },
  { id: 'command-not-found', test: /command not found|: not found|exit code 127/i,
    cause: 'A required command is not installed or not on the PATH used by Jenkins.',
    fix: 'Install the tool and make sure its directory is on the Jenkins PATH (the Jenkinsfile appends /opt/homebrew/bin and /usr/local/bin).' },
  { id: 'release-manifest', test: /release-manifest/i,
    cause: 'The release manifest could not be written.',
    fix: 'Check that reports/ci exists and is writable and that git metadata is available.' },
];

export function classify({ stage = '', command = '', message = '', log = '', exitCode } = {}) {
  const text = `${stage}\n${command}\n${message}\n${log}`;
  for (const rule of RULES) if (rule.test.test(text)) return { category: rule.id, rootCause: rule.cause, recommendation: rule.fix };
  return {
    category: 'unclassified',
    rootCause: `The stage failed${exitCode == null ? '' : ` with exit code ${exitCode}`} and no known pattern matched. The cause is in the log excerpt.`,
    recommendation: 'Read the console output for the first error, reproduce the command locally, and fix the underlying problem.',
  };
}

const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
const tail = (text, lines) => text.replace(ANSI, '').trimEnd().split('\n').slice(-lines).join('\n');
const readIf = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');

function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; }
}

/** Reports a stage produced that a reader can open (name, size). Only files that really exist. */
function availableReports(reports) {
  const known = ['junit.xml', 'lcov.info', 'coverage-summary.txt', 'test-summary.json', 'npm-audit.json', 'next-build.log', 'expo-export.log', 'build-summary.txt', 'release-manifest.json'];
  const found = known.filter((f) => existsSync(path.join(reports, f))).map((f) => ({ file: `${reports}/${f}`, bytes: statSync(path.join(reports, f)).size }));
  const quarantined = existsSync(path.join(reports, 'diagnostics')) ? readdirSync(path.join(reports, 'diagnostics')).filter((f) => f.startsWith('raw-')) : [];
  for (const f of quarantined) found.push({ file: `${reports}/diagnostics/${f}`, bytes: statSync(path.join(reports, 'diagnostics', f)).size, note: 'quarantined: incomplete or invalid' });
  return found;
}

export function buildReport(env = process.env) {
  const reports = env.REPORTS || 'reports/ci';
  const dir = path.join(reports, 'diagnostics');
  const exec = readJson(path.join(dir, 'execution.json'), { stages: [], entered: [], failures: [] });
  const failures = [...exec.failures].sort((a, b) => a.ts - b.ts).map((f) => {
    const log = readIf(path.join(dir, `${f.slug}.log`));
    const command = readIf(path.join(dir, `${f.slug}.cmd`)).trim() || null;
    const excerpt = tail(log, 40);
    return { ...f, command, durationMs: f.durationMs ?? null, excerpt, ...classify({ stage: f.stage, command: command ?? '', message: f.message, log: excerpt, exitCode: f.exitCode }) };
  });
  const failedStages = new Set(failures.map((f) => f.stage));
  const entered = new Set(exec.entered);
  // A stage that never started is "not executed". It is never reported as passed, and is not a failure of its own.
  const notExecuted = exec.stages.filter((s) => !entered.has(s) && !failedStages.has(s));
  const result = env.BUILD_RESULT || 'UNKNOWN';
  const diagnostic = env.DIAGNOSTIC_RUN === 'true';
  return {
    kind: diagnostic ? 'DIAGNOSTIC RUN (intentional failures, not a production result)' : 'production pipeline',
    job: env.JOB_NAME || 'n/a', build: env.BUILD_NUMBER || 'n/a', url: env.BUILD_URL || null, result,
    originalFailure: failures[0] ?? null,
    additionalFailures: failures.slice(1),
    notExecuted: failures.length ? notExecuted : [],
    stagesNotReached: failures.length ? [] : notExecuted,
    reports: availableReports(reports),
  };
}

const line = (v) => (v == null || v === '' ? 'n/a' : String(v));

function markdown(r) {
  const out = [`# Pipeline failure report`, '', `- Run type: **${r.kind}**`, `- Job: ${r.job}  |  Build: #${r.build}  |  Result: **${r.result}**`];
  if (r.url) out.push(`- URL: ${r.url}`);
  if (!r.originalFailure) {
    out.push('', r.result === 'SUCCESS' ? 'No failures were recorded.' : `No stage failure was recorded by the pipeline, but the build result is ${r.result}. Check the console output (for example a timeout or cancellation).`);
  }
  const block = (f, title) => out.push('', `## ${title}: ${f.stage}`, '',
    `- Failed command: \`${line(f.command)}\``, `- Exit code: ${line(f.exitCode)}`, `- Category: ${f.category}`, `- Error message: ${line(f.message)}`,
    `- Root cause: ${f.rootCause}`, `- Recommended solution: ${f.recommendation}`, '', '```', f.excerpt || '(no console output captured for this stage)', '```');
  if (r.originalFailure) block(r.originalFailure, 'ORIGINAL FAILURE');
  for (const f of r.additionalFailures) block(f, 'Additional failure');
  if (r.notExecuted.length) out.push('', '## Not executed (skipped because of the failure above, not passed)', '', ...r.notExecuted.map((s) => `- ${s}`));
  if (r.stagesNotReached.length) out.push('', '## Stages that did not run', '', ...r.stagesNotReached.map((s) => `- ${s}`));
  out.push('', '## Available reports', '', ...(r.reports.length ? r.reports.map((x) => `- ${x.file} (${x.bytes} bytes)${x.note ? ` – ${x.note}` : ''}`) : ['- none were produced']));
  return out.join('\n') + '\n';
}

function summaryLine(r) {
  if (!r.originalFailure) return '';
  const f = r.originalFailure;
  return `Failed in "${f.stage}"${f.exitCode == null ? '' : ` (exit ${f.exitCode})`}: ${f.category}. ${r.notExecuted.length} later stage(s) not executed.`;
}

/** What each controlled-failure scenario must produce. The exit codes are the real ones from the tools involved. */
export const EXPECTED = {
  'unit-test': { exit: 1, category: 'tests-failed', what: 'unit test assertion failure' },
  typescript: { exit: 2, category: 'typescript', what: 'TypeScript compilation failure' },
  database: { exit: 1, category: 'database-connection', what: 'database connection failure' },
  coverage: { exit: 4, category: 'coverage-threshold', what: 'coverage threshold failure' },
  'missing-junit': { exit: 70, category: 'test-did-not-complete', what: 'missing JUnit report' },
  'production-build': { exit: 1, category: 'nextjs-build', what: 'production build failure' },
};

export function verifyScenario(scenario, dir) {
  const expected = EXPECTED[scenario];
  if (!expected) return { ok: false, scenario, problems: [`unknown scenario "${scenario}"`] };
  const problems = [];
  const raw = readIf(path.join(dir, 'exit-code')).trim();
  const observed = raw === '' ? null : Number(raw);
  if (observed === null) problems.push('the scenario did not record an exit code (it did not run)');
  else if (observed === 0) problems.push('the injected fault did NOT make the command fail (exit 0): the failure was not detected');
  else if (observed !== expected.exit) problems.push(`expected exit code ${expected.exit} but observed ${observed}`);
  for (const l of readIf(path.join(dir, 'evidence.txt')).split('\n')) if (l.startsWith('MISSING')) problems.push(`missing evidence: ${l.slice(9)}`);
  const category = classify({ log: tail(readIf(path.join(dir, 'run.log')), 80), exitCode: observed ?? undefined }).category;
  if (category !== expected.category) problems.push(`classified as "${category}" but expected "${expected.category}"`);
  return { ok: problems.length === 0, scenario, what: expected.what, expectedExit: expected.exit, observedExit: observed, expectedCategory: expected.category, category, problems };
}

function main(argv) {
  const [command, ...args] = argv;
  if (command === 'classify') {
    const [exitCode, logFile] = args;
    const log = readIf(logFile);
    process.stdout.write(classify({ log: tail(log, 80), exitCode: Number(exitCode) }).category + '\n');
    return 0;
  }
  if (command === 'report') {
    const reports = process.env.REPORTS || 'reports/ci';
    const r = buildReport();
    writeFileSync(path.join(reports, 'failure-report.json'), JSON.stringify(r, null, 2) + '\n');
    writeFileSync(path.join(reports, 'failure-report.md'), markdown(r));
    writeFileSync(path.join(reports, 'failure-summary.txt'), summaryLine(r) + '\n');
    console.log(summaryLine(r) || 'No failure recorded.');
    return 0;
  }
  if (command === 'verify') {
    const [scenario, dir] = args;
    const r = verifyScenario(scenario, dir);
    writeFileSync(path.join(dir, 'verification.json'), JSON.stringify(r, null, 2) + '\n');
    console.log(`${r.ok ? 'VERIFIED' : 'NOT VERIFIED'}: ${scenario}${r.what ? ` (${r.what})` : ''}: exit ${r.observedExit} (expected ${r.expectedExit}), category ${r.category} (expected ${r.expectedCategory})`);
    for (const p of r.problems) console.log(`  - ${p}`);
    return r.ok ? 0 : 1;
  }
  if (command === 'summary') {
    const [outdir] = args;
    const rows = Object.keys(EXPECTED).map((name) => ({ name, r: readJson(path.join(outdir, name, 'verification.json'), null) }));
    const md = ['# Controlled-failure scenarios (DIAGNOSTIC RUN: intentional failures, not a production result)', '',
      '| Scenario | Injected fault | Observed exit | Expected exit | Classified as | Result |', '|---|---|---|---|---|---|',
      ...rows.map(({ name, r }) => r
        ? `| ${name} | ${r.what} | ${line(r.observedExit)} | ${r.expectedExit} | ${r.category} | ${r.ok ? 'VERIFIED' : 'NOT VERIFIED: ' + r.problems.join('; ')} |`
        : `| ${name} | ${EXPECTED[name].what} | n/a | ${EXPECTED[name].exit} | n/a | NOT RUN |`)].join('\n') + '\n';
    writeFileSync(path.join(outdir, 'summary.md'), md);
    console.log(md);
    return rows.every(({ r }) => r && r.ok) ? 0 : 1;
  }
  console.error('usage: diagnose.mjs report | classify <exit> <log> | verify <scenario> <dir> | summary <outdir>');
  return 64;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
