# Project Rules

Rules for anyone (human or AI assistant) changing this portfolio. See [README.md](README.md) for setup and [DESIGN.md](DESIGN.md) for the design system.

## Stack and conventions

- Follow the existing architecture: Next.js App Router, React, TypeScript, Prisma and PostgreSQL.
- Styling is plain CSS organised by section. Do not add Tailwind or other frameworks.
- Prefer reusable components and existing patterns. Add dependencies only when necessary.
- Use scripts from `package.json` for checks and builds.

## Design and accessibility

- Preserve the existing design and hero interactions unless a change is requested.
- Support desktop, tablet and mobile, in both light and dark themes.
- Use semantic HTML, accessible labels, keyboard navigation and visible focus indicators.
- Respect `prefers-reduced-motion`. Keep animation subtle and avoid layout shifts.

## Content

- Preserve career timeline entries, project titles and descriptions.
- Use the exact project URLs supplied by the owner. Do not create duplicate projects.
- Never publish confidential internal projects or assets.
- Never invent experience, credentials or achievements.

## Security and privacy

- Never expose or commit secrets or `.env` files.
- Keep authentication, authorisation and protected admin routes intact.
- Validate and sanitise all user input. Handle API errors safely.
- Do not log personal data or credentials.

## Database

- Follow existing Prisma schema conventions.
- Never delete or overwrite production data.
- Never run production migrations without approval.

## Git and deployment

- Review existing changes before editing and never discard unrelated work.
- Do not force-push or rewrite history.
- Commit, push and deploy only when explicitly requested.
- Preserve the existing Vercel configuration.

## Verification

- Run targeted checks for what changed: type check, lint, and a production build for substantial changes.
- Report failed or unavailable checks accurately. Do not claim success without verification.
