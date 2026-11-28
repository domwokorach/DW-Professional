import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, test } from 'node:test';

// Black-box tests of scripts/ci/diagnose.mjs: they run the real CLI the pipeline runs.
const CLI = path.resolve('scripts/ci/diagnose.mjs');
const run = (args: string[], env: Record<string, string> = {}) =>
  spawnSync('node', [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

const scratch = () => mkdtempSync(path.join(tmpdir(), 'dw-diagnose-'));
const classify = (log: string) => {
  const dir = scratch();
  const file = path.join(dir, 'log.txt');
  writeFileSync(file, log);
  return run(['classify', '1', file]).stdout.trim();
};

describe('failure classification', () => {
  const cases: [string, string][] = [
    ['Docker is unavailable to Jenkins: cannot create the disposable PostgreSQL container', 'docker'],
    ["Error: P1001: Can't reach database server at `127.0.0.1:1`", 'database-connection'],
    ['Error: P3009 migrate found failed migrations', 'database-migration'],
    ['TESTING DID NOT COMPLETE: no valid JUnit report was produced.', 'test-did-not-complete'],
    ['2 skipped test(s): integration tests did not all run', 'tests-skipped'],
    ['Coverage is below the required 90% (measured 16.53%)', 'coverage-threshold'],
    ['Coverage unavailable: lcov.info is empty', 'coverage-unavailable'],
    ['✖ failing tests:\n  AssertionError [ERR_ASSERTION]: 4 !== 5', 'tests-failed'],
    ["src/a.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'.", 'typescript'],
    ['npm error code ERESOLVE\nnpm error ERESOLVE could not resolve', 'dependency-install'],
    ['Failed to compile.\n./app/page.tsx', 'nextjs-build'],
    ['Unable to resolve module ./Missing from apps/mobile/app/index.tsx', 'expo-export'],
    ['Timeout has been exceeded', 'timeout'],
    ['bash: rsync: command not found', 'command-not-found'],
    ['something nobody has seen before', 'unclassified'],
  ];
  for (const [log, expected] of cases) {
    test(`${expected}: ${log.split('\n')[0].slice(0, 50)}`, () => assert.equal(classify(log), expected));
  }
});

describe('failure report', () => {
  const setup = (execution: object, logs: Record<string, string> = {}, files: Record<string, string> = {}) => {
    const reports = path.join(scratch(), 'reports/ci');
    mkdirSync(path.join(reports, 'diagnostics'), { recursive: true });
    writeFileSync(path.join(reports, 'diagnostics/execution.json'), JSON.stringify(execution));
    for (const [name, text] of Object.entries(logs)) writeFileSync(path.join(reports, 'diagnostics', name), text);
    for (const [name, text] of Object.entries(files)) writeFileSync(path.join(reports, name), text);
    return reports;
  };
  const report = (reports: string, env: Record<string, string> = {}) => {
    const r = run(['report'], { REPORTS: reports, JOB_NAME: 'DW-Professional-CI', BUILD_NUMBER: '23', BUILD_RESULT: 'FAILURE', ...env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(readFileSync(path.join(reports, 'failure-report.json'), 'utf8'));
  };
  const STAGES = ['Checkout', 'Validate environment', 'Install', 'Web typecheck', 'Archive'];

  test('separates the original failure from stages skipped because of it, and never calls a skipped stage passed', () => {
    const reports = setup(
      { stages: STAGES, entered: ['Checkout', 'Validate environment'], failures: [{ stage: 'Validate environment', slug: 'validate-environment', exitCode: null, message: 'Docker is unavailable to Jenkins: cannot create the disposable PostgreSQL container for integration tests.', ts: 1 }] },
      { 'validate-environment.log': 'node v22\nPATH=/usr/bin\n' },
    );
    const r = report(reports);
    assert.equal(r.originalFailure.stage, 'Validate environment');
    assert.equal(r.originalFailure.category, 'docker');
    assert.match(r.originalFailure.recommendation, /Docker/);
    assert.deepEqual(r.notExecuted, ['Install', 'Web typecheck', 'Archive']);
    assert.ok(!r.notExecuted.includes('Checkout'));
    const md = readFileSync(path.join(reports, 'failure-report.md'), 'utf8');
    assert.match(md, /ORIGINAL FAILURE: Validate environment/);
    assert.match(md, /skipped because of the failure above, not passed/);
    assert.match(readFileSync(path.join(reports, 'failure-summary.txt'), 'utf8'), /Failed in "Validate environment"/);
  });

  test('lists the first failure as original and a parallel-lane failure as additional; reads the failed command, exit code and log', () => {
    const reports = setup(
      { stages: STAGES, entered: ['Checkout', 'Web typecheck', 'Install'], failures: [
        { stage: 'Web typecheck', slug: 'web-typecheck', exitCode: 2, message: 'script returned exit code 2', ts: 1 },
        { stage: 'Install', slug: 'install', exitCode: 1, message: 'script returned exit code 1', ts: 2 }] },
      { 'web-typecheck.log': "src/a.ts(1,1): error TS2322: bad\n", 'web-typecheck.cmd': 'npm run typecheck', 'install.log': 'npm error ERESOLVE\n' },
    );
    const r = report(reports);
    assert.equal(r.originalFailure.stage, 'Web typecheck');
    assert.equal(r.originalFailure.command, 'npm run typecheck');
    assert.equal(r.originalFailure.exitCode, 2);
    assert.equal(r.originalFailure.category, 'typescript');
    assert.equal(r.additionalFailures[0].stage, 'Install');
    assert.equal(r.additionalFailures[0].category, 'dependency-install');
  });

  test('lists only reports that really exist, including quarantined ones, and labels diagnostic runs', () => {
    const reports = setup({ stages: STAGES, entered: STAGES, failures: [] }, { 'raw-junit.xml': '<testsuites>' }, { 'junit.xml': '<testsuites></testsuites>' });
    const r = report(reports, { BUILD_RESULT: 'SUCCESS', DIAGNOSTIC_RUN: 'true' });
    assert.match(r.kind, /DIAGNOSTIC RUN/);
    assert.equal(r.originalFailure, null);
    const files = r.reports.map((x: { file: string }) => path.basename(x.file));
    assert.ok(files.includes('junit.xml') && files.includes('raw-junit.xml'));
    assert.ok(!files.includes('lcov.info'));
    assert.match(readFileSync(path.join(reports, 'failure-report.md'), 'utf8'), /No failures were recorded/);
  });

  test('a failed build with no recorded stage failure says so instead of inventing one', () => {
    const reports = setup({ stages: STAGES, entered: ['Checkout'], failures: [] });
    const r = report(reports, { BUILD_RESULT: 'ABORTED' });
    assert.equal(r.originalFailure, null);
    assert.match(readFileSync(path.join(reports, 'failure-report.md'), 'utf8'), /build result is ABORTED/);
  });
});

describe('controlled-failure verification', () => {
  const scenario = (exit: string | null, log: string, evidence = 'ok: something\n') => {
    const dir = scratch();
    if (exit !== null) writeFileSync(path.join(dir, 'exit-code'), exit);
    writeFileSync(path.join(dir, 'run.log'), log);
    writeFileSync(path.join(dir, 'evidence.txt'), evidence);
    return dir;
  };

  test('passes when the failure happened with the expected exit code, evidence and classification', () => {
    const r = run(['verify', 'typescript', scenario('2', "src/broken.ts(2,14): error TS2322: Type 'string' is not assignable")]);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /VERIFIED: typescript/);
  });

  test('FAILS when the injected fault did not make the command fail (exit 0): a missed failure is never "verified"', () => {
    const r = run(['verify', 'typescript', scenario('0', 'no errors')]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /NOT VERIFIED/);
    assert.match(r.stdout, /did NOT make the command fail/);
  });

  test('FAILS on the wrong exit code, missing evidence, or a wrong classification', () => {
    assert.equal(run(['verify', 'typescript', scenario('1', "error TS2322: x")]).status, 1);
    assert.equal(run(['verify', 'unit-test', scenario('1', '✖ failing tests:', 'MISSING: a JUnit report was published\n')]).status, 1);
    assert.equal(run(['verify', 'database', scenario('1', 'error TS2322: this is a type error, not a database failure')]).status, 1);
  });

  test('FAILS when the scenario never ran', () => {
    assert.equal(run(['verify', 'coverage', scenario(null, '')]).status, 1);
  });
});
