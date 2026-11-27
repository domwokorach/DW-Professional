// CI pipeline for DW-Professional (Next.js site + Expo mobile app, npm workspaces).
//
// Jenkins requirements: Multibranch Pipeline job with the GitHub Branch Source plugin and
// a GitHub credential (statuses, PR discovery and API rate limits), the NodeJS plugin with a
// tool named "node-22", JUnit, and Docker on the agent (for the throwaway integration database).
// No secrets are read here. Deployment is handled by Vercel's Git integration; branch protection
// on `master` must require this pipeline's status check so a red build cannot be merged or released.
pipeline {
  agent any

  options {
    timestamps()
    skipDefaultCheckout(true)
    disableConcurrentBuilds(abortPrevious: true)
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '25', artifactNumToKeepStr: '10'))
  }

  tools {
    nodejs 'node-22'
  }

  environment {
    CI = 'true'
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
        sh 'mkdir -p "$REPORTS" && git log -1 --format="%h %s (%an)"'
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
        sh 'npm ci'
      }
    }

    stage('Prisma generate') {
      steps {
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
        // Report everything, then gate on high and critical vulnerabilities in production dependencies.
        sh 'npm audit --omit=dev --json > "$REPORTS/npm-audit.json" || true'
        sh 'npm audit --omit=dev --audit-level=high'
      }
    }

    stage('Test') {
      steps {
        script {
          def hasDocker = sh(returnStatus: true, script: 'docker info >/dev/null 2>&1') == 0
          if (env.TEST_DATABASE_URL) {
            // A throwaway database supplied by the Jenkins environment (never production: tests delete rows).
            withEnv(["DATABASE_URL=${env.TEST_DATABASE_URL}", "COMPANY_DATABASE_URL=${env.TEST_DATABASE_URL}"]) {
              sh 'npm run db:deploy && npm run companies:migrate'
              sh 'npm run test:ci'
            }
          } else if (!hasDocker) {
            unstable('Docker is unavailable: database integration tests were skipped.')
            sh 'npm run test:ci'
          } else {
            def name = "dw-ci-pg-${env.BUILD_TAG}".replaceAll('[^a-zA-Z0-9_.-]', '-')
            env.PG_CONTAINER = name
            sh """
              docker rm -f '${name}' >/dev/null 2>&1 || true
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
              sh 'npm run db:deploy && npm run companies:migrate'
              sh 'npm run test:ci'
            }
          }
        }
      }
      post {
        always {
          // Published even when tests fail; a missing or empty report is itself an error.
          junit testResults: 'reports/ci/junit.xml', allowEmptyResults: false
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
        sh 'npm run build'
      }
    }

    stage('Validate mobile') {
      steps {
        // Bundles the Expo Router app for web; fails on any Metro resolution or export error.
        sh 'npm --prefix apps/mobile run export:web'
      }
    }

    stage('Archive') {
      steps {
        sh '''
          tar --exclude=.next/cache -czf "$REPORTS/next-build.tgz" .next
          tar -czf "$REPORTS/mobile-web-dist.tgz" -C apps/mobile dist
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
          printf '{"commit":"%s","build":"%s","url":"%s"}\\n' "$(git rev-parse HEAD)" "$BUILD_NUMBER" "$BUILD_URL" > "$REPORTS/release-manifest.json"
        '''
        archiveArtifacts artifacts: 'reports/ci/release-manifest.json', fingerprint: true
      }
    }
  }

  post {
    success { echo 'All quality gates passed.' }
    unstable { echo 'Build is UNSTABLE: not releasable until resolved.' }
    failure { echo 'A quality gate failed: not releasable.' }
    cleanup { cleanWs() }
  }
}
