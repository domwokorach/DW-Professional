# Contributing to DW-Professional

Thanks for your interest in contributing. This is a personal portfolio project, primarily built and maintained by [Dominic Wokorach](https://github.com/domwokorach), but focused, well-scoped contributions — bug fixes, accessibility improvements, and documentation fixes — are welcome.

## Before you start

For anything beyond a small fix (a typo, a broken link, an obvious bug), please open an issue first to discuss the change. This avoids spending time on a pull request that doesn't fit the project's direction.

Please do not submit pull requests that:

- Rewrite portfolio content, project descriptions, or case-study text (this is personal, factual content about the author's own work)
- Add new dependencies without prior discussion in an issue
- Include unrelated formatting or file-wide reformatting changes

## Repository setup

1. Fork the repository and clone your fork.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` if you need the optional AI search or weather demos to work locally (the core portfolio runs without them — see the README).
4. Start the dev server:

   ```bash
   npm run dev
   ```

## Branch naming

Branch from `master` using a short, descriptive name prefixed by type:

```text
fix/mobile-nav-overlap
feat/gallery-keyboard-nav
docs/readme-setup-steps
a11y/contact-form-labels
```

## Code style

- TypeScript throughout — avoid `any`; prefer explicit, narrow types.
- Match existing conventions in the file you're editing (Tailwind utility patterns, component structure, naming) rather than introducing a new style.
- Keep components focused; avoid adding abstraction or configuration for a single use case.
- Run the linter before committing:

  ```bash
  npm run lint
  ```

## TypeScript standards

- No new `// @ts-ignore` or `any` without a clear comment explaining why it's unavoidable.
- Shared shapes belong in `src/types/`; keep component props colocated with the component unless reused elsewhere.
- The build must type-check cleanly:

  ```bash
  npm run build
  ```

## Accessibility

This portfolio takes accessibility seriously. Any UI change should preserve:

- Semantic HTML and correct heading order
- Full keyboard operability (tab order, focus states, Escape/Arrow key handling where relevant)
- Visible focus indicators
- Sufficient colour contrast
- `prefers-reduced-motion` support for any new animation
- Meaningful `alt` text and `aria-label`s on interactive controls

If you're changing an interactive component (carousel, modal, form), test it with keyboard-only navigation before opening a PR.

## Testing your change

There is no automated test suite yet, so validate manually:

```bash
npm run lint
npm run build
```

Then run `npm run dev` and check your change in the browser at the relevant breakpoints (mobile, tablet, desktop), including a quick pass with the keyboard only.

## Commit messages

Write commit messages that explain *why*, not just *what*:

```text
Fix gallery thumbnail focus order on Safari

Safari doesn't fire click before blur consistently, causing the
thumbnail strip to skip a slide on first keyboard activation.
```

Keep the first line under ~72 characters; add detail in the body if needed.

## Pull requests

1. Keep PRs small and focused on one change.
2. Describe what changed and why in the PR description.
3. Confirm `npm run lint` and `npm run build` pass.
4. Note any manual testing you did (devices, browsers, keyboard/screen reader checks).
5. Link the related issue if one exists.

## Issue reporting

When filing a bug, please include:

- Steps to reproduce
- Expected vs. actual behaviour
- Browser/device and viewport width
- A screenshot or screen recording if the issue is visual

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
