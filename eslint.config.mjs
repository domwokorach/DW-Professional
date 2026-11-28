// ESLint 9 flat config. Linted with the ESLint CLI (`npm run lint`), not the removed `next lint`.
// eslint-config-next already bundles React, React Hooks, jsx-a11y and import rules.
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    '.next*/**',
    'node_modules/**',
    'generated/**',
    'coverage/**',
    'reports/**',
    'playwright-report/**',
    'test-results/**',
    'apps/**',
    'packages/*/dist/**',
    'public/**',
    'next-env.d.ts',
  ]),
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', prefer: 'type-imports', disallowTypeAnnotations: false }],
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
    },
  },
  {
    // React Compiler advisory rules (new in eslint-plugin-react-hooks 7). They flag legitimate
    // mount-time setState, ref reads and animation code across the existing design. Kept visible as
    // warnings and burned down incrementally (see docs/TESTING.md > Lint baseline); real
    // correctness rules (rules-of-hooks, exhaustive-deps) stay errors or warnings as shipped.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
  {
    // Vendored shadcn/Base UI registry ports keep the registry's generic signatures.
    files: ['src/components/ui/motion/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    // Tests assert on untyped JSON response bodies.
    files: ['tests/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
]);
