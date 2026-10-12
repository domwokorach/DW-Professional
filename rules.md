# rules.md — Engineering Standards for DW-Professional

Single source of truth for AI coding agents and contributors working on this repository.
Read this file, `AGENTS.md` and `CLAUDE.md` before changing anything. If they conflict, the stricter rule wins; the verified project facts in section 1 override any assumption.

Owner: Dominic Wokorach Olanya · Site: https://www.dominicwokorach.me · Repo: `domwokorach/DW-Professional`

---

## 1. Verified Project Facts

Checked against the repository on 2026-10-12. Re-verify before relying on them; update this section when they change.

| Area | Fact |
| --- | --- |
| Framework | Next.js `^16.4.0` (App Router, `src/app`), React `^19.1.9`, TypeScript `strict: true`, path alias `@/*` → `src/*` |
| Next.js docs | `AGENTS.md` states this Next.js has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework code. |
| Styling | **Plain CSS** in `src/styles/*.css`, imported from `src/app/layout.tsx`. There is no Tailwind config and no PostCSS config in the repo. Do not add Tailwind classes or Tailwind as a dependency. |
| Components | `src/components/*` by feature (hero, layout, projects, skills, admin, `ui`, `animate-ui`, …). Hand-port third-party registry components (shadcn, Animate UI, Inspira, Aceternity) to scoped CSS and React; do not run their installers. |
| Animation / 3D | `motion`, `@react-spring/web`, `three` with `@react-three/fiber` and `drei`, `cobe`, `canvas-confetti` |
| Database | PostgreSQL via Prisma `^7.10.0` with `@prisma/adapter-pg`. Two schemas: `prisma/schema.prisma` (portfolio) and `prisma/company` (company search, config `prisma.company.config.ts`, client generated to `generated/company`). |
| Integrations | Resend (email), AWS S3 (private uploads, presigned URLs), LinkedIn OpenID Connect, Companies House API, OpenWeather, `@node-rs/argon2` (admin passwords) |
| Server-only code | Files named `*.server.ts` in `src/lib`; `src/proxy.ts` is the request proxy. |
| Hosting | **Vercel is the only production host.** The site is served from Vercel at `www.dominicwokorach.me`. |
| Retired service | The old Render `DW-Professional` service (Socket.IO live chat) was suspended on 2026-10-12. It must stay suspended unless the owner says otherwise. |
| Tests | Node's built-in runner through `tsx`: `npm test` → `tsx --test tests/*.test.ts` (JSDOM and `@testing-library/react` are available). **Jest is not installed** and must not be re-added. |
| Type check | `npm run typecheck` (`tsc --noEmit`) |
| Lint | **No ESLint configuration or `lint` script exists.** Do not claim lint passed. |
| Build | `npm run build` (the `prebuild` hook runs icon generation, `prisma generate` and `companies:generate`) |
| Releases | `docs/releases/` and `scripts/verify-release-version.mjs` |
| Dependency audit | 4 known high-severity advisories remain in Prisma CLI transitive dependencies (`deepmerge-ts`, `mysql2`). The only offered fix is a downgrade, so do not run `npm audit fix --force`. |
| Docs | `docs/COMMENTS.md`, `docs/COMPANIES.md`, `docs/S3_SETUP.md`, `README.md`, `DESIGN.md`, `PRIVACY.md` |

If `CLAUDE.md` mentions a technology that is not in the table above (for example Tailwind CSS or shadcn/ui as installed tooling), treat the table as correct for this repository.

---

## 2. Architecture

- Inspect the relevant files before editing. Search for a specific component or function before opening files.
- Follow the existing App Router layout: routes in `src/app`, UI in `src/components/<feature>`, data in `src/data`, shared logic in `src/lib`, hooks in `src/hooks`, types in `src/types`.
- Use server components by default. Add `'use client'` only for state, effects, browser APIs or event handlers, and keep the client boundary as small as possible.
- Keep secrets, database access and privileged integrations in server-only modules (`*.server.ts`, route handlers, server actions). Never import them into client components.
- Reuse existing components, hooks and utilities before creating new ones. Do not create duplicate components or duplicate project entries.
- Add a dependency only when the requirement cannot reasonably be met without it, and only with the owner's approval. Never install dependencies as a side effect of another task.
- Remove imports and code that your change makes unused. Do not delete unrelated code.

---

## 3. UI/UX and Visual Design

- Preserve the existing cream-and-navy editorial design (`DESIGN.md`): typography, spacing, colour, animation and responsiveness stay as they are unless the owner explicitly asks otherwise.
- **Never redesign an existing section without explicit permission.**
- When given a visual reference, match it as closely as technically possible and say what could not be matched.
- Test desktop, tablet and mobile widths. Avoid layout shift, overflow, overlapping content and blurry or upscaled assets.
- Support both light and dark themes (`src/lib/theme.ts`, `THEME_INIT_SCRIPT`). Any new colour needs a value for both themes.
- Preserve existing hero interactions, the London clock and the career timeline unless asked to change them.
- Seasonal layers (for example `src/components/halloween`) must be non-interactive, never block content or focus, and be removable in one place.
- Style with the existing CSS files and conventions. Scope new rules to the component and reuse existing design tokens (`packages/design-tokens`) instead of hard-coded values.

