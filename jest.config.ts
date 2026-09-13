import type { Config } from 'jest';
import path from 'path';

const rootDir = process.cwd();

const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@emails/(.*)$': '<rootDir>/emails/$1',
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  '\\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)$':
    '<rootDir>/test/mocks/fileMock.ts',
};

const jsdomModuleNameMapper = {
  '^next/navigation$': '<rootDir>/test/mocks/next-navigation.tsx',
  '^@/i18n/LocaleProvider$': '<rootDir>/test/mocks/LocaleProvider.tsx',
  '^sonner$': '<rootDir>/test/mocks/sonner.tsx',
  ...moduleNameMapper,
};

const transform = {
  '^.+\\.(t|j)sx?$': [
    'babel-jest',
    { configFile: path.resolve(rootDir, 'babel.config.jest.cjs') },
  ],
};

const transformIgnorePatterns = ['/node_modules/(?!(?:jose|uuid)/)'];

// `clearMocks`/`restoreMocks` at the top level are informational only once
// `projects` is set — Jest does NOT propagate them into each project's own
// config (confirmed via `--showConfig`), so they're repeated explicitly
// inside every project below. Without this, jest.mock()'d call history
// (e.g. the mailer mock) leaks across tests within the same file.
const config: Config = {
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  coverageReporters: ['text', 'html', 'lcov'],
  // Scoped to the admin-chat/auth/socket system this suite actually covers —
  // the wider src/ tree also holds the unrelated public portfolio site
  // (weather widget, gallery, resume flow, i18n, portfolioAssistant, etc.),
  // which was never in scope here and would otherwise sink the global
  // thresholds below to numbers that don't mean anything for this feature.
  collectCoverageFrom: [
    'src/lib/auth/**/*.{ts,tsx}',
    'src/lib/chat/**/*.{ts,tsx}',
    'src/lib/socket/**/*.{ts,tsx}',
    'src/lib/liveChatAuth.ts',
    'src/lib/database/**/*.{ts,tsx}',
    'src/app/api/auth/**/*.{ts,tsx}',
    'src/app/api/admin/**/*.{ts,tsx}',
    'src/app/api/chat/**/*.{ts,tsx}',
    'src/components/auth/**/*.{ts,tsx}',
    'src/components/admin/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    // The internal HR/payroll AI search assistant — a separate portfolio
    // feature that happens to live under src/app/api/chat/, not part of the
    // admin live-chat system this suite covers.
    '!src/app/api/chat/route.ts',
    // An alternate/legacy admin chat UI not linked from AdminShell's nav
    // (which points at /admin/chat → components/chat/AdminChat.tsx instead) —
    // out of scope for this pass; flagged to the team building it.
    '!src/components/admin/live-chat/**',
    // Type-only declarations, no runtime code to exercise.
    '!src/lib/socket/types.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    'src/lib/auth/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    'src/lib/chat/permissions.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      clearMocks: true,
      restoreMocks: true,
      moduleNameMapper,
      transform,
      transformIgnorePatterns,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.node.ts'],
      testMatch: [
        '<rootDir>/__tests__/api/**/*.test.{ts,tsx}',
        '<rootDir>/__tests__/auth/**/*.test.{ts,tsx}',
        '<rootDir>/__tests__/chat/**/*.test.{ts,tsx}',
        '<rootDir>/__tests__/socket/**/*.test.{ts,tsx}',
        '<rootDir>/__tests__/security/**/*.test.{ts,tsx}',
        '<rootDir>/__tests__/utils/**/*.test.{ts,tsx}',
        '<rootDir>/src/**/*.test.{ts,tsx}',
      ],
      testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/components/'],
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      clearMocks: true,
      restoreMocks: true,
      moduleNameMapper: jsdomModuleNameMapper,
      transform,
      transformIgnorePatterns,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      testMatch: ['<rootDir>/__tests__/components/**/*.test.{ts,tsx}'],
    },
  ],
};

export default config;
