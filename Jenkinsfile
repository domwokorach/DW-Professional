// CI pipeline for DW-Professional (Next.js site + Expo mobile app, npm workspaces).
//
// Jenkins requirements: Multibranch Pipeline job with the GitHub Branch Source plugin and
// a GitHub credential (statuses, PR discovery and API rate limits), the NodeJS plugin with a
// tool named "node-22", JUnit, rsync, and Docker on the agent (for the throwaway integration database).
// No secrets are read here. Deployment is handled by Vercel's Git integration; branch protection
// on `master` must require this pipeline's status check so a red build cannot be merged or released.
//
// Performance design (see README.md, "Continuous integration"):
//   * Persistent caches live OUTSIDE the workspace, under $JENKINS_HOME/ci-cache/<job>/, so cleanWs never removes them:
//     npm download cache, TypeScript incremental build info, Next.js build cache. Metro keeps its own cache in $TMPDIR.
//   * After one install, four independent lanes run in parallel: web (typecheck then build), mobile (typecheck then
//     export), database tests, and the security audit. Lanes never write to the same files or database.
//   * Jenkins on macOS runs under launchd with a minimal PATH; the pipeline-level PATH adds Docker (/usr/local/bin),
//     Homebrew (watchman for Metro) and Docker Desktop's credential helpers.

