# Accessibility

## Reduced motion

`prefers-reduced-motion` is read centrally in `src/config/media.ts` and respected throughout the
site's CSS (`src/styles/*.css`) and animated components, so anyone who has turned down motion at
the OS level sees transitions and the hero interaction scaled back or removed rather than played
in full.

## Semantic structure and labelling

Sections use landmark elements with `aria-labelledby` pointing at their own heading (see
`EngineeringSection` and similarly structured sections), so assistive technology can jump straight
to a section by name instead of reading the page linearly.

Links that open in a new tab carry an explicit `(opens in a new tab)` suffix in their accessible
name (`aria-label`), and use `target="_blank"` with `rel="noopener"` so the accessible name, the
visible behaviour, and the security posture of the link all agree.

## Keyboard navigation

Interactive elements are native `<a>` and `<button>` elements wherever possible, so focus order,
`:focus-visible` styling, and activation via keyboard come from the browser rather than from
custom JavaScript. Focus indicators are preserved rather than suppressed with `outline: none`.

## Theming

Every themed surface is implemented with the same token set in both the light and dark palettes,
so accessibility properties such as contrast are not something that only the default theme has to
satisfy.

## Verifying changes

There is no automated accessibility test suite in this repository yet; accessibility is checked
manually — keyboard-only navigation, a screen reader pass, and OS-level reduced-motion and
dark-mode toggles — before a change ships. If that changes, this document should name the tool and
the `npm` script that runs it.
