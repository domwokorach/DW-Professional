// CI pipeline for DW-Professional. Deployment stays with Vercel (Git integration).
// Requires a Jenkins agent with Node.js 22+ (NodeJS plugin tool named "node-22", or Docker).
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds(abortPrevious: true)
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  tools {
    nodejs 'node-22'
  }

  environment {
    CI = 'true'
    NEXT_TELEMETRY_DISABLED = '1'
    // Placeholder so `prisma generate` / `next build` can load config; no database is contacted.
    DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci'
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Typecheck') {
      steps {
        sh 'npm run typecheck'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
  }

  post {
    cleanup {
      cleanWs()
    }
  }
}