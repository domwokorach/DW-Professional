# Page translation

A fixed language selector (right edge on desktop and tablet, a small button on phones) translates the page with Google Cloud Translation v3 (Advanced). English (UK) is the source and is never translated.

## How it works

1. `LanguageProvider` (in `src/app/layout.tsx`) restores the saved choice from `localStorage` (`portfolio-language`) and waits until the page has loaded.
2. `DomTranslator` (`src/lib/i18n/dom-translator.ts`) rewrites the *values* of existing text nodes and of `aria-label`, `title`, `placeholder` and `alt` attributes, and the page title. It never replaces DOM nodes, so React keeps working. It remembers each English original, restores it for English (UK), and picks up new content with a `MutationObserver`.
3. Unique, uncached strings are batched to `POST /api/translate` (Node.js runtime). The route checks same-origin, rate limit, payload limits and that the target is a language Google reports as supported, then calls `TranslationServiceClient` (`src/lib/i18n/translation.server.ts`).
4. `GET /api/translate/languages` returns Google's supported target languages (CDN-cached for a day). The A–Z directory and the rail are built from it, so unsupported languages are never offered.

Left untranslated: `translate="no"` / `.notranslate` / `data-no-translate` content, `code`, `pre`, form values, SVG, numbers, e-mail addresses, URLs, and the names in `src/lib/i18n/protected-terms.ts` (wrapped in `<span translate="no">` before the call). Translation is switched off under `/admin`.

English (US) is not machine translated: `americanise` applies a small whole-word British→American lexicon. English (Singapore) keeps British spelling. Singapore's Mandarin, Malay and Tamil options reuse the `zh-CN`, `ms` and `ta` targets with the Singapore flag.

## Caching and cost controls

- Server: in-memory per instance, keyed by content version + target + source text (max 20 000 entries), plus a daily character budget (`TRANSLATE_DAILY_CHAR_LIMIT`, default 1 000 000) and a per-IP rate limit. There is no shared cache between serverless instances.
- Browser: in-memory per language and `localStorage` (`portfolio-translations:<version>:<lang>`, four most recent languages, 300 kB each).
- Bump `CONTENT_VERSION` in `src/lib/i18n/languages.ts` after substantial copy changes.
- After an API failure the page stays English and no further requests are made for 30 seconds.

## Environment variables (server-only)

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud project (`silken-realm-508218-g5`) |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | Service-account e-mail |
| `GOOGLE_CLOUD_PRIVATE_KEY` | Service-account private key; literal `\n` sequences and surrounding quotes are accepted |
| `GOOGLE_APPLICATION_CREDENTIALS` | Keyless option: path to a workload-identity federation config (used when the two above are unset) |
| `TRANSLATE_DAILY_CHAR_LIMIT` | Optional daily character cap per instance |

## Google Cloud setup

1. Enable the **Cloud Translation API** on project `silken-realm-508218-g5`.
2. Use a dedicated service account with only the **Cloud Translation API User** role (`roles/cloudtranslate.user`).
3. Create a **new** key (the previously shared key must be revoked and deleted), then add the three variables in Vercel → Project → Settings → Environment Variables as *Sensitive*. Do not put them in `NEXT_PUBLIC_*` variables or commit them. Prefer workload identity federation (keyless) where possible.
4. Set a budget alert and a Cloud Translation quota in Google Cloud as a second cost limit.

Without credentials the selector still works for English (UK)/(US); other languages show "Translation is not set up yet" and the page stays English.

## Known limits

- Translation happens in the browser after load, so translated pages are not indexed; search engines see the English page at `/en-gb`. Locale routes (e.g. `/fr`) were not added because they would duplicate routing and need server-rendered translation.
- Saved languages show English for a moment on load until the cached or fetched translation is applied.
- Text drawn per letter (the Developer ID flip caption) and the animated hero scramble stay English; their accessible text is translated.
- Right-to-left languages set `dir="rtl"` on `<html>`; sections laid out with physical CSS properties may need per-section tuning.
