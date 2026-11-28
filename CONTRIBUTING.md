# Contributing

This is a personal portfolio repository, maintained by its owner. Issues and pull requests are
welcome for genuine bugs or broken links; please don't open PRs that add unrelated content,
credentials, or projects that aren't the owner's own work.

## Getting set up

```bash
npm ci
npm run dev
```

`postinstall` generates both Prisma clients automatically. A local `.env` with `DATABASE_URL` (and
`COMPANY_DATABASE_URL`, if you're touching the companies schema) is required for anything that
touches the database — never commit `.env` files or real credentials.

## Before opening a PR

```bash
npm run typecheck
npm test
npm run build
```

All three are required checks in CI (Jenkins and GitHub Actions); a PR that fails any of them
won't be mergeable against `master`.

## Commit messages

Commits follow a loose [Conventional Commits](https://www.conventionalcommits.org/) style —
`feat(scope): ...`, `fix(scope): ...`, `ci: ...` — see `git log` for examples. It isn't strictly
enforced, but keeping to it makes the history easier to scan.

## Scope

- Preserve the existing portfolio content — career history, project titles, descriptions and URLs
  — exactly as supplied by the owner.
- Don't introduce new frameworks or dependencies without a clear reason.
- Match the existing code style; there's no linter configured, so consistency with surrounding
  code is the standard to follow.
