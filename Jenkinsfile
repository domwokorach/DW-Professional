// CI pipeline for DW-Professional (Next.js site + Expo mobile app, npm workspaces).
//
// Jenkins requirements: Multibranch Pipeline job with the GitHub Branch Source plugin and
// a GitHub credential (statuses, PR discovery and API rate limits), the NodeJS plugin with a
// tool named "node-22", JUnit, rsync, xmllint, and Docker on the agent (for the throwaway integration database).
// No secrets are read here. Deployment is handled by Vercel's Git integration; branch protection
// on `master` must require this pipeline's status check so a red build cannot be merged or released.
//
// Design (see README.md, "Continuous integration"):
//   * Persistent caches live OUTSIDE the workspace, under $JENKINS_HOME/ci-cache/<job>/, so cleanWs never removes them:
//     npm download cache, TypeScript incremental build info, Next.js build cache. Metro keeps its own cache in $TMPDIR.
//   * One install, then two lanes in parallel: "Web and mobile" (the CPU- and memory-heavy work, run one stage after
//     another so two bundlers never compete on this 8 GB Mac) and "Data and security" (audit, then the disposable
//     PostgreSQL container, migrations and tests). The lanes never write to the same files or database.
//   * Every multi-command script is fail-fast (`set -euo pipefail`), so a failed migration can never be followed by
//     tests, and a failed typecheck can never be followed by its build.
//   * Every stage has its own timeout; the overall timeout is the sum of the worst cases plus headroom.
//   * Reports are published only when complete and valid; evidence is archived outside the main timeout.

import groovy.json.JsonOutput
import groovy.transform.Field

// Leaf stages in execution order. The failure report uses this list to tell a stage that never ran ("not executed")
// from one that passed, and to separate the original failure from stages skipped because of it.
@Field List<String> LEAF_STAGES = ['Checkout', 'Validate environment', 'Install', 'Web typecheck', 'Next.js build', 'Mobile typecheck',
  'Expo web export', 'Security audit', 'PostgreSQL container', 'Database migrations', 'Automated tests', 'Archive', 'Release manifest']
// What the build really did, recorded as it happens; written to reports/ci/diagnostics/execution.json in `post`.
@Field Map DIAG = [entered: [], failures: []]

@NonCPS
def slugOf(String name) { name.toLowerCase().replaceAll('[^a-z0-9]+', '-') }

@NonCPS
Integer exitCodeOf(String message) {
  def m = (message ?: '') =~ /exit code (\d+)/
  return m.find() ? (m.group(1) as Integer) : null
}

def diagEnter() {
  def stage = env.STAGE_NAME
  if (stage && !DIAG.entered.contains(stage)) { DIAG.entered << stage }
}

// Records a failure for the failure report, then the caller rethrows it: the build result and exit code are never changed.
def diagFail(Throwable err) {
  def stage = env.STAGE_NAME ?: 'unknown'
  def message = err.message ?: err.toString()
  if (DIAG.failures.any { it.stage == stage && it.message == message }) { return }
  DIAG.failures << [stage: stage, slug: slugOf(stage), exitCode: exitCodeOf(message), message: message, ts: System.currentTimeMillis()]
}

def guarded(Closure body) {
  try { body() } catch (err) { diagFail(err); throw err }
}

// Fail-fast bash for multi-command scripts. Jenkins' default `sh -xe` ignores a failure on the left of `&&`.
// The body also runs with its output copied to reports/ci/diagnostics/<stage>.log and the failing command written to
// <stage>.cmd, so a red stage can be explained from evidence. The exit status is the script's own (pipefail).
// Pass [log: false] for a script that deletes the reports directory itself.
def bash(String body, Map opts = [:]) {
  diagEnter()
  def slug = slugOf(env.STAGE_NAME ?: 'unknown')
  def script = body
  if (opts.log != false) {
    script = '''\
mkdir -p "$REPORTS/diagnostics"
{
set -E
trap 'printf "%s" "$BASH_COMMAND" > "$REPORTS/diagnostics/@@SLUG@@.cmd"' ERR
trap 'rc=$?; if [ "$rc" -ne 0 ] && [ ! -s "$REPORTS/diagnostics/@@SLUG@@.cmd" ]; then printf "script exited with status %s" "$rc" > "$REPORTS/diagnostics/@@SLUG@@.cmd"; fi' EXIT
@@BODY@@
} 2>&1 | tee -a "$REPORTS/diagnostics/@@SLUG@@.log"
'''.replace('@@SLUG@@', slug).replace('@@BODY@@', body)
  }
  try {
    sh(script: "#!/usr/bin/env bash\nset -euo pipefail\n${script}")
  } catch (err) {
    diagFail(err)
    throw err
  }
}

