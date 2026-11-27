// CI pipeline for DW-Professional (Next.js site + Expo mobile app, npm workspaces).
//
// Jenkins requirements: Multibranch Pipeline job with the GitHub Branch Source plugin and
// a GitHub credential (statuses, PR discovery and API rate limits), the NodeJS plugin with a
// tool named "node-22", JUnit, and Docker on the agent (for the throwaway integration database).
// No secrets are read here. Deployment is handled by Vercel's Git integration; branch protection
// on `master` must require this pipeline's status check so a red build cannot be merged or released.
// Jenkins on macOS runs under launchd with a minimal PATH; the pipeline-level PATH below adds Docker (/usr/local/bin),
// Homebrew (watchman for Metro) and Docker Desktop's credential helpers.

// Makes a stage safe to "Restart from stage": the workspace is wiped after every build, so rebuild it if missing.
def ensureWorkspace() {
  if (!fileExists('package.json')) { unstash 'source' }
  if (!fileExists('node_modules/.bin/tsc')) { sh 'npm ci' }
}

pipeline {
  agent any

  options {
    timestamps()
    skipDefaultCheckout(true)
    preserveStashes(buildCount: 5)
    disableConcurrentBuilds(abortPrevious: true)
    timeout(time: 90, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '25', artifactNumToKeepStr: '10'))
  }

  tools {
    nodejs 'node-22'
  }

  environment {
    CI = 'true'
    PATH = "/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:${PATH}"
    EXPO_NO_TELEMETRY = '1'
    NEXT_TELEMETRY_DISABLED = '1'
    NPM_CONFIG_FUND = 'false'
    NPM_CONFIG_UPDATE_NOTIFIER = 'false'
    // Placeholder so Prisma and `next build` can load configuration. No database is contacted.
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci'
    REPORTS = 'reports/ci'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'rm -rf "$REPORTS" && mkdir -p "$REPORTS" && git log -1 --format="%h %s (%an)"'
        // Lets later stages be restarted on a clean workspace.
        stash name: 'source', includes: '**', excludes: 'node_modules/**,**/node_modules/**,.next/**,reports/**,apps/mobile/dist/**,.git/**', useDefaultExcludes: true
      }
    }

    stage('Validate environment') {
      steps {
        sh '''
          set -eu
          node_major=$(node -p "process.versions.node.split('.')[0]")
          [ "$node_major" -ge 22 ] || { echo "Node.js 22+ required, found $(node -v)"; exit 1; }
          echo "node $(node -v), npm $(npm -v)"
          test -f package-lock.json || { echo "package-lock.json is required for reproducible installs"; exit 1; }
        '''
      }
    }

    stage('Install') {
      steps {
        // Installs the root app and both workspaces (packages/*, apps/*) exactly as locked.
        // postinstall also generates both Prisma clients.
        sh '''
          echo "##[group]npm ci"
          npm ci
          echo "##[endgroup]"
        '''
      }
    }

    stage('Prisma generate') {
      steps {
        script { ensureWorkspace() }
        sh 'npm run db:generate && npm run companies:generate'
      }
    }

    stage('Typecheck') {
      parallel {
        stage('Web') {
          steps { sh 'npm run typecheck' }
        }
        stage('Mobile') {
          steps { sh 'npm --prefix apps/mobile run typecheck' }
        }
      }
    }

    stage('Security audit') {
      steps {
        script { ensureWorkspace() }
        // Report everything, then gate on high and critical vulnerabilities in production dependencies.
        sh 'npm audit --omit=dev --json > "$REPORTS/npm-audit.json" || true'
        sh 'npm audit --omit=dev --audit-level=high'
      }
    }

    stage('Test') {
      steps {
        script {
          ensureWorkspace()
          def hasDocker = sh(returnStatus: true, script: 'command -v docker >/dev/null && docker info >/dev/null 2>&1') == 0
          if (env.TEST_DATABASE_URL) {
            // A throwaway database supplied by the Jenkins environment (never production: tests delete rows).
            withEnv(["DATABASE_URL=${env.TEST_DATABASE_URL}", "COMPANY_DATABASE_URL=${env.TEST_DATABASE_URL}"]) {
              sh '''
                echo "##[group]Database migrations"
                npm run db:deploy && npm run companies:migrate
                echo "##[endgroup]"
              '''
              sh '''
                echo "##[group]Tests"
                npm run test:ci
                echo "##[endgroup]"
              '''
            }
          } else if (!hasDocker) {
            // Database integration tests are a mandatory gate: never skip them or mark the build green without them.
            sh 'echo "PATH=$PATH"; command -v docker || true; docker version 2>&1 | head -20 || true'
            error('Docker is unavailable to Jenkins: cannot create the disposable PostgreSQL container for integration tests.')
          } else {
            def name = "dw-ci-pg-${env.BUILD_TAG}".replaceAll('[^a-zA-Z0-9_.-]', '-')
            env.PG_CONTAINER = name
            sh """
              docker rm -f '${name}' >/dev/null 2>&1 || true
              docker image inspect postgres:16-alpine >/dev/null 2>&1 || docker pull -q postgres:16-alpine
              docker run -d --rm --name '${name}' -e POSTGRES_USER=ci -e POSTGRES_PASSWORD=ci -e POSTGRES_DB=ci \\
                -p 127.0.0.1::5432 postgres:16-alpine >/dev/null
              for i in \$(seq 1 30); do docker exec '${name}' pg_isready -U ci -d ci >/dev/null 2>&1 && break; sleep 2; done
              docker exec '${name}' pg_isready -U ci -d ci
            """
            def port = sh(returnStdout: true, script: "docker port '${name}' 5432/tcp | head -1 | sed 's/.*://'").trim()
            withEnv([
              "TEST_DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
              "DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
              "COMPANY_DATABASE_URL=postgresql://ci:ci@127.0.0.1:${port}/ci",
            ]) {
              sh '''
                echo "##[group]Database migrations"
                npm run db:deploy && npm run companies:migrate
                echo "##[endgroup]"
              '''
              sh '''
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

    stage('Build web') {
      steps {
        script { ensureWorkspace() }
        sh '''
          echo "##[group]next build"
          npm run build
          echo "##[endgroup]"
        '''
      }
    }

    stage('Validate mobile') {
      // Fail fast instead of consuming the whole 45 minute pipeline budget if Metro stalls.
      options { timeout(time: 20, unit: 'MINUTES') }
      steps {
        script { ensureWorkspace() }
        // Bundles the Expo Router app for web; fails on any Metro resolution or export error.
        sh 'npm --prefix apps/mobile run export:web'
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
    always {
      // Reports are kept for failed and unstable builds too; they are the evidence for diagnosing a red build.
      archiveArtifacts artifacts: 'reports/ci/**', allowEmptyArchive: true
    }
    cleanup {
      // Runs last, after archiving and the test container cleanup. A cleanup problem must not change the build result.
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
