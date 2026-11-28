#!/usr/bin/env bash
# CONTROLLED-FAILURE SCENARIOS for the diagnostic pipeline (Jenkinsfile.diagnostics). Never part of the production pipeline.
#
#   diagnostic-scenarios.sh <scenario> <outdir>
#
# Each scenario injects ONE deliberate fault into a throwaway copy under <outdir>/work and runs the repository's real
# tooling against it. Nothing is changed in the real source tree, and nothing is committed. The script records what
# really happened in <outdir>/<scenario>/ (run.log, exit-code, evidence.txt) and always exits 0: whether the failure
# was detected and handled correctly is judged afterwards by `diagnose.mjs verify`.
#
#   unit-test            a failing assertion, run through scripts/ci/test-ci.sh
#   typescript           a type error, run through tsc
#   database             a migration against a closed port (nothing is listening)
#   coverage             line coverage below a required threshold, run through reports.mjs
#   missing-junit        a test runner that "succeeds" but writes no JUnit report, run through test-ci.sh
#   production-build     a syntax error in a page, run through `next build`
set -uo pipefail

scenario="${1:?scenario required}"
out="$(cd "${2:?outdir required}" && pwd)"
root="$(pwd)"
dir="$out/$scenario"
work="$out/work/$scenario"
rm -rf "$dir" "$work"
mkdir -p "$dir" "$work"
: > "$dir/evidence.txt"

evidence() { printf '%s: %s\n' "$1" "$2" >> "$dir/evidence.txt"; }
check() { if eval "$2"; then evidence ok "$1"; else evidence MISSING "$1"; fi; }

# A throwaway copy of the repository: sources and scripts, linked (not copied) node_modules, no git history.
copy_repo() {
  rsync -a --exclude node_modules --exclude '.git' --exclude '.next' --exclude 'apps/*/node_modules' \
    --exclude reports --exclude public --exclude '.diagnostics' --exclude 'diagnostics-out' "$root/" "$work/"
  ln -s "$root/node_modules" "$work/node_modules"
}

run() { # run <command...> in the working copy, recording output and the real exit status
  ( cd "$work" && "$@" ) > "$dir/run.log" 2>&1
  echo $? > "$dir/exit-code"
}

case "$scenario" in
  unit-test)
    copy_repo
    rm -rf "$work/tests" && mkdir -p "$work/tests"
    cat > "$work/tests/zz-diagnostic-assertion.test.ts" <<'TS'
import assert from 'node:assert/strict';
import { test } from 'node:test';

