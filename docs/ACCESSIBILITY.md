# Accessibility

Target: **WCAG 2.2 AA**. Automated tests catch a subset of issues and do **not** establish conformance. This
document records what is tested, what was found and fixed, what is still open, and the manual checks that
complement the automation.

## Automated checks

`tests/e2e/a11y.spec.ts` (Playwright + `@axe-core/playwright`, rule tags `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`, `wcag22aa`):

- axe on `/en-gb`, `/privacy`, `/terms`, `/cookies`, `/accessibility`, in **light and dark** themes, on desktop
  and a phone viewport, with `prefers-reduced-motion: reduce`.
- Keyboard: the first Tab stop is visible and has a focus indicator.
- External links with `target="_blank"` carry `rel="noopener"`.
- Mobile target size (SC 2.5.8): every control is at least 24×24 CSS px, or meets the spacing exception (a 24px
  circle centred on it touches no other target). Inline text links are exempt, as in the criterion.
- Contrast: the design-token contrast tests in `tests/design-tokens-contrast.test.ts`.

Run: `npm run build && npx playwright test --project=a11y --project=a11y-mobile` (CI mode uses `next start`).
The same suite runs weekly against production (`accessibility.yml`).

## Found and fixed by these tests (2026-11-28)

| Finding | Fix |
|---|---|
| React hydration error #418 for visitors with reduced motion; React then discarded `<html data-theme>`, resetting the theme | `useReducedMotionSafe` (`src/hooks/use-reduced-motion-safe.ts`): the first client render matches the server HTML |
| Contrast: legal eyebrow, section tag "08", Live badge | Raised opacity / darkened `--live` |
| Label in Name (SC 2.5.3): brand button, project links, platform CTA, achievement panels, Developer ID card | Accessible names now contain the visible text |
| `<ul>` with `role="group"` children (testimonial carousel) | Group semantics moved to the inner article |
| Undersized carousel pagination dots (7px) | 24px hit area, same visual dot |
| Internal link opened in a new tab without `rel` | `rel="noopener noreferrer"` |

## Known gaps

- GitHub contribution grid cells (`.gh-cell`, 17×17px) are below 24px; the test lists this one selector as a
  documented exception. Fix: enlarge the hit area or provide an alternative control.
- 64 ESLint warnings remain (breakdown in docs/TESTING.md); none is a jsx-a11y error.
- Not yet covered by automation: screen-reader announcement quality, 200% zoom / 400% reflow (SC 1.4.4, 1.4.10),
  text-spacing overrides (SC 1.4.12), the admin area and the Expo app.

## Manual testing (VoiceOver, TalkBack)

Do this for each release that changes UI, and record results in the pull request.

**VoiceOver (macOS Safari)** — `Cmd+F5` to start.
1. Landmarks: `VO+U` → Landmarks. Expect banner, primary navigation, main, and a footer.
2. Headings: `VO+U` → Headings. One `h1`; section headings in order.
3. Navigate the Engineering cards with `VO+Right`: each reads number, title, description, status text and link.
4. Press the theme toggle; confirm the label states the current theme.
5. Open and close a dialog (résumé request); focus must move in and return to the trigger.

**VoiceOver (iOS)** — Settings → Accessibility → VoiceOver. Swipe through the page; check touch targets and rotor headings.

**TalkBack (Android)** — Settings → Accessibility → TalkBack. Swipe right through the page; use Reading controls →
Headings; confirm external links announce "opens in a new tab".

**Other manual checks**: keyboard only (Tab, Shift+Tab, Enter, Space, Esc); 200% browser zoom and 400% reflow at
320px width; Windows High Contrast / forced colours; OS "Reduce motion" on and off.
