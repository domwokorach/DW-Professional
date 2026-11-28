# Contributing

See [RULE.md](RULE.md) for project rules, [DESIGN.md](DESIGN.md) for the design system and
[docs/TESTING.md](docs/TESTING.md) for tests.

## Setup

```bash
git clone https://github.com/domwokorach/DW-Professional.git
cd DW-Professional
npm ci                 # npm is the package manager (package-lock.json); Node.js 22 or newer
cp .env.example .env   # optional; the site renders without it
npm run dev            # http://localhost:3000 (redirects to /en-gb)
```

Use **npm**, not Yarn or pnpm. `package.json` pins `packageManager: npm@…` and the lockfile is `package-lock.json`.
Commit lockfile changes with the dependency change that caused them.

## Before you push

```bash
npm run lint           # ESLint (flat config, CLI; `next lint` is not used)
npm run typecheck      # web and Expo, both must pass
npm test               # all test suites
npm run build          # for substantial changes
```

`npm run lint:fix` applies safe fixes. Do not silence rules with `eslint-disable`, `@ts-ignore` or `any`; fix the
cause. React Compiler rules are warnings (see docs/TESTING.md); do not add new ones.

## Commits and pull requests

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`, for example
`fix(a11y): give the brand button an accessible name`. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`. Branch from `master`, keep changes focused, never force-push shared branches.

A pull request should describe the change, list the checks you ran and their results, include screenshots for UI
changes (light and dark, desktop and mobile), and keep CI green. Do not commit `.env` files or secrets.

Git hooks are intentionally not installed: CI is the enforced gate, and hooks would add a dependency and be easy to
bypass locally.

## Conventions

- Styling is plain CSS per section using tokens from `src/styles/base.css`; no Tailwind.
- Preserve career entries, project titles and URLs, and existing hero interactions unless asked.
- Anything animated respects `prefers-reduced-motion`; use `useReducedMotionSafe` when it changes markup.
- Server-only code lives in `*.server.ts`; browser code must not import it (a test enforces this).