// Makes a stage safe to "Restart from stage": the workspace is wiped after every build, so rebuild it if missing.
def ensureWorkspace() {
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
    timeout(time: 60, unit: 'MINUTES')
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
    // Placeholder so Prisma and `next build` can load configuration. No database is contacted.
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci'
    REPORTS = 'reports/ci'
    PG_IMAGE = 'postgres:16-alpine'
    // Persistent, per-job caches outside the workspace (survive cleanWs).
    CI_CACHE = "${env.JENKINS_HOME}/ci-cache/${env.JOB_NAME.replaceAll('[^A-Za-z0-9._-]', '_')}"
    NPM_CONFIG_CACHE = "${env.JENKINS_HOME}/ci-cache/${env.JOB_NAME.replaceAll('[^A-Za-z0-9._-]', '_')}/npm"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'rm -rf "$REPORTS" && mkdir -p "$REPORTS" "$CI_CACHE" && git log -1 --format="%h %s (%an)"'
        // Lets later stages be restarted on a clean workspace.
        stash name: 'source', includes: '**', excludes: 'node_modules/**,**/node_modules/**,.next/**,reports/**,apps/mobile/dist/**,.git/**', useDefaultExcludes: true
      }
    }

    stage('Validate environment') {
      steps {
        // Fail in seconds, not minutes, when the agent cannot run the quality gates.
        sh '''
          set -eu
          node_major=$(node -p "process.versions.node.split('.')[0]")
          [ "$node_major" -ge 22 ] || { echo "Node.js 22+ required, found $(node -v)"; exit 1; }
          echo "node $(node -v), npm $(npm -v), cpus $(sysctl -n hw.ncpu 2>/dev/null || nproc)"
          test -f package-lock.json || { echo "package-lock.json is required for reproducible installs"; exit 1; }
          command -v rsync >/dev/null || { echo "rsync is required for the build caches"; exit 1; }
          echo "watchman: $(watchman --version 2>/dev/null || echo 'not found (Metro falls back to a slower crawler)')"
        '''
        script {
          if (!env.TEST_DATABASE_URL) {
            // Docker connection gate for the disposable PostgreSQL container.
            def ok = sh(returnStatus: true, script: 'command -v docker >/dev/null && docker info >/dev/null 2>&1') == 0
            if (!ok) {
              sh 'echo "PATH=$PATH"; command -v docker || true; docker version 2>&1 | head -20 || true'
              error('Docker is unavailable to Jenkins: cannot create the disposable PostgreSQL container for integration tests.')
            }
            // Cache the database image: pull only when it is not already present locally.
            sh 'docker image inspect "$PG_IMAGE" >/dev/null 2>&1 || docker pull -q "$PG_IMAGE"'
          }
        }
      }
    }

    stage('Install') {
      steps {
        // One install for the root app and both workspaces (packages/*, apps/*), exactly as locked. The npm download
        // cache is persistent. postinstall also generates both Prisma clients, so there is no separate generate stage.
        // The security audit runs in its own lane, so the install skips it.
        sh '''
          echo "##[group]npm ci"
          npm ci --prefer-offline --no-audit
          echo "##[endgroup]"
          echo "##[group]Generate stack icons"
          npm run icons
          echo "##[endgroup]"
        '''
      }
    }

    stage('Quality gates') {
      parallel {
        stage('Web: typecheck and build') {
          options { timeout(time: 25, unit: 'MINUTES') }
          environment { NODE_OPTIONS = '--max-old-space-size=3072' }
          steps {
            script { ensureWorkspace() }
            // Incremental TypeScript: the build-info file persists, and tsc still reports every error.
            sh '''
              echo "##[group]Typecheck (web)"
              mkdir -p "$CI_CACHE/ts"
              npm run typecheck -- --incremental --tsBuildInfoFile "$CI_CACHE/ts/web.tsbuildinfo"
              echo "##[endgroup]"
              echo "##[group]Restore Next.js build cache"
              mkdir -p "$CI_CACHE/next" .next/cache
              rsync -a "$CI_CACHE/next/" .next/cache/
              du -sh .next/cache 2>/dev/null || true
              echo "##[endgroup]"
              echo "##[group]next build"
              npx next build
              echo "##[endgroup]"
              echo "##[group]Save Next.js build cache"
              rsync -a --delete .next/cache/ "$CI_CACHE/next/"
              echo "##[endgroup]"
            '''
          }
        }

        stage('Mobile: typecheck and export') {
          options { timeout(time: 20, unit: 'MINUTES') }
          environment { NODE_OPTIONS = '--max-old-space-size=2048' }
          steps {
            script { ensureWorkspace() }
            // Bundles the Expo Router app for web; fails on any Metro resolution or export error. Metro's transform
            // cache persists in $TMPDIR; workers are capped so the parallel lanes do not starve each other.
            sh '''
              echo "##[group]Typecheck (mobile)"
              mkdir -p "$CI_CACHE/ts"
              npm --prefix apps/mobile run typecheck -- --incremental --tsBuildInfoFile "$CI_CACHE/ts/mobile.tsbuildinfo"
              echo "##[endgroup]"
              echo "##[group]expo export (web)"
              cd apps/mobile
              node scripts/sync-web-public.mjs
              npx expo export --platform web --max-workers 3
              echo "##[endgroup]"
            '''
          }
        }

        stage('Database tests') {
          options { timeout(time: 20, unit: 'MINUTES') }
          steps {
            script {
              ensureWorkspace()
              if (env.TEST_DATABASE_URL) {
                // A throwaway database supplied by the Jenkins environment (never production: tests delete rows).
                withEnv(["DATABASE_URL=${env.TEST_DATABASE_URL}", "COMPANY_DATABASE_URL=${env.TEST_DATABASE_URL}"]) {
                  sh '''
                    echo "##[group]Database migrations"
                    npm run db:deploy && npm run companies:migrate
                    echo "##[endgroup]"
                    echo "##[group]Tests"
                    npm run test:ci
                    echo "##[endgroup]"
                  '''
                }
              } else {
                // One isolated container per build: unique name, random loopback-only port, labelled for cleanup,
                // data in memory (tmpfs) with durability settings relaxed because the data is disposable.
                def name = "dw-ci-pg-${env.BUILD_TAG}".replaceAll('[^a-zA-Z0-9_.-]', '-')
                env.PG_CONTAINER = name
                sh """
                  echo "##[group]Start PostgreSQL container"
                  docker rm -f '${name}' >/dev/null 2>&1 || true
                  docker run -d --rm --name '${name}' --label dw-ci-build='${env.BUILD_TAG}' \\
                    -e POSTGRES_USER=ci -e POSTGRES_PASSWORD=ci -e POSTGRES_DB=ci \\
                    --tmpfs /var/lib/postgresql/data:rw,size=512m -p 127.0.0.1::5432 "\$PG_IMAGE" \\
                    -c fsync=off -c synchronous_commit=off -c full_page_writes=off >/dev/null
                  # Readiness poll (not a fixed sleep): returns as soon as the server accepts connections.
                  ready=0
                  for i in \$(seq 1 120); do
                    if docker exec '${name}' pg_isready -U ci -d ci >/dev/null 2>&1; then ready=1; break; fi
                    sleep 0.5
                  done
                  [ "\$ready" = 1 ] || { echo 'PostgreSQL did not become ready in 60s'; docker logs '${name}' | tail -20; exit 1; }
                  echo "##[endgroup]"
                """
                def port = sh(returnStdout: true, script: "docker port '${name}' 5432/tcp | head -1 | sed 's/.*://'").trim()
                withEnv([
                  "TEST_DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
                  "DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
                  "COMPANY_DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
                ]) {
                  // Tests share one database, so they run serially (--test-concurrency=1 in test:ci).
                  sh '''
                    echo "##[group]Database migrations"
                    npm run db:deploy && npm run companies:migrate
                    echo "##[endgroup]"
                    echo "##[group]Tests"
                    npm run test:ci
                    echo "##[endgroup]"
                  '''
                }
              }
            }
          }
          post {
            always {
              // Published even when tests fail; a missing or empty report is itself an error.
              junit testResults: 'reports/ci/junit.xml', allowEmptyResults: false
              // Mandatory gate: database integration tests must have actually run, not been skipped.
              sh '''
                if grep -Eq 'skipped="[1-9]' "$REPORTS/junit.xml"; then echo "Skipped tests detected: integration tests did not all run"; exit 1; fi
              '''
              sh '''
                [ -f "$REPORTS/lcov.info" ] && awk -F: '/^LF:/{lf+=$2}/^LH:/{lh+=$2}END{printf "Line coverage: %.2f%% (%d/%d)\\n",100*lh/lf,lh,lf}' "$REPORTS/lcov.info" | tee "$REPORTS/coverage-summary.txt" || true
              '''
              script {
                if (env.PG_CONTAINER) { sh "docker rm -f '${env.PG_CONTAINER}' >/dev/null 2>&1 || true" }
              }
            }
          }
        }

        stage('Security audit') {
          options { timeout(time: 5, unit: 'MINUTES') }
          steps {
            script { ensureWorkspace() }
            // Report everything, then gate on high and critical vulnerabilities in production dependencies.
            sh 'npm audit --omit=dev --json > "$REPORTS/npm-audit.json" || true'
            sh 'npm audit --omit=dev --audit-level=high'
          }
        }
      }
    }

    stage('Archive') {
      steps {
        script { ensureWorkspace() }
        sh '''
          echo "##[group]Package build outputs"
          tar --exclude=.next/cache -czf "$REPORTS/next-build.tgz" .next
          tar -czf "$REPORTS/mobile-web-dist.tgz" -C apps/mobile dist
          echo "##[endgroup]"
        '''
        archiveArtifacts artifacts: 'reports/ci/**', fingerprint: true, allowEmptyArchive: false
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
        sh '''
          printf '{"commit":"%s","build":"%s","url":"%s"}\\n' "${GIT_COMMIT:-$(git rev-parse HEAD)}" "$BUILD_NUMBER" "$BUILD_URL" > "$REPORTS/release-manifest.json"
        '''
        archiveArtifacts artifacts: 'reports/ci/release-manifest.json', fingerprint: true
      }
    }
  }

  post {
    success { echo 'All quality gates passed.' }
    unstable { echo 'Build is UNSTABLE: not releasable until resolved.' }
    failure { echo 'A quality gate failed: not releasable.' }
    aborted { echo 'Build was cancelled or timed out.' }
    always {
      // Reports are kept for failed and unstable builds too; they are the evidence for diagnosing a red build.
      archiveArtifacts artifacts: 'reports/ci/**', allowEmptyArchive: true
      // Safety net for success, failure, timeout and cancellation: remove any test container labelled with this build.
      sh 'docker ps -aq --filter "label=dw-ci-build=$BUILD_TAG" 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1 || true'
    }
    cleanup {
      // Runs last, after archiving. The persistent caches are outside the workspace, so they are kept.
      // A cleanup problem must not change the build result.
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
