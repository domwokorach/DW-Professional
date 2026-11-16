# DW-Professional — mobile (Expo Go)

React Native / Expo Router app for iOS and Android. It launches straight into the portfolio; there is no platform selector.

Portfolio content is **not duplicated**: `lib/data.ts` imports the website's data modules from `../../src/data` (experience, projects, achievements, contact, social, quick facts, testimonials, core tech, stack icons, certifications). Edit the data once and both apps update. Only images are copied (`assets/images`, from `public/`) because Metro needs them bundled.

## Run

```bash
npm install            # from the repository root (npm workspaces)
cd apps/mobile
npx expo start         # scan the QR code with Expo Go (iOS: Camera app, Android: Expo Go)
npx expo start --ios | --android | --web
npm run typecheck
```

## Screens

Home (hero, core tech, certifications, achievements) · About (+ quick facts, testimonials) · Experience · Projects · Contact.

## Web-only features and their mobile equivalents

| Website | Mobile |
|---|---|
| Pointer-tracked hero head | Static hero portrait |
| Résumé verification flow, contact form | Buttons that open the website |
| Developer ID card (QR/NFC, 3D) | Not included |
| Light/dark toggle | Follows the system theme |

Expo Go covers everything used here. Anything needing custom native code would require a development build (`npx expo run:ios|android`).