// Makes a stage safe to "Restart from stage": the workspace is wiped after every build, so rebuild it if missing.
def ensureWorkspace() {
  diagEnter()
  if (!fileExists('package.json')) { unstash 'source' }
  if (!fileExists('node_modules/.bin/tsc')) { sh 'npm ci --prefer-offline --no-audit' }
}

pipeline {
  agent any

  options {
    timestamps()
    skipDefaultCheckout(true)
    preserveStashes(buildCount: 5)
    // A newer commit on the same branch cancels the running build; cleanup below still runs on cancellation.
    disableConcurrentBuilds(abortPrevious: true)
    // TEMPORARY while install performance is diagnosed: 120 min. Worst case of the stage limits below is ~100 min.
    timeout(time: 120, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '25', artifactNumToKeepStr: '10'))
  }

  tools {
    nodejs 'node-22'
  }

  environment {
    CI = 'true'
    // Appended, never prepended: /usr/local/bin holds an older node that must not shadow the node-22 tool.
    PATH = "${PATH}:/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin"
    EXPO_NO_TELEMETRY = '1'
    NEXT_TELEMETRY_DISABLED = '1'
    NPM_CONFIG_FUND = 'false'
    NPM_CONFIG_UPDATE_NOTIFIER = 'false'
    // Placeholder so Prisma and `next build` can load configuration. No database is contacted by those.
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci'
    REPORTS = 'reports/ci'
    PG_IMAGE = 'postgres:16-alpine'
    // Expo/Metro transform workers: capped for the shared 8 GB host.
    EXPO_MAX_WORKERS = '2'
    // Persistent, per-job caches outside the workspace (survive cleanWs).
    CI_CACHE = "${env.JENKINS_HOME}/ci-cache/${env.JOB_NAME.replaceAll('[^A-Za-z0-9._-]', '_')}"
    NPM_CONFIG_CACHE = "${env.JENKINS_HOME}/ci-cache/${env.JOB_NAME.replaceAll('[^A-Za-z0-9._-]', '_')}/npm"
  }

  stages {
    stage('Checkout') {
      options { timeout(time: 5, unit: 'MINUTES') }
      steps {
        checkout scm
        bash('''
          rm -rf "$REPORTS"
          mkdir -p "$REPORTS" "$CI_CACHE"
          git log -1 --format="%h %s (%an)"
        ''', [log: false])
        // Lets later stages be restarted on a clean workspace.
        stash name: 'source', includes: '**', excludes: 'node_modules/**,**/node_modules/**,.next/**,reports/**,apps/mobile/dist/**,.git/**', useDefaultExcludes: true
      }
    }

    stage('Validate environment') {
      options { timeout(time: 5, unit: 'MINUTES') }
      steps {
        // Fail in seconds, not minutes, when the agent cannot run the quality gates.
        bash '''
          node_major=$(node -p "process.versions.node.split('.')[0]")
          [ "$node_major" -ge 22 ] || { echo "Node.js 22+ required, found $(node -v)"; exit 1; }
          echo "node $(node -v), npm $(npm -v), cpus $(sysctl -n hw.ncpu 2>/dev/null || nproc)"
          test -f package-lock.json || { echo "package-lock.json is required for reproducible installs"; exit 1; }
          command -v rsync >/dev/null || { echo "rsync is required for the build caches"; exit 1; }
          command -v xmllint >/dev/null || { echo "xmllint is required to validate JUnit XML"; exit 1; }
          echo "watchman: $(watchman --version 2>/dev/null || echo 'not found (Metro falls back to a slower crawler)')"
          # Host pressure diagnostics: a starved agent makes every later stage slow (this caused build #18's timeout).
          echo "load: $(uptime | sed 's/.*load averages*: //')"
          echo "swap: $(sysctl -n vm.swapusage 2>/dev/null || echo n/a)"
        '''
        script {
          guarded {
            if (!env.TEST_DATABASE_URL) {
              // Docker connection gate for the disposable PostgreSQL container.
              def ok = sh(returnStatus: true, script: 'command -v docker >/dev/null && docker info >/dev/null 2>&1') == 0
              if (!ok) {
                // Through bash() so the evidence lands in the stage's diagnostic log.
                bash 'echo "PATH=$PATH"; command -v docker || true; docker version 2>&1 | head -20 || true'
                error('Docker is unavailable to Jenkins: cannot create the disposable PostgreSQL container for integration tests.')
              }
              echo 'Docker connection: OK'
              // Cache the database image: pull only when it is not already present locally.
              bash 'docker image inspect "$PG_IMAGE" >/dev/null 2>&1 || docker pull -q "$PG_IMAGE"'
            }
          }
        }
      }
    }

    stage('Install') {
      options { timeout(time: 30, unit: 'MINUTES') }
      steps {
        // One install for the root app and both workspaces (packages/*, apps/*), exactly as locked. The npm download
        // cache is persistent. postinstall generates both Prisma clients, so there is no separate generate stage.
        // The security audit has its own stage, so the install skips it.
        bash '''
          start=$(date +%s)
          echo "##[group]npm ci"
          npm ci --prefer-offline --no-audit
          echo "##[endgroup]"
          echo "npm ci took $(( $(date +%s) - start ))s (cache: $(du -sh "$NPM_CONFIG_CACHE" 2>/dev/null | cut -f1))"
          echo "##[group]Verify Prisma clients"
          test -d node_modules/.prisma/client || test -d node_modules/@prisma/client
          echo "##[endgroup]"
          echo "##[group]Generate stack icons"
          npm run icons
          echo "##[endgroup]"
        '''
      }
    }

    stage('Quality gates') {
      // A failing lane must not hide the other lane's evidence, so the sibling is allowed to finish.
      failFast false
      parallel {
        stage('Web and mobile') {
          stages {
            stage('Web typecheck') {
              options { timeout(time: 8, unit: 'MINUTES') }
              environment { NODE_OPTIONS = '--max-old-space-size=3072' }
              steps {
                script { ensureWorkspace() }
                // Incremental TypeScript: the build-info file persists, and tsc still reports every error.
                bash '''
                  mkdir -p "$CI_CACHE/ts"
                  npm run typecheck -- --incremental --tsBuildInfoFile "$CI_CACHE/ts/web.tsbuildinfo"
                '''
              }
            }

            stage('Next.js build') {
              options { timeout(time: 15, unit: 'MINUTES') }
              environment { NODE_OPTIONS = '--max-old-space-size=3072' }
              steps {
                script { ensureWorkspace() }
                bash '''
                  mkdir -p "$REPORTS" "$CI_CACHE/next" .next/cache
                  rsync -a "$CI_CACHE/next/" .next/cache/
                  du -sh .next/cache 2>/dev/null || true
                  npx next build 2>&1 | tee "$REPORTS/next-build.log"
                  rsync -a --delete .next/cache/ "$CI_CACHE/next/"
                '''
              }
            }

            stage('Mobile typecheck') {
              options { timeout(time: 8, unit: 'MINUTES') }
              environment { NODE_OPTIONS = '--max-old-space-size=2048' }
              steps {
                script { ensureWorkspace() }
                bash '''
                  mkdir -p "$CI_CACHE/ts"
                  npm --prefix apps/mobile run typecheck -- --incremental --tsBuildInfoFile "$CI_CACHE/ts/mobile.tsbuildinfo"
                '''
              }
            }

            stage('Expo web export') {
              options { timeout(time: 15, unit: 'MINUTES') }
              environment { NODE_OPTIONS = '--max-old-space-size=2048' }
              steps {
                script { ensureWorkspace() }
                // Bundles the Expo Router app for web; fails on any Metro resolution or export error. Metro's transform
                // cache persists in $TMPDIR.
                bash '''
                  mkdir -p "$REPORTS"
                  cd apps/mobile
                  node scripts/sync-web-public.mjs
                  npx expo export --platform web --max-workers "$EXPO_MAX_WORKERS" 2>&1 | tee "../../$REPORTS/expo-export.log"
                '''
              }
            }
          }
        }

        stage('Data and security') {
          stages {
            stage('Security audit') {
              options { timeout(time: 5, unit: 'MINUTES') }
              steps {
                script { ensureWorkspace() }
                // One audit run: the JSON report is the evidence, and the exit status enforces the high/critical gate.
                bash '''
                  rc=0
                  npm audit --omit=dev --audit-level=high --json > "$REPORTS/npm-audit.json" || rc=$?
                  node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).metadata?.vulnerabilities; console.log("Vulnerabilities (production deps):", JSON.stringify(m ?? "unavailable"))' "$REPORTS/npm-audit.json" || true
                  exit "$rc"
                '''
              }
            }

            stage('PostgreSQL container') {
              options { timeout(time: 5, unit: 'MINUTES') }
              steps {
                script { ensureWorkspace() }
                script {
                  guarded {
                  if (env.TEST_DATABASE_URL) {
                    echo 'Using the throwaway database supplied by TEST_DATABASE_URL (never production: tests delete rows).'
                  } else {
                    // One isolated container per build: unique name, random loopback-only port, labelled for cleanup,
                    // data in memory (tmpfs) with durability settings relaxed because the data is disposable.
                    def name = "dw-ci-pg-${env.BUILD_TAG}".replaceAll('[^a-zA-Z0-9_.-]', '-')
                    env.PG_CONTAINER = name
                    withEnv(["PG_NAME=${name}"]) {
                      bash '''
                        docker rm -f "$PG_NAME" >/dev/null 2>&1 || true
                        docker run -d --rm --name "$PG_NAME" --label dw-ci-build="$BUILD_TAG" \
                          -e POSTGRES_USER=ci -e POSTGRES_PASSWORD=ci -e POSTGRES_DB=ci \
                          --tmpfs /var/lib/postgresql/data:rw,size=512m -p 127.0.0.1::5432 "$PG_IMAGE" \
                          -c fsync=off -c synchronous_commit=off -c full_page_writes=off >/dev/null
                        # Readiness poll (not a fixed sleep): returns as soon as the server accepts connections.
                        ready=0
                        for _ in $(seq 1 240); do
                          if docker exec "$PG_NAME" pg_isready -U ci -d ci >/dev/null 2>&1; then ready=1; break; fi
                          sleep 0.5
                        done
                        [ "$ready" = 1 ] || { echo "PostgreSQL did not become ready in 120s"; docker logs "$PG_NAME" | tail -20; exit 1; }
                        echo "PostgreSQL ready: $PG_NAME"
                      '''
                    }
                    def port = sh(returnStdout: true, script: "docker port '${name}' 5432/tcp | head -1 | sed 's/.*://'").trim()
                    if (!port) { error('Could not discover the dynamically allocated PostgreSQL port.') }
                    env.TEST_DATABASE_URL = "postgresql://ci:ci@127.0.0.1:${port}/ci"
                    echo "Disposable database on 127.0.0.1:${port}"
                  }
                  }
                }
              }
            }

            stage('Database migrations') {
              options { timeout(time: 8, unit: 'MINUTES') }
              steps {
                script { ensureWorkspace() }
                // db-env.sh points every database variable at the disposable database (production values cannot win).
                // Fail-fast: a failed or interrupted migration stops the lane before any test starts.
                bash '''
                  . scripts/ci/db-env.sh
                  npm run db:deploy
                  npm run companies:migrate
                '''
              }
            }

            stage('Automated tests') {
              options { timeout(time: 15, unit: 'MINUTES') }
              environment { REQUIRE_NO_SKIPPED = '1' }
              steps {
                script { ensureWorkspace() }
                // Tests share one database, so they run serially. test-ci.sh publishes JUnit/LCOV only when complete.
                bash '''
                  . scripts/ci/db-env.sh
                  npm run test:ci
                '''
                // Mandatory reporting: coverage must be measurable, never assumed.
                // Set COVERAGE_MIN_LINES (0-100) on the job to also enforce a line-coverage threshold; unset = measure only.
                bash 'node scripts/ci/reports.mjs coverage "$REPORTS/lcov.info" "$REPORTS/coverage-summary.txt" ${COVERAGE_MIN_LINES:+--min-lines "$COVERAGE_MIN_LINES"}'
              }
              post {
                always {
                  script {
                    // Published even when tests fail. Never published when missing or invalid: test-ci.sh withholds
                    // the file in that case, and the stage has already failed with "TESTING DID NOT COMPLETE".
                    if (fileExists('reports/ci/junit.xml')) {
                      junit testResults: 'reports/ci/junit.xml', allowEmptyResults: false
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    stage('Archive') {
      options { timeout(time: 5, unit: 'MINUTES') }
      steps {
        script { ensureWorkspace() }
        bash '''
          tar --exclude=.next/cache -czf "$REPORTS/next-build.tgz" .next
          tar -czf "$REPORTS/mobile-web-dist.tgz" -C apps/mobile dist
        '''
      }
    }

    stage('Release manifest') {
      // Only a fully green build of master produces a release manifest. Earlier failures skip this stage.
      when {
        allOf {
          branch 'master'
          not { changeRequest() }
          expression { currentBuild.currentResult == 'SUCCESS' }
        }
      }
      steps {
        bash '''
          printf '{"commit":"%s","build":"%s","url":"%s"}\\n' "${GIT_COMMIT:-$(git rev-parse HEAD)}" "$BUILD_NUMBER" "$BUILD_URL" > "$REPORTS/release-manifest.json"
        '''
      }
    }
  }

  post {
    success { echo 'All quality gates passed.' }
    unstable { echo 'Build is UNSTABLE: not releasable until resolved.' }
    failure { echo 'A quality gate failed: not releasable.' }
    aborted { echo 'Build was cancelled or timed out.' }
    always {
      // Bounded, separate timeouts so evidence and cleanup still run after the main work is cancelled or times out.
      timeout(time: 3, unit: 'MINUTES') {
        // Safety net for success, failure, timeout and cancellation: remove any test container labelled with this build.
        sh 'docker ps -aq --filter "label=dw-ci-build=$BUILD_TAG" 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1 || true'
      }
      timeout(time: 5, unit: 'MINUTES') {
        script {
          // Non-secret execution summary. Incomplete or invalid reports are under reports/ci/diagnostics/ or
          // reports/ci/incomplete-test-run/, separate from the verified reports in the reports/ci root.
          sh 'mkdir -p "$REPORTS/diagnostics"'
          // Failure report: original failure vs stages never executed, from what the build recorded. Describes the result;
          // it never changes it, and a problem in this tool is reported but does not alter the build outcome.
          writeFile file: "${env.REPORTS}/diagnostics/execution.json", text: JsonOutput.prettyPrint(JsonOutput.toJson([stages: LEAF_STAGES, entered: DIAG.entered, failures: DIAG.failures]))
          if (fileExists('scripts/ci/diagnose.mjs')) {
            def rc = withEnv(["BUILD_RESULT=${currentBuild.currentResult}"]) { sh(returnStatus: true, script: 'node scripts/ci/diagnose.mjs report') }
            if (rc != 0) { echo "WARNING: scripts/ci/diagnose.mjs exited ${rc}; the failure report may be missing. The build result is unchanged." }
          }
          def read = { String f -> fileExists(f) ? readFile(f).trim() : 'not produced' }
          def failureLine = read("${env.REPORTS}/failure-summary.txt")
          if (currentBuild.currentResult != 'SUCCESS' && failureLine && failureLine != 'not produced') { currentBuild.description = failureLine }
          writeFile file: "${env.REPORTS}/build-summary.txt", text: """\
            job:        ${env.JOB_NAME}
            build:      #${env.BUILD_NUMBER}
            commit:     ${env.GIT_COMMIT ?: 'n/a'}
            result:     ${currentBuild.currentResult}
            duration:   ${currentBuild.durationString.replace(' and counting', '')}
            tests:      ${read("${env.REPORTS}/test-summary.json")}
            coverage:   ${read("${env.REPORTS}/coverage-summary.txt").replace('\n', ' | ')}
            failure:    ${failureLine}
            """.stripIndent()
          // Reports are kept for failed and unstable builds too; they are the evidence for diagnosing a red build.
          archiveArtifacts artifacts: 'reports/ci/**', fingerprint: true, allowEmptyArchive: true
        }
      }
    }
    cleanup {
      // Runs last, after archiving. The persistent caches are outside the workspace, so they are kept.
      // A cleanup problem must not change the build result.
      timeout(time: 5, unit: 'MINUTES') {
        cleanWs(deleteDirs: true, notFailBuild: true)
      }
    }
  }
}