---

## 4. Coding Standards

- TypeScript strict mode stays on. No `any`, no unnecessary type assertions, no `@ts-ignore` without a written reason. Prefer narrowing and schema validation over casts.
- Follow existing naming, file layout and formatting. Match comment density in surrounding code.
- Keep functions small and modules focused. No speculative abstractions, feature flags or refactors that were not requested.
- Handle loading, empty, error and success states for anything that fetches or submits.
- Comment only non-obvious logic, and explain why, not what.
- Do not hide errors behind misleading fallbacks. A failure must surface or be logged safely, not be silently swallowed.

---

## 5. Accessibility (WCAG 2.2 AA)

- Use semantic HTML (landmarks, headings in order, lists, buttons for actions, links for navigation).
- Everything operable by mouse must be operable by keyboard, with a logical focus order and no keyboard traps.
- Provide a visible focus indicator on every interactive element in both themes.
- Give controls accessible names; give meaningful images alt text and mark decorative ones `alt=""` or `aria-hidden`.
- Maintain contrast of at least 4.5:1 for text and 3:1 for UI components and large text.
- Forms: associated labels, programmatic error messages, no placeholder-only labels.
- Dialogs, menus and carousels: manage focus, support Escape, expose correct roles and state, and do not auto-advance without a pause control.
- Announce dynamic changes (form results, moderation status, live updates) through suitable live regions.
- Essential functionality must never depend on hover, pointer input or animation alone. Touch targets are at least 24×24 CSS px.
- The public accessibility statement is `src/app/accessibility`. Keep it truthful when behaviour changes.

---

## 6. Animation and Interaction

- Prefer CSS transitions and animations. Use `requestAnimationFrame` for coordinated JavaScript animation.
- Respect `prefers-reduced-motion`: provide a static or minimal alternative for every non-essential animation, including canvas/WebGL, parallax, confetti and looping decorations.
- Remove every listener, observer, timer, animation frame and WebGL resource on unmount. Check `ResizeObserver`, `IntersectionObserver`, pointer and scroll listeners in particular.
- Pause or skip animation when the tab is hidden or the element is off-screen where practical.
- Animate `transform` and `opacity`; avoid animating layout properties.
- Support touch input without relying on hover. Keep animations subtle.

---

## 7. Time and Real-Time Behaviour

- UK-local displays use the `Europe/London` time zone, never the visitor's local zone or a fixed UTC offset. GMT/BST transitions must be handled by the time-zone database (`Intl`), not by manual offsets.
- Prevent hydration mismatches: render a stable value on the server and the first client render, then update after mount.
- Clear intervals, timeouts and subscriptions on unmount.
- Preserve the existing clock (`src/components/developer-id/LondonClock.tsx`, `src/components/rolex-clock`) styling and geometry unless a change is requested. Covered by `tests/clock-angles.test.ts`.
- No WebSocket or Socket.IO server is part of the current site. Do not reintroduce real-time infrastructure without approval.

---

## 8. Security and Environment Variables

- Never hard-code or print credentials, tokens, keys or connection strings. Never paste real values into code, docs, logs, commits or chat output.
- Environment files: `.env*` is git-ignored (only `.env.example` is tracked). Never commit real values. Add new variable *names* to `.env.example` with placeholder values only.
- Only variables prefixed `NEXT_PUBLIC_` reach the browser; never put a secret behind that prefix.
- Do not read or use credentials from backup env files (for example `.env.backup-full`) unless the owner has explicitly authorised that specific use.
- Validate and sanitise all untrusted input on the server: request bodies, query strings, headers, uploaded files (type, size, count) and form fields. Do not rely on client-side validation.
- Preserve authentication and authorisation on `/admin` and every private API route. Admin passwords use Argon2; never weaken hashing, session or rate-limit controls (`src/lib/rate-limit.server.ts`, `src/proxy.ts`).
- Apply least privilege. S3 access must stay private, with short-lived presigned URLs and server-side key handling (`docs/S3_SETUP.md`). Never make confidential assets public.
- Do not log personal data, enquiry contents, tokens or secrets.
- Honour cookie consent and privacy behaviour (`src/lib/consent.ts`, `PRIVACY.md`).
- Never publish confidential internal projects, and never invent experience, credentials or testimonials.
- Run `npm audit` when dependencies change and report the result. Do not use `--force` fixes without approval.

---

## 9. API, Database and External Services