// DIAGNOSTIC: this failure is intentional. It exists only to prove the pipeline reports a failing test truthfully.
test('DIAGNOSTIC intentional failure: 2 + 2 equals 5', () => {
  assert.equal(2 + 2, 5);
});
TS
    REPORTS="$work/reports/ci" PATH="$root/node_modules/.bin:$PATH" run bash scripts/ci/test-ci.sh
    cp "$work/reports/ci/junit.xml" "$dir/junit.xml" 2>/dev/null
    check "a JUnit report was published" "[ -s '$work/reports/ci/junit.xml' ]"
    check "the JUnit report records the failed test (<failure>)" "grep -q '<failure' '$work/reports/ci/junit.xml'"
    check "the summary counts 1 failed test" "grep -q '\"failed\":1' '$work/reports/ci/test-summary.json'"
    ;;

  typescript)
    copy_repo
    rm -rf "$work/src" "$work/tests" "$work/apps" && mkdir -p "$work/src"
    printf '{"compilerOptions":{"strict":true,"noEmit":true,"target":"es2022","module":"esnext","moduleResolution":"bundler"},"include":["src/**/*.ts"]}\n' > "$work/tsconfig.json"
    printf "// DIAGNOSTIC: intentional type error.\nexport const total: number = 'not a number';\n" > "$work/src/broken.ts"
    PATH="$root/node_modules/.bin:$PATH" run tsc --noEmit -p tsconfig.json
    check "the compiler named the error (TS2322)" "grep -q 'error TS2322' '$dir/run.log'"
    check "the compiler named the file" "grep -q 'src/broken.ts' '$dir/run.log'"
    ;;

  database)
    copy_repo
    # Port 1 has no listener: a real connection failure, not a simulated message.
    DATABASE_URL='postgresql://ci:ci@127.0.0.1:1/ci' PORTFOLIO_DATABASE_URL='postgresql://ci:ci@127.0.0.1:1/ci' \
      PATH="$root/node_modules/.bin:$PATH" run prisma migrate deploy
    check "Prisma reported it could not reach the database" "grep -qiE 'P1001|can.t reach database server|ECONNREFUSED' '$dir/run.log'"
    ;;

  coverage)
    copy_repo
    rm -rf "$work/tests" "$work/src" && mkdir -p "$work/src"
    {
      echo "// DIAGNOSTIC: mostly untested on purpose."
      echo "export const covered = (n: number) => n + 1;"
      for i in $(seq 1 40); do
        printf 'export function untested%s(n: number) {\n  if (n > %s) {\n    return n * %s;\n  }\n  return n - %s;\n}\n' "$i" "$i" "$i" "$i"
      done
    } > "$work/src/lib.ts"
    printf "import assert from 'node:assert/strict';\nimport { test } from 'node:test';\nimport { covered } from './lib.ts';\ntest('covered', () => assert.equal(covered(1), 2));\n" > "$work/src/lib.test.ts"
    ( cd "$work" && PATH="$root/node_modules/.bin:$PATH" tsx --test --experimental-test-coverage --test-coverage-exclude='**/*.test.ts' \
        --test-reporter=lcov --test-reporter-destination=lcov.info src/lib.test.ts > "$dir/tests.log" 2>&1 )
    check "the test run produced an LCOV file" "[ -s '$work/lcov.info' ]"
    run node scripts/ci/reports.mjs coverage lcov.info coverage-summary.txt --min-lines 90
    cp "$work/coverage-summary.txt" "$dir/coverage-summary.txt" 2>/dev/null
    check "the summary states the threshold failed" "grep -q 'Coverage threshold: FAILED' '$work/coverage-summary.txt'"
    ;;

  missing-junit)
    copy_repo
    mkdir -p "$work/tests" "$work/shim"
    rm -f "$work"/tests/*.test.ts && printf "export {};\n" > "$work/tests/a.test.ts"
    # A runner that claims success but writes no reports (a crashed or misconfigured reporter).
    printf '#!/bin/sh\nexit 0\n' > "$work/shim/tsx" && chmod +x "$work/shim/tsx"
    REPORTS="$work/reports/ci" PATH="$work/shim:$PATH" run bash scripts/ci/test-ci.sh
    check "no JUnit report was published (nothing is reported as passing)" "[ ! -e '$work/reports/ci/junit.xml' ]"
    check "no test summary was published" "[ ! -e '$work/reports/ci/test-summary.json' ]"
    check "the stage said testing did not complete" "grep -q 'TESTING DID NOT COMPLETE' '$dir/run.log'"
    ;;

  production-build)
    mkdir -p "$work/app"
    printf '{"name":"diagnostic-build","private":true,"type":"module"}\n' > "$work/package.json"
    printf "export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang=\"en\"><body>{children}</body></html>;\n}\n" > "$work/app/layout.tsx"
    # DIAGNOSTIC: intentional syntax error (unclosed JSX).
    printf "export default function Page() {\n  return <main><h1>diagnostic</h1>;\n}\n" > "$work/app/page.tsx"
    printf '{"compilerOptions":{"target":"es2022","lib":["dom","esnext"],"jsx":"preserve","module":"esnext","moduleResolution":"bundler","strict":true,"noEmit":true,"incremental":true,"plugins":[{"name":"next"}],"skipLibCheck":true},"include":["**/*.ts","**/*.tsx"]}\n' > "$work/tsconfig.json"
    printf "export default {};\n" > "$work/next.config.mjs"
    ln -s "$root/node_modules" "$work/node_modules"
    NEXT_TELEMETRY_DISABLED=1 run npx next build --webpack
    check "the build output reports a compile failure" "grep -qiE 'Failed to compile|Build failed|Syntax error|Parsing|Expected' '$dir/run.log'"
    check "no production build output was produced" "[ ! -e '$work/.next/BUILD_ID' ]"
    ;;

  *) echo "unknown scenario: $scenario" >&2; exit 64 ;;
esac

echo "scenario=$scenario observed-exit=$(cat "$dir/exit-code" 2>/dev/null || echo none)"
exit 0
