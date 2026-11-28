// Prints the one-line summary CI publishes as the `engineering/test-report` commit status, computed only from
// the real files: reports/junit/all.xml (test counts) and reports/coverage/coverage-summary.json (coverage).
// Exits non-zero, printing nothing, if either file is missing or unreadable, so a number is never invented.
//   tests=97 passed=97 failed=0 skipped=0 lines=14.62 branches=64.05 functions=33.64
import { readFileSync } from 'node:fs';

function fail(message) {
  console.error(`report-summary: ${message}`);
  process.exit(1);
}

let xml;
let summary;
try { xml = readFileSync('reports/junit/all.xml', 'utf8'); } catch { fail('reports/junit/all.xml is missing'); }
try { summary = JSON.parse(readFileSync('reports/coverage/coverage-summary.json', 'utf8')); } catch { fail('reports/coverage/coverage-summary.json is missing or invalid'); }

const count = (re) => (xml.match(re) ?? []).length;
const tests = count(/<testcase\b/g);
const failed = count(/<failure\b/g) + count(/<error\b/g);
const skipped = count(/<skipped\b/g);
const passed = tests - failed - skipped;
if (tests === 0) fail('the JUnit report contains no test cases');

const total = summary.total;
const pct = (k) => {
  const v = total?.[k]?.pct;
  if (typeof v !== 'number') fail(`coverage summary has no ${k} percentage`);
  return v;
};
console.log(`tests=${tests} passed=${passed} failed=${failed} skipped=${skipped} lines=${pct('lines')} branches=${pct('branches')} functions=${pct('functions')}`);