- Validate every API request. Return consistent error shapes with appropriate status codes and no stack traces, SQL, file paths or secrets in responses.
- Set timeouts and handle failures from Resend, S3, LinkedIn, Companies House and OpenWeather. A failed optional integration must degrade gracefully and visibly, not be silenced.
- Follow existing Prisma conventions. Schema changes need a migration in `prisma/migrations` (or the company equivalent) and the owner's approval.
- **Never run migrations against production, and never delete, truncate or overwrite production data, without explicit approval.** Use `db:deploy` / `companies:migrate` only on targets the owner names.
- Keep the two Prisma clients separate. The company-search database belongs to a separate product; do not touch tables you did not create for this site.
- Do not modify, restart, repurpose, resume or delete legacy services (including the suspended Render service and its Key Value instance) without approval.
- Never change an integration just to make an error disappear.

---

## 10. Testing and Quality Assurance

Use the tooling that exists:

| Check | Command | Notes |
| --- | --- | --- |
| Unit / component tests | `npm test` | Node test runner via `tsx`, with JSDOM and Testing Library. Add tests under `tests/*.test.ts`. |
| Type check | `npm run typecheck` | Run for any TypeScript change. |
| Production build | `npm run build` | Run for substantial changes, routing, config or dependency changes. |
| Lint | — | Not configured. Report "lint unavailable"; do not invent a result. |

- Write tests for new logic and for bug fixes: loading, error, empty and success states, keyboard behaviour and accessible names where relevant.
- Test time-dependent code with fixed dates, including the GMT↔BST transitions (last Sunday of March and October).
- Do not run builds repeatedly without a reason, and do not re-run passing checks unchanged.
- **Never state that a check passed unless it was executed in this session and you saw the result.** Say plainly which checks were skipped or unavailable.
- Do not add Jest, Playwright, ESLint or other tooling without approval.

---

## 11. Performance

- Optimise images and media (`sharp`, `next/image` where it fits the existing pattern). Set explicit dimensions to prevent layout shift. Lazy-load below-the-fold media.
- Ship less JavaScript: keep server components server-side, dynamically import heavy client code (three.js, cobe, confetti) and avoid loading it where it is not shown.
- Avoid unnecessary re-renders, network requests and dependencies.
- Protect Core Web Vitals (LCP, CLS, INP). Check that a change does not regress them.
- Keep animations cheap, and stop them when they are not visible.

---

## 12. Git, GitHub and Deployment

- Inspect `git status` and existing changes first. Never discard, overwrite or reformat unrelated working-tree changes.
- Make small, focused changes. Stage specific paths rather than everything.
- Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`) with a short, descriptive subject. Do not add attribution lines to commits or PRs.
- Never commit secrets, `.env*` files, `generated/`, build output or temporary files.
- Do not commit or push unless the owner asks. Never force-push or rewrite history without explicit approval.
- Pushing to `master` may trigger a Vercel deployment; treat a push as a production-affecting action.
- Never deploy, change Vercel production settings or environment variables, change DNS or domains, or alter infrastructure without explicit permission. Keep the Vercel configuration intact.
- Releases follow `docs/releases/` and `scripts/verify-release-version.mjs`.

---

## 13. AI Agent Behaviour

**Before implementing**
1. Read this file and the files relevant to the task.
2. Choose the smallest safe change.
3. Check existing components, dependencies and tests.
4. Restate the owner's explicit visual and functional requirements and keep them intact.
5. For complex tasks, give a short plan first. For simple tasks, proceed.

**While implementing**
1. Make only the requested changes.
2. Reuse existing patterns and components.
3. Do not make speculative improvements or unrelated refactors. Mention noticed issues instead of fixing them.
4. Fix a related issue only when the requested change cannot work without it.
5. Never use a fallback that hides an error.
6. Ask before any destructive, irreversible or outward-facing action (deleting, suspending, deploying, pushing, sending data to a third-party service). Approval for one action does not extend to another.

**After implementing**
1. Review the diff.
2. Run the applicable checks from section 10.
3. Identify regressions and unresolved problems.
4. List exactly which files changed.
5. Separate verified results from untested assumptions.

---

## 14. Definition of Done

A task is done only when all of these hold:

- [ ] The requested functionality works as described.
- [ ] Existing design and behaviour are preserved in both themes and at all breakpoints.
- [ ] No known regressions were introduced.
- [ ] Relevant accessibility requirements (section 5) are met, including keyboard use, focus, and reduced motion.
- [ ] Relevant checks were run and passed, or each unavailable or skipped check is disclosed.
- [ ] No credentials, personal data or internal details are exposed.
- [ ] Nothing was committed, pushed or deployed unless the owner asked.

**Final report format**
- **Changes:** what was updated
- **Files:** which files changed
- **Validation:** checks run and their results
- **Issues:** outstanding problems or assumptions not verified
