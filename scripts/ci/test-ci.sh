#!/usr/bin/env bash
# Runs the full test suite and publishes reports/ci/{junit.xml,lcov.info} atomically:
#   * reporters write into reports/ci/incomplete-test-run/ first;
#   * only a complete, validated JUnit file (and a non-empty LCOV file) is moved into place;
#   * an interrupted or corrupt run leaves NO junit.xml; the raw output is kept under reports/ci/diagnostics/.
# The exit status is the test runner's own (0 pass, 1 failing tests), or non-zero when testing did not complete.
set -euo pipefail

OUT="${REPORTS:-reports/ci}"
PENDING="$OUT/incomplete-test-run"
DIAG="$OUT/diagnostics"
rm -rf "$PENDING"
rm -f "$OUT/junit.xml" "$OUT/lcov.info" "$OUT/test-summary.json"
mkdir -p "$PENDING" "$DIAG"

rc=0
tsx --test --test-concurrency=1 --experimental-test-coverage \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=junit --test-reporter-destination="$PENDING/junit.xml" \
  --test-reporter=lcov --test-reporter-destination="$PENDING/lcov.info" \
  tests/*.test.ts || rc=$?

quarantine() {
  for f in junit.xml lcov.info; do [ -f "$PENDING/$f" ] && mv "$PENDING/$f" "$DIAG/raw-$f" || true; done
  rmdir "$PENDING" 2>/dev/null || true
}

if [ "$rc" -gt 1 ]; then
  quarantine
  echo "TESTING DID NOT COMPLETE: the test runner exited with status $rc (interrupted, timed out or crashed). Raw output kept in $DIAG." >&2
  exit "$rc"
fi

if ! node scripts/ci/reports.mjs junit "$PENDING/junit.xml" > "$OUT/test-summary.json.tmp"; then
  rm -f "$OUT/test-summary.json.tmp"
  quarantine
  echo "TESTING DID NOT COMPLETE: no valid JUnit report was produced. Raw output kept in $DIAG." >&2
  exit 70
fi

mv "$PENDING/junit.xml" "$OUT/junit.xml"
mv "$OUT/test-summary.json.tmp" "$OUT/test-summary.json"
if [ -s "$PENDING/lcov.info" ]; then mv "$PENDING/lcov.info" "$OUT/lcov.info"; else rm -f "$PENDING/lcov.info"; fi
rmdir "$PENDING" 2>/dev/null || true
echo "JUnit report published: $(cat "$OUT/test-summary.json")"

# Jenkins sets this: the database integration tests must really run, so a skipped test is a failure.
if [ "$rc" -eq 0 ] && [ "${REQUIRE_NO_SKIPPED:-}" = 1 ]; then
  skipped=$(node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).skipped' "$OUT/test-summary.json")
  if [ "$skipped" -gt 0 ]; then echo "$skipped skipped test(s): integration tests did not all run" >&2; exit 65; fi
fi
exit "$rc"
