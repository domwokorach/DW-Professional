#!/usr/bin/env node
// CI report validation. Dependency-free so it can run before and after `npm ci`.
//   reports.mjs junit <junit.xml>              validate JUnit XML, print a JSON summary, exit 2 if unusable
//   reports.mjs coverage <lcov.info> <out.txt> validate LCOV, write the summary, exit 3 if coverage is unavailable
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [command, ...args] = process.argv.slice(2);

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

function junit(file) {
  let buf;
  try {
    if (statSync(file).size === 0) fail(2, `${file} is empty`);
    buf = readFileSync(file);
  } catch (error) {
    fail(2, `${file} cannot be read: ${error.message}`);
  }
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    fail(2, `${file} is not valid UTF-8`);
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) fail(2, `${file} contains XML-illegal control characters`);
  if (!/<testsuites?[\s>]/.test(text) || !/<\/testsuites?>\s*$/.test(text)) {
    fail(2, `${file} is incomplete: no closed <testsuites> root (the test run was probably interrupted)`);
  }
  const lint = spawnSync('xmllint', ['--noout', file], { encoding: 'utf8' });
  if (lint.error) fail(2, `xmllint is required to validate ${file}: ${lint.error.message}`);
  if (lint.status !== 0) fail(2, `${file} is not well-formed XML:\n${(lint.stderr || '').slice(0, 800)}`);

  const count = (re) => (text.match(re) || []).length;
  const tests = count(/<testcase[\s>]/g);
  const failed = count(/<failure[\s>]/g);
  const errors = count(/<error[\s>]/g);
  const skipped = count(/<skipped[\s/>]/g);
  if (tests === 0) fail(2, `${file} contains no test cases`);
  const passed = Math.max(tests - failed - errors - skipped, 0);
  console.log(JSON.stringify({ tests, passed, failed, errors, skipped }));
}

function coverage(file, out) {
  const unavailable = (reason) => {
    writeFileSync(out, `Line coverage: UNAVAILABLE (${reason})\n`);
    fail(3, `Coverage unavailable: ${reason}`);
  };
  let text;
  try {
    if (statSync(file).size === 0) unavailable('lcov.info is empty');
    text = readFileSync(file, 'utf8');
  } catch (error) {
    unavailable(`lcov.info cannot be read: ${error.code || error.message}`);
  }
  if (!/^SF:/m.test(text) || !/^end_of_record/m.test(text)) unavailable('lcov.info has no complete source records');
  const sum = (key) =>
    [...text.matchAll(new RegExp(`^${key}:(\\d+)$`, 'gm'))].reduce((total, match) => total + Number(match[1]), 0);
  const lf = sum('LF');
  const lh = sum('LH');
  if (lf <= 0) unavailable('no executable lines (LF) recorded');
  if (lh > lf) unavailable(`inconsistent counts (LH ${lh} > LF ${lf})`);
  const lines = [`Line coverage: ${((100 * lh) / lf).toFixed(2)}% (${lh}/${lf})`];
  const brf = sum('BRF');
  if (brf > 0) lines.push(`Branch coverage: ${((100 * sum('BRH')) / brf).toFixed(2)}% (${sum('BRH')}/${brf})`);
  const fnf = sum('FNF');
  if (fnf > 0) lines.push(`Function coverage: ${((100 * sum('FNH')) / fnf).toFixed(2)}% (${sum('FNH')}/${fnf})`);
  writeFileSync(out, lines.join('\n') + '\n');
  console.log(lines.join('\n'));
}

if (command === 'junit' && args[0]) junit(args[0]);
else if (command === 'coverage' && args[0] && args[1]) coverage(args[0], args[1]);
else fail(64, 'usage: reports.mjs junit <file> | coverage <lcov> <out>');
