# DOMINIC Design System

This document records the visual and interaction rules already implemented by the portfolio. The source of truth is the CSS in `src/styles`; this guide explains how to extend it without introducing a second design language.

## Design principles

1. **Editorial clarity.** Large expressive headings are balanced by compact monospace metadata and restrained body copy.
2. **Content first.** Animation, gradients and depth support hierarchy without delaying or obscuring information.
3. **Quiet consistency.** Borders, radii and shadows repeat across features instead of changing for each component.
4. **Inclusive by default.** Keyboard access, readable contrast, semantic markup and reduced-motion behaviour are part of the component definition.
5. **Responsive composition.** Layouts reflow around content rather than shrinking desktop arrangements beyond readability.

## Typography

- Primary UI and body text uses the system sans-serif stack: `Arial, Helvetica, sans-serif`.
- Editorial emphasis uses `Georgia, serif`, normally for italic words or testimonial copy.
- Labels, dates, counters and technical metadata use `--font-mono`: `ui-monospace`, SFMono-Regular, Menlo, Consolas and compatible fallbacks.
- Section headings use fluid `clamp()` sizes and tight negative tracking. New headings should follow the nearest existing section rather than introduce a new global scale.
- Body copy generally uses `1.5–1.75` line height; small metadata must retain enough contrast and line spacing to remain readable.

## Colour system

Global tokens are defined in `src/styles/base.css`.

| Token | Light value | Purpose |
|---|---|---|
| `--ink` | `#25233f` | Primary text and strong surfaces. |
| `--ink2` | `#383653` | Secondary dark emphasis. |
| `--cream` | `#f1eedf` | Page background. |
| `--cream2` | `#f8f5e9` | Raised/hover background. |
| `--sand` | `#e6e0ce` | Muted surfaces. |
| `--white` | `#fffdf7` | Card surface. |
| `--line` | `rgba(var(--ink-rgb), .16)` | Shared border colour. |
| `--text-2` to `--text-4` | Contextual neutrals | Secondary readable text. |
| `--live` | `#2f7a4c` | Live/current/success-adjacent status. |
| `--on-ink` | `#fff` | Text on `--ink` surfaces. |

Dark mode redefines the same tokens on `:root[data-theme="dark"]`; components must consume tokens rather than branch on hard-coded theme colours. The Contact section has its own mapped `--contact-*` tokens because it intentionally uses a distinct neutral system in both themes.

Do not add a literal colour when an existing semantic token expresses the same role. Feature-specific literals belong in one token block with a dark-theme counterpart.

## Spacing and layout

- Page sections use `.section` with `110px 7vw` desktop padding and `90px 20px` below `720px`.
- Section content generally caps at `1200px` and centres with `margin-inline: auto`.
- Use `clamp()` for large responsive gaps and typography.
- Internal component gaps commonly range from `8px` for compact metadata to `24–32px` for card structure.
- Avoid fixed heights for text content. Reserve dimensions only for media, controls and skeletons where layout stability requires it.
- Prevent page-level overflow with `min-width: 0`, wrapping and component-local overflow where needed.

## Border radius

- Feature cards use approximately `18px`.
- Large form surfaces use `20–24px`.
- Inputs use `12px`; smaller internal controls use `6–10px`.
- Pills and circular controls use `999px` or `50%`.

Reuse the owning feature's radius variable, such as `--cm-radius`, when one exists.

## Borders and shadows

- Default cards use `1px solid var(--line)`.
- Shadows are restrained and use `rgba(var(--shadow-rgb), …)` so they adapt to theme.
- Resting cards normally have either no shadow or a one-pixel lift. Larger shadows are reserved for transient popups, menus and focused hover states.
- Avoid blur-heavy glow effects. Status icons and verification marks should stay crisp.

## Responsive breakpoints

The CSS is content-led, with recurring breakpoints rather than a framework scale:

- `1050px`: reduce wide desktop columns and timeline measurements.
- `900px` / `860px`: collapse two-column feature layouts.
- `768px` / `720px`: switch navigation, timeline and page sections to mobile composition.
- `620px` / `560px` / `480px`: refine dense cards, forms and narrow-phone spacing.

Add a breakpoint only when content demonstrates a layout failure. Prefer extending the closest existing breakpoint.

## Buttons

