# DW-Professional — mobile (Expo)

React Native / Expo Router app for iOS and Android, with a web build. It opens straight into one scrolling portfolio page; there is no platform selector.

Portfolio content is **not duplicated**: `lib/data.ts` imports the website's data modules from `../../src/data` (experience, projects, achievements, contact, social, quick facts, testimonials, core tech, stack icons, certifications). Edit the data once and both apps update. Only images are copied (`assets/images`, from `public/`) because Metro needs them bundled. Hero settings (`HERO_LOOK_ZONES`, `HERO_LOOK_FADE`) are shared from `src/config/hero.ts`.

## Run

```bash
npm install            # from the repository root (npm workspaces)
cd apps/mobile
npx expo start         # scan the QR code with Expo Go (iOS: Camera app, Android: Expo Go)
npx expo start --ios | --android
npm run web            # syncs the website's public/ into apps/mobile/public, then starts the web build
npm run export:web     # same sync, then a static web export
npm run typecheck
```

`npx expo start --ios` needs an iOS simulator runtime installed in Xcode (Settings → Components). Without one, scan the QR code with Expo Go on a physical iPhone instead.

## Structure

| Path | Purpose |
|---|---|
| `app/` | Routes: `index.tsx` (native page), `index.web.tsx` and `_layout.web.tsx` (web), `settings.tsx`, `design-system.tsx`. |
| `components/portfolio/` | App shell, section navigation and scroll-to-section helpers. |
| `components/sections/` | Home, About, Experience, Projects and Contact sections. |
| `components/hero/` | Hero text, actions and the head-following character. |
| `components/developer-id/` | Flip-card Developer ID. |
| `components/retro/`, `components/liquid-glass/`, `components/ui/` | Shared UI primitives. |
| `theme/` | Colours, typography, motion and appearance settings. |
| `web/` | Web-only shims and overrides that let the website's components run in the browser. |
| `scripts/` | `sync-web-public.mjs` (copy `public/` for web) and `bake-hero-heads.mjs` (see below). |

## Troubleshooting a launch crash

`EXPO_PUBLIC_BISECT` (read in `lib/bisect.ts`) narrows down what crashes the app at launch by rendering less of it. Restart Metro with `-c` after changing it:

```bash
EXPO_PUBLIC_BISECT=2 npx expo start -c
```

| Level | Renders |
|---|---|
| 0 | A bare screen, no providers |
| 1 | Providers (theme, toasts) only |
| 2 | Home section only, no navigation |
| 3 | Every section, no floating navigation |
| 4 or unset | The full app (default) |

Raise the level until the crash returns; the last part added is the cause.

## Hero character

A static body image (`assets/images/character/body.webp`) with a head box on top. Eight turned head crops plus the body's own forward head are stacked in that box and only their opacity changes, so the body never moves. Dragging a finger anywhere over the character picks one of eight 45° directions (with hysteresis to avoid flicker) and releasing returns to the forward head. With iOS Reduce Motion on, the forward head stays and touches do nothing.

The website's collar and side fade is baked into each head's alpha channel (`assets/images/face/`), so no mask view is needed on native. To regenerate them from the originals in `assets/images/hero/`, run `node scripts/bake-hero-heads.mjs` (needs `sharp`).

This is a set of nine pose images, not a 3D model: it does not blend continuously between angles.

## Web-only features and their mobile equivalents

| Website | Mobile |
|---|---|
| Mouse-follow hero head | Touch-follow head (drag over the character); static forward head with Reduce Motion |
| Résumé verification flow, contact form | Buttons that open the website |
| Developer ID card (QR/NFC, 3D) | Simplified flip card (`components/developer-id`) |
| Live 3D avatar (12 MB GLB) | Not included; the layered 2D character is used |
| Light/dark toggle | Follows the system theme (adjustable in `settings.tsx`) |

Expo Go covers everything used here. Anything needing custom native code would require a development build (`npx expo run:ios|android`).