- Primary actions use the dark semantic surface (`--ink` or `--contact-dark`) with the corresponding on-colour.
- Minimum control height is normally `44px`; primary submit actions use `52px`.
- Focus uses a visible two- or three-pixel outline with offset.
- Loading buttons preserve their resting dimensions, set `disabled` and `aria-busy`, and expose a readable loading label.
- Hover movement must be subtle and removed under reduced motion.

## Forms

- Labels are visible, compact and associated with controls.
- Required state, optional state, hints, counts and errors must not rely on placeholder text.
- Controls use a minimum `16px` input font size to prevent unwanted mobile zoom.
- Client validation improves usability; every public API repeats validation server-side.
- Errors use `aria-invalid` and `aria-describedby`. Submission results use live regions.
- Disabled and uploading states must prevent duplicate actions without erasing entered content on failure.

## Cards

- Cards use existing surfaces, borders and radii with generous internal whitespace.
- Information hierarchy should be title → key content → metadata/actions.
- Media dimensions are reserved before loading; images use `object-fit` appropriate to their composition.
- Repeated visual clones used for marquees must be hidden from assistive technology.

## Dialogs, menus and popups

- Use modal dialogs only when interaction must block the page. Non-blocking confirmations should use a status alert or toast without an overlay.
- Popups use a clear surface, subtle border, restrained shadow and visible close control.
- Focus must remain visible. Modal implementations must additionally manage focus entry, containment and return.
- Entrances may fade and move a few pixels; reduced motion shows the final state immediately.

## Navigation

- Navigation labels map to stable section IDs.
- The active section is visually indicated and tracked with `IntersectionObserver`.
- Mobile navigation preserves semantic links, touch targets and keyboard behaviour.
- Smooth scrolling is disabled when the visitor requests reduced motion.

## Animation and motion

- Prefer opacity and transform because they avoid layout recalculation.
- Entrance motion should run once, settle completely and never cause layout shift.
- Continuous animation must have a reason, remain slow and offer a pause mechanism where it moves content.
- Pause moving content on hover, focus and direct touch interaction when appropriate.
- `prefers-reduced-motion: reduce` must remove non-essential translation, autoplay and repeated animation.
- Avoid aggressive bounce, large scale changes, heavy blur and decorative infinite motion.

## Loading, success and error states

- Loading indicators reserve their final space and include text such as “Sending...” or “Uploading...”.
- Success uses `--live` or `--contact-success`, a text message and an accessible status announcement.
- Errors use the appropriate error token, plain-language recovery guidance and preserved user input.
- Colour is always supplemental to an icon, label or message.

## Accessibility requirements

- Use native elements before ARIA: headings, links, buttons, lists, forms, `<blockquote>`, `<cite>` and `<time>`.
- Maintain a logical heading order and meaningful landmark labels.
- Provide useful image alternative text; decorative graphics use empty alt text or `aria-hidden="true"`.
- Ensure keyboard-operable controls, visible focus and practical touch targets.
- Associate field errors and instructions programmatically.
- Test light/dark contrast and 200% zoom layouts.
- Preserve content and functionality with JavaScript-disabled or reduced-motion fallbacks where practical.

## Theme behaviour

An inline script applies the saved theme before React hydrates, preventing a theme flash. Until a visitor explicitly chooses a theme, the site follows the system preference. Components should use global or feature tokens; do not embed separate light/dark component markup.

## Reusable component conventions

- Shared primitives and carefully adapted third-party components belong in `src/components/ui`.
- Site-wide framing belongs in `src/components/layout`.
- Feature-specific components remain in their named folder (`contact`, `comments`, `hero`, and so on).
- Shared interaction hooks live in `src/hooks` and use the `use-*.ts[x]` naming convention.
- Components use PascalCase filenames; plain helpers and data use descriptive kebab-case or established domain names.
- Adapted components should retain a source comment and document meaningful behavioural changes.

## Shadcn/UI and Shadcn Blocks

- The existing `components.json` is authoritative. Do not rerun `shadcn init` or overwrite its aliases.
- This project uses plain CSS; imported demos must be adapted to existing tokens and must not introduce a second global reset or an unnecessary Tailwind layer.
- Review registry output before accepting overwrites. Some registries have previously altered SVG `viewBox` values or code literals.
- Shadcn Blocks Pro components require the owner's API key. Never commit that key. When access is unavailable, a local equivalent may be implemented only if its source and adaptations are documented accurately.
- Registry licences and third-party attribution remain independent of this project's licence.
