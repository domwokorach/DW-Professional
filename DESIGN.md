# Design System

This document describes how the DW-Professional portfolio's UI is built today: the visual language, tokens, layout rules, components, and interaction patterns. It is written for developers joining the project. For setup, environment variables, scripts, and deployment, see [README.md](README.md). For contribution workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

**Visual direction.** The site was designed dark-first: a near-black page (`ink`), slightly lighter panels (`surface`), hairline borders (`line`), and a blue/violet/cyan accent trio. Typography is Inter with JetBrains Mono for eyebrows, labels, and technical detail. Cards are low-contrast "glass" panels (`bg-paper/[0.02]`, `border-paper/10`) that brighten on hover. Decorative layers (glyph matrix, animated blobs, a spinning conic border glow, a tilting profile card) sit behind the content and are turned off or simplified under reduced motion and high contrast.

**Responsiveness.** Layouts are mobile-first Tailwind. Most sections move from one column to two, then three, across `sm`/`md`/`xl`. A few surfaces (gallery, hero scrim, admin chat) have their own breakpoint logic, documented below.

**Accessibility.** The site includes a skip link, visible `:focus-visible` outlines, labelled icon buttons, live regions for async state, 44px touch targets on most controls, a global reduced-motion override, and an on-page Accessibility options panel (high contrast, text size, bold text). An automated axe check runs through Playwright (see [Accessibility](#accessibility)). No formal WCAG conformance claim is made.

**Themes.** Light, dark, and system themes are supported through `next-themes`, which writes `data-theme` on `<html>`. All semantic colours are CSS variables that flip under `html[data-theme="light"]`.

## Design Principles

- **Clear visual hierarchy.** Every home-page section opens with `SectionHeading`: a mono, accent-coloured eyebrow (`02 / Expertise`) followed by a large fluid `h2`. Body copy is `text-muted`, and headings and key labels are `text-paper`.
- **Responsive-first layouts.** Base styles target mobile. Breakpoint prefixes add columns and spacing, and nothing is designed desktop-down.
- **Accessible interactions.** Custom controls expose state (`aria-expanded`, `aria-pressed`, `aria-current`, `aria-invalid`). Async changes are announced through `role="status"`/`aria-live` regions. Focus moves deliberately when dialogs open and close.
- **Consistent spacing.** Sections share one vertical rhythm (`py-28 sm:py-36`) and one container (`Container`). Card grids use `gap-4 → gap-6 → gap-8`.
- **Reusable components.** Tokens live in Tailwind config and `globals.css`. Primitives live in `src/components/ui/`, and feature components compose them.
- **Performance-conscious UI.** Live Chat and the gallery lightbox load through `next/dynamic` with `ssr: false`. Images go through `next/image` with explicit `sizes`. Scroll listeners are passive and rAF-throttled. Only the hero portrait and the default gallery panel are `priority`.
- **Progressive disclosure.** Long lists and dense cards are collapsed by default, with a shared Show more / Show less control (see [Show More pattern](#show-more--show-less)).
- **Consistent cross-device behaviour.** Content is the same on every device. Only layout and entry points change: navigation collapses to a menu below `xl`, and the admin chat panes toggle on mobile.

## Technology

Everything below is imported from `src/`. Versions come from `package.json`.

| Area | What is used | Where |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 | `src/app/` |
| Styling | Tailwind CSS 3.4 + PostCSS/Autoprefixer, `clsx` + `tailwind-merge` via `cn()` | `tailwind.config.mts`, `src/app/globals.css`, `src/lib/utils.ts` |
| Variants | `class-variance-authority` | `ui/badge.tsx`, `ui/alert.tsx`, `ui/button-variants.ts` |
| Primitives | Radix UI (`@radix-ui/react-*`: alert-dialog, dialog, dropdown-menu, tabs, tooltip, select, switch, checkbox, scroll-area, progress, avatar, separator, label, slot) | `src/components/ui/`, `src/components/animate-ui/` |
| Primitives | Base UI (`@base-ui/react`) for Select, Progress, Navigation Menu | `src/components/ui/motion/` |
| Registries | shadcn/ui CLI config (`components.json`, style `new-york`, `cssVariables: false`) with Animate UI, Magic UI, Pace UI, React Bits registries | `components.json` |
| Theming | `next-themes` | `src/components/theme-provider.tsx` |
| Animation | `framer-motion` (most components), `motion` (`motion/react`, used by the Base UI wrappers), `gsap` (Accordion Gallery), `rough-notation` (heading highlighter) | see [Animation and Motion](#animation-and-motion) |
| Positioning | `@floating-ui/react` | `animate-ui/primitives/animate/tooltip.tsx` |
| Chat scroll | `use-stick-to-bottom` | `ui/chat-container.tsx`, `chat/MessageList.tsx` |
| Toasts | `sonner` | `ui/sonner.tsx` |
| Icons | `lucide-react` (primary), `react-icons` (brand/tech logos) | see [Icons](#icons) |
| Data viz | `d3` | `project/OrgGraph.tsx` |
| Fonts | `next/font/google` (Inter, JetBrains Mono) | `src/app/layout.tsx` |
| Validation | `zod` (server/shared schemas), `libphonenumber-js` (phone field) | `src/lib/contact/` |

`react-hook-form`, `@hookform/resolvers`, and the `radix-ui` umbrella package are listed in `package.json` but not imported anywhere in `src/`. Forms are built with controlled React state. `embla-carousel-react` is used only by `gallery/GallerySlider.tsx`, which is not currently mounted.

## Layout

### Global page structure

```text
src/app/layout.tsx            <html data-theme lang dir> + fonts + ThemeProvider + TooltipProvider + LocaleProvider + <Toaster/>
└─ src/app/(site)/layout.tsx  Skip link → <Header/> → <main id="main"> → <Footer/>
                              + CookieConsentManager, BackToTopButton, AccessibilityControls,
                                OfflineStatus, LiveChatLoader (all fixed/overlay)
   └─ src/app/(site)/page.tsx Hero → About → Expertise → Services → Projects →
                              Experience → Gallery → Testimonials → Contact
src/app/admin/layout.tsx      AdminShell (sidebar + inset) for /admin/*
src/app/(auth)/layout.tsx     Sign-in layout
```

A small inline script in the root layout sets `lang`/`dir` from the URL locale prefix before first paint. Arabic (`ar`) renders RTL.

### Header and navigation

`src/components/layout/Header.tsx`

- The header is `fixed inset-x-0 top-0 z-[60]`, with the inner `nav` `h-16` and `max-w-content`.
- Background: `bg-ink/30 backdrop-blur-sm` at the top of the page, and `bg-ink/70 backdrop-blur-lg border-b border-line` once `scrollY > 24`.
- **`xl` and up:** centred Base UI `NavigationMenu` links in mono type, then `LanguageSelector`, `ThemeToggle`, and a "Resume" pill.
- **Below `xl`:** only the logo, `ThemeToggle`, and a 44×44 hamburger (`aria-expanded`, `aria-controls="mobile-menu"`). `MobileNavigation` animates open (height/opacity, opacity-only under reduced motion) and contains nav items, the language selector, the Resume button, and social links.
- The active section is computed from scroll position, shown as `bg-accent/10 text-accent` on desktop and as a rough-notation highlight on mobile, and exposed with `aria-current`.
- Section navigation moves focus to the target section (`tabindex=-1`), offsets for the header height, and uses instant scroll under reduced motion.
- While the header sits over the unscrolled home Hero, it adds `.hero-scrim-text` so its text stays light on the hero image's dark scrim below `lg`.

### Main content width

`Container` (`src/components/ui/Container.tsx`) is the single content wrapper:

```tsx
"mx-auto w-full max-w-content px-6 sm:px-8 lg:px-10"   // max-w-content = 1280px
```

Prose blocks are further limited with `max-w-2xl` (section intros) or `max-w-lg` (hero paragraph).

### Section spacing

- Standard section: `relative border-t border-line py-28 sm:py-36`, with `scroll-mt-24` so anchored navigation clears the fixed header.
- Hero: `min-h-[100svh] pt-24`, vertically centred.
- Gallery: at `lg`+ the section fills exactly one viewport minus the nav (`calc(100dvh - 4.0625rem)`). Rules are in `AccordionGallery.css`.
- Inside a section: heading → intro `mt-8` → grid `mt-16` → Show more `mt-8` → sub-section `mt-24`.

### Footer

`src/components/layout/Footer.tsx` has three `nav` columns (Explore, Connect, Legal), each labelled by an `h2`. They stack centred on mobile and sit side by side left-aligned from `md` (`md:flex-row md:flex-wrap`, `lg:flex-nowrap`). A bottom bar holds the copyright line and "Back to top". Links are `min-h-11` touch targets.

### Grid and flex patterns

| Pattern | Classes | Used in |
| --- | --- | --- |
| 1 → 2 → 3 card grid | `grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3` | Expertise, AI capabilities |
| 1 → 2 → 3 card grid (denser) | `grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8` | Services, Projects, Case studies |
| Two-column split | `grid gap-16 lg:grid-cols-2 lg:gap-20` | Contact |
| Paired form fields | `grid gap-5 sm:grid-cols-2` | Contact form |
| Tag clouds | `flex flex-wrap gap-2` | Skill/service chips |

### Breakpoints

The project uses Tailwind's default screens with no overrides in `tailwind.config.mts`:

| Token | Min width | Typical use |
| --- | --- | --- |
| (base) | 0 | Mobile layout |
| `sm` | 640px | Tablet: wider padding, 2-column form rows, larger section padding |
| `md` | 768px | Two-column grids, footer row, admin chat list+thread side by side, chat panel fixed 380px |
| `lg` | 1024px | Container padding `px-10`, hero split layout, contact split, gallery horizontal accordion |
| `xl` | 1280px | Full desktop navigation, 3-column Expertise grid |
| `2xl` | 1536px | Extra nav link padding only |

Additional breakpoints found in source:

- `min-[1200px]`: admin chat shows the permanent customer-details column.
- `max-width: 1023px` / `max-width: 639px` (and `max-height: 700px`): media queries in `AccordionGallery.css` and `globals.css` (`.hero-scrim-text`).
- JS breakpoints: `useExpandable` reads 640/768/1024 to match `sm`/`md`/`lg`. `useIsMobile` treats `< 768px` as mobile. `AccordionGallery` treats `≤ 1023px` as compact.

## Typography

**Font families and loading.** Fonts are loaded in `src/app/layout.tsx` via `next/font/google` with `subsets: ["latin"]` and `display: "swap"`, exposed as CSS variables on `<html>`:

| Tailwind | Variable | Font | Use |
| --- | --- | --- | --- |
| `font-sans` (default on `body`) | `--font-sans` | Inter | All body and heading text |
| `font-mono` | `--font-mono` | JetBrains Mono | Logo, nav links, section eyebrows, chips, chat panel titles, counters |

`body` sets `font-size: 100%`, `line-height: 1.5`, and `antialiased`. The Accessibility panel scales the root size (`data-text-size` small = 87.5%, large = 112.5%), so use `rem`-based Tailwind sizes rather than `px` for text.

**Hierarchy.**

| Role | Implementation |
| --- | --- |
| Hero `h1` | `text-[clamp(2.75rem,8vw,6rem)] font-semibold leading-[0.95] tracking-[-0.03em]` |
| Section `h2` (`SectionHeading`) | `text-[clamp(1.9rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-paper` |
| Section eyebrow | `font-mono text-sm tracking-[0.15em] text-accent` ("03 / Services") |
| Sub-section `h3` | `text-2xl sm:text-3xl font-medium`, or a mono `text-xs uppercase tracking-widest text-accent` label |
| Card title | `text-lg` / `text-xl font-medium text-paper` |
| Body / intro | `text-base leading-[1.7] text-muted` |
| Card body | `text-sm leading-[1.6]`–`[1.7] text-muted` |
| Form labels | `mb-2 block text-sm text-muted`, with `GradientText` on the field name in the contact form |
| Buttons | `text-sm font-medium` |
| Helper / meta | `text-xs text-muted`, chat timestamps `text-[11px]` |

Headings can be animated with `TextType` (typewriter), `TrueFocus`, `DecryptedText` (hero), and `HeadingHighlighter`. Each keeps the real text in the DOM.

## Colour System

Tokens are defined as RGB triplets in `src/app/globals.css` and mapped in `tailwind.config.mts`, so opacity modifiers work (`bg-ink/70`, `border-accent/60`). Dark values are the `:root` defaults, and `html[data-theme="light"]` overrides every token.

| Token (Tailwind) | CSS variable | Role | Dark | Light |
| --- | --- | --- | --- | --- |
| `ink` | `--color-ink` | Page background, input fill | `9 9 9` | `248 250 252` |
| `surface` | `--color-surface` | Panels, cards, dialogs, toasts | `17 17 17` | `255 255 255` |
| `line` | `--color-line` | Borders, dividers (full colour, no alpha modifier) | `rgba(255,255,255,.1)` | `#cbd5e1` |
| `paper` | `--color-paper` | Primary foreground on the page; also used as a low-alpha glass tint (`bg-paper/[0.02]`) | white | `15 23 42` |
| `muted` | `--color-muted` | Secondary text, icons | `163 163 163` | `71 85 105` |
| `accent` | `--color-accent` | Links, eyebrows, active states, focus ring, chat bubbles | `91 141 239` | `29 78 216` |
| `accent2` | `--color-accent2` | Secondary accent (violet) | `139 123 240` | `109 40 217` |
| `accent3` | `--color-accent3` | Tertiary accent (cyan/teal), "connected"/"read" states | `110 231 255` | `15 118 110` |
| `accent-fg` | `--color-accent-fg` | Text on an accent surface | `9 9 9` | white |
| `cta` / `cta-fg` | `--color-cta`, `--color-cta-fg` | Inverted primary button surface and its text | white / ink | slate-900 / white |
| — | `--color-body-fg` | `body` text colour | `242 242 244` | `23 32 51` |
| `.text-greeting` | `--color-greeting` | Hero greeting tint | `147 197 253` | `11 31 58` |

**Semantic usage.**

- **Backgrounds:** `bg-ink` (page, inputs), `bg-surface` (cards, panels), `bg-paper/[0.02]`–`[0.04]` (glass cards).
- **Foreground / muted:** `text-paper` and `text-muted`. Placeholders use `placeholder:text-muted` or `/60`.
- **Borders:** `border-line`, or `border-paper/10` → `/20` on hover for glass cards.
- **Primary action:** `bg-cta text-cta-fg`, hovering to `bg-accent text-accent-fg`.
- **Secondary action:** `border border-line text-paper`, hovering to `border-accent/60`.
- **Success:** Tailwind `emerald-400/500` (upload complete, online dot, "Available"). Company status badges use `.bg-status-active-bg` / `.text-status-active-fg`, which are theme-aware.
- **Warning:** Tailwind `amber-400` (message near limit, reconnecting, away).
- **Error:** Tailwind `red-300` (inline field errors on the contact form), `red-400` (chat/upload errors, offline), `red-500/600` (destructive buttons and badges). `.bg-status-negative-bg` / `.text-status-negative-fg` are the theme-aware versions.

Status colours are raw Tailwind palette values, not tokens, and several (`text-red-300`, `text-amber-400`) are tuned for the dark theme. Check contrast in light mode when you add new status text.

**Fixed-dark surfaces.** Image overlays (hero scrim, gallery panel overlay, profile card info) keep literal dark or white values in both themes on purpose. Don't swap them for `paper`/`ink`.

## Themes

- **Provider:** `src/app/layout.tsx` wraps the app in `ThemeProvider` (`next-themes`) with `attribute="data-theme"`, `defaultTheme="system"`, `enableSystem`, and `storageKey="theme-preference-v1"`.
- **Storage:** the chosen theme is persisted by `next-themes` in `localStorage` under `theme-preference-v1`. With no stored value, the OS preference applies.
- **Switching:** `ThemeToggle` (desktop/tablet icon button with tooltip) and `ThemeToggleMobile` (full-width row inside the mobile menu) in `src/components/theme-toggle.tsx`. Both wrap `AnimatedThemeToggler` in controlled mode (`theme` + `onThemeChange` → `setTheme`). The toggler uses the View Transitions API for a circular reveal from the button, and skips it when the API is missing or reduced motion is on. Before hydration, a disabled placeholder button is rendered so server and client markup match.
- **How components adapt:**
  1. **Token classes (preferred).** `bg-ink`, `text-paper`, `border-line`, and the rest flip automatically.
  2. **`html[data-theme="light"] .x` rules** in `globals.css` for bespoke effects: `.border-glow`, `.orbit-ring`, `.gradient-text`, `.gradient-text-button`, `.profile-card-*`, `.grid-bg`, and the status badges.
  3. **`dark:` variants.** Tailwind's `darkMode` is `["selector", '[data-theme="dark"]']`, so `dark:` works, but it's used sparingly (~50 occurrences).
- **High contrast** is a separate layer (`html[data-high-contrast="true"]`) set by Accessibility options. It forces black backgrounds, white text, yellow (`#ffe600`) links and buttons, white borders, a thicker focus ring, and hides decorative layers.
- **Toasts:** `ui/sonner.tsx` passes `theme="dark"` to Sonner but styles every toast part with token classes (`bg-surface`, `text-paper`, `border-line`), so toast colours follow the active theme.

## Responsive Design

| Surface | Mobile (< 640) | Tablet (640–1023) | Desktop (≥ 1024) |
| --- | --- | --- | --- |
| **Navigation** | Logo + theme + hamburger. Full-height scrollable menu panel (`max-h-[calc(100dvh-4rem)]`) | Same as mobile until `xl` (1280) | `xl`+: inline nav, language, theme, Resume |
| **Hero** | Portrait fills the section behind the text with a vertical dark scrim. Text is forced light via `.hero-scrim-text` | Same | Portrait occupies the right 48% with a horizontal fade. Text follows theme tokens |
| **Cards** (Expertise/Services/Projects) | Single column, 4 items visible | 2 columns, 6 visible | 2–3 columns, 6–8 visible |
| **Forms** (Contact) | Single column, 16px input font to prevent iOS zoom | Name/Email and Company/Budget pair up at `sm` | Form sits in the right column beside the profile card (`lg:grid-cols-2`) |
| **Accordion Gallery** | Vertical stack. Collapsed panels 70px tall, active panel `clamp(200px, 32dvh, 260px)`. Labels always visible | Vertical stack. Collapsed 76px, active 300px | Horizontal accordion in a viewport-height section. Collapsed 76px wide, active `min(680px, max(320px, 52% of width))`, animated with GSAP |
| **Skills (Expertise)** | 1 column, core chips visible, rest behind per-card Show more | 2 columns from `md` | 3 columns from `xl` |
| **Live Chat** | Panel `w-[calc(100vw-32px)]`, `max-h-[min(70dvh,…)]`, lifted above the on-screen keyboard via `useKeyboardInset`. Safe-area aware offsets | Same until `md` | `md`+: fixed 380px wide panel |
| **Admin Chat** | List or thread, one at a time. Thread has a back button. Details via a Sheet from the header menu | `md`+: list (280px) and thread side by side | `lg`: list 320px. `min-[1200px]`: permanent 320px details column |

## Components

Paths are relative to `src/components/`. Unless noted, components accept `className` and merge it with `cn()`.

### Buttons

**`ui/Button.tsx`**, the site-wide action button.

- Props: `variant: "primary" | "secondary" | "ghost"` (default `primary`), `href?`, `onClick?`, `type?`, `disabled?`.
- Renders `ScrollButton` for `#hash` hrefs (smooth in-page scroll), `next/link` for other hrefs, otherwise a `<button>`.
- Base: `rounded-full px-6 py-3.5 text-sm font-medium`, focus outline offset 2, `disabled:opacity-60 cursor-not-allowed`.
- Variants: primary = `bg-cta text-cta-fg` → hover `bg-accent`. Secondary = outlined `border-line`. Ghost = `text-muted` → `text-paper`.

**`ui/button-variants.ts`** is a CVA `buttonVariants` (`default | outline | destructive`) for Radix composition, such as AlertDialog Action/Cancel. Its `default`/`outline` use literal `white`, so they are dark-theme-oriented.

**`ui/chat-button.tsx`** is the icon/text button used inside admin chat (`variant`, `size="icon"`).

### Inputs, Textareas, Selects

- **`ui/input.tsx`, `ui/textarea.tsx`**: shadcn-style `Input`/`Textarea` with `border-line bg-ink text-paper`, `focus-visible:outline-accent`, `disabled:opacity-50`, `text-base md:text-sm`.
- **Contact form fields** use their own `inputClasses` (`rounded-lg border-line bg-transparent px-4 py-3`, `focus:border-accent`) defined in `sections/Contact.tsx`.
- **`ui/FormSelectField.tsx`**: labelled optional select built on the Base UI Motion Select (`ui/motion/select.tsx`). Props: `id`, `name`, `label`, `placeholder`, `value`, `options`, `onValueChange`, `error?`, `helperId?`. The trigger is `h-[52px]`, shows a red border on error, and wires `aria-invalid`/`aria-describedby`. A hidden named input is included for `FormData`.
- **`ui/PhoneNumberField.tsx`**: country `<select>` + number input in one bordered row, with helper text and error. Validated with `libphonenumber-js`.
- **`companies/CompanySearchField.tsx`**: Companies House autocomplete (see [Forms](#forms)).
- **`ui/OtpInput.tsx`**: segmented PIN input used by the résumé download modal.
- **`ui/select.tsx`, `ui/switch.tsx`, `ui/checkbox.tsx`, `ui/label.tsx`, `ui/tabs.tsx`**: Radix/shadcn primitives used mainly in admin settings.

### Cards

- **`ui/card.tsx`**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`rounded-xl border-line bg-surface`). Used in admin views.
- **Section cards** (inline in `sections/*`): `rounded-2xl border border-paper/10 bg-paper/[0.02] p-6`, hover `border-paper/20 bg-paper/[0.04]`, plus an accent glow blob and icon lift on hover (`motion-safe:` only).
- **`project/ProjectCard.tsx`, `FeaturedProjectCard.tsx`, `CaseStudyCard.tsx`**: media-topped cards (`aspect-[16/10]`, `aspect-[16/9]`, or `aspect-video`) using `.hover-lift` (`translateY(-4px)`).
- **`contact/ProjectProfileCard.tsx`**: pointer-tilt profile card with holo/glare layers. Tilt is disabled on coarse pointers, under reduced motion, and in high contrast.
- **`comments/CommentCard.tsx`**: testimonial card shown in `CommentsMarquee`.

### Modals and dialogs

- **`ui/dialog.tsx`, `ui/alert-dialog.tsx`, `ui/sheet.tsx`**: Radix primitives with built-in focus trapping.
- **`chat/ConfirmDialog.tsx`**: AlertDialog wrapper (`title`, `description`, `confirmLabel`, `destructive?`, `onConfirm`). Used for "End chat" and "Delete message".
- **`resume/ResumeDownloadModal.tsx`**: portal-based `role="dialog" aria-modal="true"`. It has a manual Tab focus trap, closes on Escape, restores focus to the trigger, and uses a `bg-black/70 backdrop-blur-sm` overlay. Flow: email → OTP → download.
- **`gallery/GalleryLightbox.tsx`**: portal lightbox. Locks body scroll, traps focus, and supports Escape, ←/→, and swipe. Focus returns to the originating panel.
- **`ui/CookiePreferencesModal.tsx`** + **`ui/CookieConsentManager.tsx`**: the consent banner is `role="region"`, fixed bottom, full width on mobile and a centred rounded card from `sm`.

### Accordions

- **`experience/ExperienceAccordionItem.tsx`**: disclosure pattern with the button inside an `h3`, `aria-expanded` + `aria-controls`, and a labelled region. Height animated with framer-motion. `Experience.tsx` keeps one role open at a time.
- **`gallery/AccordionGallery.tsx`**: see [Images and Media](#images-and-media).
- **`ui/collapsible.tsx`**: Radix Collapsible primitive.

### Show More / Show Less

- **`hooks/use-expandable.ts`**: `useExpandable(items, initialVisibleCount)` returns `{ visibleItems, hasMore, expanded, toggle, listId }`. `initialVisibleCount` can be a number or `{ base, sm?, md?, lg? }`. Current settings: Expertise `{4, 6, 8}`, Services/AI/Projects/Case studies `{4, 6, 6}`.
- **`ui/ShowMoreToggle.tsx`**: the single source of wording and a11y: "→ Show more" / "← Show less", `aria-expanded`, `aria-controls`, `aria-label="Show more <label>"`.
- **`ui/ShowMoreButton.tsx`**: pill-styled list-level toggle. After collapsing, scrolls itself back into view.
- **`ui/ExpandableCardDetails.tsx`**: per-card toggle and animated region for extra chips inside one card.

### Navigation

- **`layout/Header.tsx`**, **`layout/MobileNavigation.tsx`**, **`layout/Footer.tsx`**: see [Layout](#layout).
- **`ui/motion/navigation-menu.tsx`**: Base UI Navigation Menu with an animated highlight.
- **`ui/BackToTopButton.tsx`**: fixed `bottom-6 right-6`, appears after 400px of scroll. Uses literal `black/white` colours.
- **`animate-ui/components/radix/sidebar.tsx`**: admin sidebar. Off-canvas Sheet below 768px, collapsible to icons on desktop.

### Loading indicators

- **`ui/loader.tsx`**: `Loader` with `variant` (`circular`, `classic`, `pulse`, `pulse-dot`, `dots`, `typing`, `wave`, `bars`, `terminal`, `text-blink`, `text-shimmer`, `loading-dots`, `orbit`) and `size` (`sm | md | lg`). `FullPageLoader` renders the `OrbitRingLoader` (`role="status"` + sr-only label).
- **`ui/skeleton.tsx`**: `animate-pulse rounded-md bg-surface`.
- **`chat/ChatLoadingIndicator.tsx`**: Ripple animation with a static dot under reduced motion. `standalone={false}` suppresses a duplicate live region.
- **`loading-ui/pulse-dot.tsx`**, **`loading-ui/ripple.tsx`**: small animated primitives.

### Toasts, alerts, and status

- **`ui/sonner.tsx`**: global `<Toaster />`, mounted once in the root layout. Call `toast()` from `sonner`.
- **`ui/alert.tsx`**: `Alert` (`role="alert"`), variants `default | destructive`.
- **`ui/badge.tsx`**: `default | secondary | destructive | outline`.
- **`ui/ErrorState.tsx`**: full-page state for `not-found | connection | unauthorized`, with Go Home / Go Back / Try Again actions.
- **`ui/OfflineStatus.tsx`**: listens for the `offline` event and overlays `ErrorState kind="connection"`.

### Upload controls

- **`ui/FileUploadField.tsx`**: contact-form upload (see [Forms](#forms)).
- **`chat/PendingAttachment.tsx`**, **`chat/MessageAttachment.tsx`**: chat attachment preview/progress and sent-attachment rendering.

### Theme, language, and accessibility controls

- **`theme-toggle.tsx`**, **`ui/animated-theme-toggler.tsx`**: see [Themes](#themes).
- **`layout/LanguageSelector.tsx`**: Base UI Select with a `Globe2` icon. Props: `mobile?` (full width, centred popup). `aria-label="Language: …"` and `aria-busy` while translating. Each option carries its own `lang` and `dir`.
- **`ui/AccessibilityControls.tsx`**: fixed bottom-left "Accessibility options" button that opens a panel with High contrast (`aria-pressed`), text size A−/A/A+, Bold text, and Reset. Settings persist in `localStorage` (`accessibility-settings-v1`) and apply as `data-*` attributes on `<html>`. Changes are announced in a polite live region.

### Live Chat and Admin Chat

Covered in detail in [Live Chat Design](#live-chat-design). Components: `live-chat/*` (visitor) and `chat/*` (admin, with some shared pieces such as `TypingIndicator`, `MessageAttachment`, `PendingAttachment`, `ConfirmDialog`).

### Decorative and text-effect components

`magicui/glyph-matrix-background.tsx`, `ui/AnimatedBackground.tsx`, `ui/BorderGlow.tsx`, `ui/GradientText.tsx` (`variant="button"` for CTA text), `ui/DecryptedText.tsx`, `ui/TextType.tsx`, `ui/TrueFocus.tsx`, `ui/HeadingHighlighter.tsx`, `magicui/highlighter.tsx`, `ui/highlighter.tsx`, `magicui/marquee.tsx`, `ui/ScrollVelocityText.tsx`, `ui/icon-cloud.tsx`, `ui/terminal.tsx`, `ui/UKGreeting.tsx`, `weather/WeatherWidget.tsx`. Treat these as presentation only. They should never be the only carrier of meaning.

## Forms

### Contact / enquiry form (`sections/Contact.tsx`)

| Field | Required | Control |
| --- | --- | --- |
| Name | Yes | text input, `autoComplete="name"` |
| Email | Yes | email input, pattern-checked on submit |
| Mobile number | Optional | `PhoneNumberField` (country + number) |
| Company | Optional | `CompanySearchField` |
| Budget | Optional | `FormSelectField` with fixed ranges (`BUDGET_OPTIONS` in `lib/contact/validation.ts`, from "Not sure yet" to "£25,000+") |
| Project type | Optional | `FormSelectField` |
| Attachment | Optional | `FileUploadField` |
| Message | Yes | textarea, 2,000-character limit (`MESSAGE_MAX_CHARS`) |

- **Required vs optional:** labels read "(required)" (hidden from AT via `aria-hidden`, since inputs carry `required`) or "(optional)" in `text-xs`.
- **Validation:** client-side on submit (`noValidate` on the form), then server-side (zod). Server field errors come back as `error.fields` and render under the matching field. The message field also validates on blur.
- **Error messages:** `<p id="<field>-error" role="alert" class="mt-2 text-sm text-red-300">`, linked via `aria-describedby`, with `aria-invalid` on the control. A form-level message ("Please correct the highlighted fields below.") appears under the submit button and receives focus.
- **Focus states:** contact inputs switch to `border-accent` on focus. Other controls use the global `:focus-visible` accent outline.
- **Message limit:** a live counter shows "`n / 2,000 characters · n characters left`" (stacked on mobile). It turns `amber-400` in the last 200 characters and `red-300` with "⚠ Limit reached" at the limit. Input is clamped. Screen readers are told only when the warning or limit threshold is crossed, not on every keystroke.
- **Company autocomplete:** a combobox (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, listbox of `role="option"`). It searches after 2 characters with a 300ms debounce and supports ↑/↓/Enter/Escape. Matches are highlighted with `<mark class="bg-accent/30">`. A spinner shows in the input while loading, with "Searching companies..." in the list. Active/dissolved status badges are shown, and a "Can't find your company? Enter … manually" option is always offered. A selected company becomes a summary card with a clear button.
- **File upload:** a dashed drop zone (click or drag), PDF/DOCX/PNG/JPG/JPEG up to 5 MB, validated before upload. The file uploads straight to Blob storage with real progress (`Progress` bar with %), and can be cancelled while uploading or removed after. States: idle → uploading (accent bar) → success (emerald, "Upload complete") or error (red). Progress is announced via an sr-only live region.
- **Disabled / loading:** the submit button is disabled while submitting or while an attachment is uploading, and its label becomes "Sending…". A polite status line reads "Sending your message…".
- **Submit feedback:** on success the form is replaced by a `role="status"` "Thank you" panel whose heading receives focus, echoing the attached file name if there was one.

### Other forms

- **Live chat registration** (`live-chat/CandidateRegistration.tsx`): Full Name, Email Address, Mobile Number, Company Name, with inline `text-xs text-red-400` errors and a full-width accent submit.
- **Auth forms** (`auth/SignInForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`) and admin settings tabs follow the same label / `aria-invalid` / `role="alert"` pattern.
- **Résumé download** uses email + `OtpInput`.

## Live Chat Design

### Visitor Live Chat (`src/components/live-chat/`)

- **Loading:** `LiveChatLoader` loads `LiveChat` client-side only via `next/dynamic`.
- **Launcher** (`LiveChatLauncher.tsx`): a 52px accent circle fixed bottom-right, stacked above Back to Top using the offsets in `live-chat/layout.ts`, which respect safe-area insets.
  - A small status dot shows the connection: emerald = online, amber = connecting/reconnecting, red = offline/error.
  - An unread badge (`bg-red-500`, "9+" cap) appears when messages arrive while the panel is closed or minimised, along with an `animate-ping` attention ring (hidden under reduced motion).
  - The `aria-label` includes the connection status and unread count.
- **Panel states:** `closed` → `open` → `minimised`. Escape minimises and returns focus to the launcher, and opening focuses the panel's close button. The panel is `role="dialog" aria-modal="false"` so the page stays usable.
- **Registration first:** until the visitor has an identity, the panel shows `CandidateRegistration`. The socket connects only after registration, so the launcher shows "offline" until then.
- **Header:** "Live Chat" title, a connection status line (`role="status"`), "End chat" (opens a confirm), Minimise, and Close.
- **Presence banner** (`PresenceBanner.tsx`): always visible under the header and shows Dominic's availability as a word plus a detail line. States are Online (emerald, pulsing), Away (amber), Busy (red), and Offline (muted).
- **Messages:** visitor bubbles are right-aligned `bg-accent`. Assistant/admin bubbles are left-aligned `border-line bg-ink`. Deleted messages render as a dashed italic "Message deleted". Each message animates in (opacity/y, off under reduced motion). The scroll area is `aria-live="polite" aria-relevant="additions"` and auto-scrolls only if the reader was already near the bottom (80px). Bot messages can carry action chips (outlined accent pills) that scroll to a section, open the résumé modal, or open external links.
- **Per-message status (visitor messages):**

  | State | Icon | Text |
  | --- | --- | --- |
  | Sending | Clock | "Sending…" |
  | Sent | Check | — |
  | Delivered | CheckCheck | — |
  | Read | CheckCheck (accent) | — |
  | Failed | AlertCircle (red) | "Failed — Retry in the notification" |

- **Typing:** `TypingIndicator` shows "Dominic is typing…" in a bubble with the Ripple animation.
- **Offline / reconnecting:** an amber composer note: "Reconnecting… your messages will send once you're back online."
- **Composer:** auto-growing textarea (max 96px, 2,000 characters). Enter sends on fine pointers, while on touch devices Enter inserts a newline. The draft is saved to `sessionStorage` per conversation. There is a 44px attach button and a 44px send button (disabled when empty).
- **Attachments:** PDF/DOC/DOCX/PNG/JPG/JPEG/TXT up to 5 MB, validated before upload. `PendingAttachment` shows progress and a remove button. Sent images render as an inline preview (max 240×192) and other files as a download chip.
- **Closed conversation:** the composer is replaced by `PostChatPanel`, which offers "Download transcript" and a 1–5 star rating (`role="radiogroup"` of `role="radio"` buttons) with optional feedback. It confirms with "Thanks for your feedback."
- **Mobile:** the panel is full width minus 32px, up to 70dvh tall, and shifts above the iOS on-screen keyboard (`useKeyboardInset`). Header controls are 44px targets.

### Admin Chat (`src/components/chat/`, route `/admin/chat`)

- **Shell:** `AdminShell` provides a collapsible sidebar (icon rail on desktop, Sheet on mobile with a top bar and trigger below `md`). `AdminChatNotifications` is mounted there, so it runs on every admin page.
- **Header:** at `md`+, "Admin Chat" plus `ConnectionStatus` (Connected / Connecting… / Reconnecting… with a spinning icon under `motion-safe` / Offline / Session expired / Unable to authenticate). `ConnectionBanner` adds a full-width strip whenever the connection is not online.
- **Conversation list** (`ConversationList.tsx`):
  - Search box (250ms debounce) and filter tabs (All / Waiting / Active / Closed) with counts.
  - Results are grouped as **Waiting** (awaiting a reply or unread), **Active**, and **Offline / recent**.
  - Each row (`ConversationItem`) shows an avatar with a presence dot (online emerald, waiting sky, offline muted), name, time, contact line, preview, a live **WaitingBadge** ("Waiting 30 sec", red, re-rendered every 5s client-side), and an **UnreadBadge**. Rows have a full descriptive `aria-label`.
  - Other states: skeleton rows while loading, "Unable to load conversations." with a Retry button on error, and context-specific empty text.
  - A footer shows the signed-in admin and a sign-out icon button.
- **Thread:**
  - `ChatHeader`: back button below `md`, avatar and contact from `sm`, actions menu including a Details Sheet below 1200px.
  - `MessageList`: `role="log"`, stick-to-bottom scrolling with a scroll-to-bottom button, date separators, and grouped runs that hide repeated sender labels.
  - `MessageBubble`: admin bubbles right-aligned `bg-accent text-accent-fg`. The per-message actions menu (Copy, Delete with confirm) appears on hover, focus, or tap.
  - `MessageInput`: `PromptInput` with tooltips on attach and send, a 160px max height, and safe-area bottom padding. When the conversation is closed or the connection is down, the textarea stays usable but Send is disabled, with an amber or muted hint.
- **Status icons (admin messages):** Clock for sending, Check for sent/delivered, CheckCheck (`accent3`) for read. Failed shows "Message failed to send. Use Retry in the notification."
- **Empty states:** "Select a conversation" (MessageSquare icon) and "No messages yet".
- **Notifications:** each new visitor message fires a Sonner toast ("New live chat message", name + preview, **Open chat** / **Dismiss** actions). Depending on admin settings it also plays `/sounds/new-message.mp3` and shows a browser notification when the tab is hidden. The document title is prefixed with the total unread count, e.g. `(3) …`. Duplicate events for the same message are ignored.
- **Route loading:** `app/admin/chat/loading.tsx` shows a skeleton of the header, list, and thread.

## Loading States

| Situation | Treatment |
| --- | --- |
| Route/page loading | `app/loading.tsx` → `FullPageLoader` (orbit ring, `role="status"`, "Loading page") |
| Admin chat route | Skeleton layout (`app/admin/chat/loading.tsx`) |
| Lazy client components | `next/dynamic` with `ssr: false` for Live Chat and the gallery lightbox. Nothing renders until loaded |
| Button loading | Contact submit label becomes "Sending…" and the button is disabled. Other forms follow a `submitting` / `disabled` pattern |
| Upload progress | Base UI `Progress` with a percentage, driven by real upload progress |
| Autocomplete | Inline spinner (`Loader2 animate-spin`) + "Searching companies..." row after a 300ms debounce |
| Lists | `Skeleton` rows (conversation list, message list) |
| Images | Gallery panels show a pulsing placeholder until `onLoad`, then fade in |
| Chat connection | Launcher dot, header status text, presence banner, admin `ConnectionStatus` / `ConnectionBanner` |
| Chat awaiting reply | `TypingIndicator` with `ChatLoadingIndicator` |

Debounces (search/autocomplete) are the only intentional delays. No component waits before showing a spinner.

## Feedback and Notifications

- **Success:** inline and in place. Examples: the contact "Thank you" panel (focused, `role="status"`), "Upload complete" in emerald, "Thanks for your feedback."
- **Errors:** field-level `role="alert"` text in red with `aria-invalid`, form-level messages that receive focus, `Alert variant="destructive"`, full-page `ErrorState` for 404/connection/unauthorized, and `OfflineStatus` as an overlay when the browser goes offline.
- **Warnings:** amber text for the message limit, reconnecting, and "Away" presence. Amber `TriangleAlert` for list load failures.
- **Toasts:** Sonner is currently used only by `AdminChatNotifications` (new chat message popups). Visitor-facing flows use inline feedback, not toasts.
- **Confirmation:** destructive or irreversible actions (end chat, delete message) go through `ConfirmDialog`.
- **Realtime chat:** unread badges (launcher, conversation rows, admin sidebar), an attention pulse, toasts, sound, browser notifications, and the tab-title count.

## Accessibility

What is implemented today:

- **Semantic HTML:** `header`/`nav`/`main#main`/`footer`/`section`/`article`/`aside`. The page title is an `h1` (Hero on the home page, `LegalPage`/`ErrorState` elsewhere), and each home section uses an `h2` via `SectionHeading`. Footer navs are labelled by headings.
- **Skip link:** `.skip-link`, hidden off-screen until focused, jumps to `#main`.
- **Keyboard:**
  - All controls are native buttons, links, or inputs, or Radix/Base UI primitives.
  - The gallery supports arrow keys between panels, and Enter on the active panel opens the lightbox.
  - The lightbox and résumé modal trap Tab and close on Escape. Escape also minimises Live Chat.
  - The company combobox supports ↑/↓/Enter/Escape.
  - Focus returns to the invoking control when overlays close.
- **Focus indicators:** global `:focus-visible { outline: 2px solid accent; outline-offset: 3px }`, and many components repeat `focus-visible:outline-accent`. High contrast mode uses a 3px yellow outline with a double ring.
- **ARIA:**
  - State attributes: `aria-expanded`/`aria-controls` (menu, accordions, Show more), `aria-pressed` (gallery panels, a11y toggles), `aria-current` (nav), `aria-invalid` + `aria-describedby` (fields), `aria-busy` (language switch).
  - Chat semantics: `role="log"` / `aria-live` for chat, `role="radiogroup"` for ratings.
  - Hidden decoration: decorative icons and effects are `aria-hidden`.
- **Form labels:** every input has a `<label htmlFor>` or, where the visible label is elsewhere, an `sr-only` label or `aria-label`.
- **Icon-only buttons:** always have an `aria-label` (theme, menu, minimise/close chat, attach, send, gallery prev/next, remove file, sign out).
- **Screen-reader announcements:** polite live regions for upload progress, character-limit thresholds, connection/presence changes, typing, accessibility-setting changes, and gallery position ("3 / 8").
- **Touch targets:** most interactive controls are `min-h-11` / `h-11 w-11` (44px).
- **Reduced motion:**
  - `globals.css` sets animation and transition durations to ~0 and disables smooth scroll under `prefers-reduced-motion: reduce`.
  - Components also check `useReducedMotion()` (framer-motion) or `matchMedia` to skip JS-driven motion (GSAP, View Transitions, scroll behaviour, tilt).
- **User display preferences:** high contrast, text size, and bold text (see [Components](#theme-language-and-accessibility-controls)).
- **RTL:** `dir` switches for Arabic, and language options carry `lang`/`dir`.
- **Automated checks:** `tests/accessibility.spec.ts` runs axe (`@axe-core/playwright`) on `/`, `/accessibility`, and a 404 route in Desktop Chrome, expecting zero violations. It also covers the 404 page, offline state, and persistence of accessibility preferences. Run it with `npm run test:accessibility`.

**Colour contrast:** tokens were tuned per theme (the comments in `tailwind.config.mts` and `globals.css` explain the `accent-fg`/`cta` flips). Beyond the axe run above, there is no documented manual contrast audit. The site states no WCAG conformance level, and none should be claimed without a manual audit.

## Animation and Motion

- **Shared easing and variants:** `src/lib/animations.ts` exports `EASE = [0.22, 1, 0.36, 1]` and the variants `fadeUp`, `fadeIn`, `titleReveal`, `staggerContainer`, and `projectReveal`.
- **Scroll reveal:** `ui/MotionReveal.tsx` (`whileInView`, once, 20% visible) wraps most section content. It renders a plain element under reduced motion.
- **Hero:** headline lines rise and un-blur in sequence, with `DecryptedText` scrambling in. The portrait slowly scales to 1.015 over 16s.
- **Transitions:**
  - A global 150ms colour transition applies to `body`, controls, and any element with `bg-`/`text-`/`border-` classes, so theme changes cross-fade.
  - The theme toggle uses a circular View Transitions reveal (400ms).
- **Hover effects:**
  - Glass cards brighten their border and background, lift and rotate their icon (`motion-safe:`), and nudge their arrow.
  - `.hover-lift` raises project cards by 4px.
  - Show more arrows slide, and buttons change colour.
- **Card effects:** `.border-glow` (conic gradient spinning in 7s), `ProjectProfileCard` pointer tilt with holo and glare, and `AnimatedBackground` floating blobs (20–25s loops).
- **Expand/collapse:** framer-motion height/opacity at 0.28–0.3s for `ExpandableCardDetails`, grid items leaving on Show less, the mobile menu, and experience accordions.
- **Gallery:** GSAP animates panel `flex-basis` (0.48s, `power3.out`), and images fade from 50% grayscale to colour on activation.
- **Chat:** messages fade and slide in (0.18s), and the panel opens with opacity/y (0.22s). Typing uses the SVG `Ripple`. Other chat motion includes the `animate-ping` presence pulse and launcher attention ring, and the launcher's `hover:scale-105`.
- **Loaders:** Tailwind keyframes in `tailwind.config.mts` (`typing`, `loading-dots`, `wave`, `blink`, `text-blink`, `bounce-dots`, `thin-pulse`, `pulse-dot`, `wave-bars`, `shimmer`, `spinner-fade`, `marquee`) and `.orbit-ring` in `globals.css`.
- **Marquee:** testimonials scroll continuously and pause on hover.
- **Motion preferences:** see [Accessibility](#accessibility). New animation must respect both the CSS override and `useReducedMotion()` (or `motion-safe:` / `motion-reduce:` utilities). The CSS override alone does not stop JS or SMIL animation.

## Images and Media

- **`next/image` everywhere** except user-uploaded chat attachments (plain `<img>`, since they are remote blob URLs).
- **Remote images:** `next.config.ts` allows only the project's Cloudinary path. Formats are AVIF/WebP, and `qualities` are 75 and 80. The gallery uses a custom `loader` (`lib/cloudinaryImage.ts`) to request Cloudinary transforms at the needed width.
- **`sizes` is always set:** the hero uses `(min-width: 1024px) 48vw, 100vw`. The gallery requests the expanded size for every panel up front (see the comment in `AccordionGallery.tsx` about Safari not re-evaluating `srcset`).
- **Priority:** only the hero portrait and the gallery's default panel (index 2) are `priority`. Everything else is lazy.
- **Aspect ratios:** project cards `aspect-[16/10]`, case studies `aspect-[16/9]` or `aspect-video`, profile card `aspect-ratio: 0.718`. Gallery panels fill the container height with `object-fit: cover` and a per-item `objectPosition`.
- **Accordion Gallery** (`gallery/AccordionGallery.tsx` + `.css`): a row of `<button>` panels on desktop and a vertical stack on tablet/mobile. Hover (fine pointers only), focus, or click selects a panel, and selecting the active panel again opens `GalleryLightbox`. Prev/next buttons and a live "n / total" counter sit below.
- **Unused gallery components:** `gallery/GallerySlider.tsx` (Embla) and `gallery/Lightbox.tsx` exist but are not mounted anywhere.
- **Uploaded attachments:** contact uploads are shown as a file card (name, type, size), not a preview. Chat image attachments are previewed inline and link to the full file. Other chat attachment types are shown as download chips.

## Icons

- **`lucide-react`** is the default icon set (≈56 import sites): UI actions, status, chat, and form states. Size with Tailwind (`h-4 w-4`, `h-5 w-5`) or the `size` prop (`size={18}`, `size={22}` with `strokeWidth={1.7}` in section cards).
- **`react-icons`** is limited to brand and technology logos (`react-icons/si`, `fa6`, `tb`) in `data/fullStackTech.tsx` and `contact/ProjectProfileCard.tsx`.
- **Custom SVGs:** `icons/SocialIcons.tsx` (GitHub, LinkedIn) and `project/GithubIcon.tsx`.
- **Conventions:**
  - Decorative icons get `aria-hidden="true"`, and the parent control carries the accessible name.
  - Status icons that stand alone get an `aria-label` (e.g. message-status ticks).
  - Icons inherit colour via `currentColor`. Use token text classes (`text-muted`, `text-accent`).
  - Section/category icons are data-driven (`category.icon` in `data/skills.ts`, `data/services.ts`, `data/aiServices.ts`).

## Spacing and Sizing

These are the recurring Tailwind values. There is no separate spacing token system.

| Context | Convention |
| --- | --- |
| Page gutters | `px-6 sm:px-8 lg:px-10` (via `Container`) |
| Section padding | `py-28 sm:py-36`, `scroll-mt-24` |
| Section internals | heading → `mt-8` intro → `mt-16` grid → `mt-8` Show more → `mt-24` sub-section |
| Cards | `p-6`, `rounded-2xl`, grid gaps `gap-4` / `sm:gap-6` / `md:gap-8` |
| Chips/tags | `rounded-full px-3 py-1` (`py-1.5` in Expertise), `gap-2` |
| Forms | fields `space-y-5`, paired rows `gap-5`, label `mb-2`, helper `mt-1.5`, error `mt-2`, inputs `px-4 py-3` |
| Buttons | primary/secondary `px-6 py-3.5`, CVA buttons `px-5 py-2.5`, icon buttons `h-11 w-11` |
| Navigation | bar `h-16`, desktop links `px-2.5 py-2`, mobile items `min-h-11 py-3` |
| Chat panel | header `px-4 py-3`, body `px-4 py-4 space-y-3`, composer `px-3 py-3`, bubbles `px-4 py-2.5 rounded-2xl` |
| Radii | `rounded-full` (buttons, chips, icon buttons), `rounded-2xl` (cards, chat panel, popovers), `rounded-lg` (inputs, a11y panel options), `rounded-md` (shadcn inputs, badges) |
| Z-index | header `z-[60]`, floating controls `z-50`, chat panel / modals / cookie banner `z-[100]`, offline overlay `z-[110]` |

## UI States

| State | Convention |
| --- | --- |
| Default | Token colours: `text-paper` / `text-muted`, `border-line` |
| Hover | Borders → `border-accent/60` or `border-paper/20`, text → `text-paper` / `text-accent`, glass bg → `bg-paper/[0.04]`, primary button → `bg-accent` |
| Focus | `:focus-visible` 2px accent outline, offset 3px (components may use offset 2) |
| Active | Nav `bg-accent/10 text-accent` + `aria-current`, pressed toggles `aria-pressed`, `active:scale-[0.97]` on Show more (`motion-reduce:active:scale-100`) |
| Disabled | `disabled:opacity-60` (buttons) / `opacity-50` (inputs) / `opacity-40` (chat icon buttons), plus `cursor-not-allowed` |
| Loading | Label swap ("Sending…"), spinner, skeleton, or progress bar, with a `role="status"` announcement |
| Error | Red text/border, `aria-invalid`, `role="alert"` |
| Success | Emerald icon/text, or a replacement success panel with focus moved to it |
| Empty | Centred muted icon + `text-paper` title + `text-muted` explanation (admin chat, message list, conversation filters) |
| Offline | Full-screen `ErrorState` overlay (site), status dots + amber/red text (chat), `ConnectionBanner` (admin) |

## Design File Structure

```text
tailwind.config.mts            Colour tokens, fonts, max-w-content, keyframes, darkMode selector
postcss.config.mjs
components.json                shadcn CLI config + registries
src/
  app/
    globals.css                Theme variables, light/high-contrast overrides, reduced motion,
                               focus ring, bespoke effects (.border-glow, .orbit-ring,
                               .gradient-text, .profile-card-*, .hover-lift, .skip-link)
    layout.tsx                 Fonts, ThemeProvider, Toaster, TooltipProvider, LocaleProvider
    loading.tsx, error.tsx, not-found.tsx
    (site)/                    Public pages + site layout (Header/Footer/overlays)
    (auth)/                    Sign-in layout
    admin/                     Admin pages + AdminShell layout
  components/
    ui/                        Primitives (shadcn/Radix-based lowercase files) and
                               project components (PascalCase files)
    ui/motion/                 Base UI + motion wrappers (select, progress, navigation-menu)
    animate-ui/                Animate UI registry components (sidebar, sheet, tooltip, checkbox)
    magicui/                   Magic UI registry components (glyph matrix, highlighter, marquee)
    loading-ui/                Ripple, PulseDot
    layout/                    Header, MobileNavigation, Footer, LanguageSelector
    sections/                  Home page sections
    gallery/                   AccordionGallery (+ .css), GalleryLightbox, unused slider/lightbox
    live-chat/                 Visitor chat widget
    chat/                      Admin chat (and shared chat pieces)
    admin/                     AdminShell, notifications, settings, devices, account, comments
    contact/, companies/, project/, experience/, comments/, resume/, auth/, weather/, icons/
    theme-provider.tsx, theme-toggle.tsx
  hooks/                       use-expandable, use-keyboard-inset, use-mobile, use-live-chat, …
  lib/
    animations.ts              Shared motion variants
    utils.ts                   cn()
    cloudinaryImage.ts         Image loader
  data/                        Content arrays driving sections (skills, services, projects, gallery, navigation)
  i18n/                        Locale config + runtime translation provider
tests/accessibility.spec.ts    Playwright + axe
__tests__/components/          React Testing Library component tests
```

## Adding a New Component

1. **Location.** Put generic primitives in `src/components/ui/` and feature-specific pieces in the matching feature folder. If you pull something from a configured registry via the shadcn CLI, restyle it with project tokens. `components.json` sets `cssVariables: false`, so generated `bg-background` / `text-foreground` style classes will not resolve.
2. **TypeScript.**
   - Type props explicitly: an exported `interface XProps` or an inline object type.
   - Extend native props (`React.ComponentProps<"button">`) when wrapping an element.
   - Use `forwardRef` (or React 19 ref-as-prop) when a parent needs the DOM node.
   - Use string-literal unions for variants and CVA when there are several.
3. **Styling.**
   - Use Tailwind utilities with semantic tokens only (`ink`, `surface`, `line`, `paper`, `muted`, `accent*`, `cta`).
   - Accept `className` and merge with `cn()`.
   - Put CSS in `globals.css` (or a co-located `.css`, as the gallery does) only for effects Tailwind can't express, and add the matching `html[data-theme="light"]` and `html[data-high-contrast="true"]` rules.
4. **Responsive.**
   - Start from mobile and add `sm`/`md`/`lg`/`xl` as needed.
   - Keep touch targets at `min-h-11` / `h-11 w-11`.
   - Test long text with `min-w-0`, `truncate`, and `break-words`.
   - For fixed elements, account for safe-area insets and the existing fixed controls (Back to Top, Live Chat launcher, Accessibility options, cookie banner).
5. **Accessibility.**
   - Use native elements or Radix/Base UI primitives.
   - Label every control, especially icon-only ones.
   - Expose state with ARIA.
   - Announce async results with `role="status"` / `role="alert"`.
   - Manage focus on open and close.
   - Mark decoration `aria-hidden`.
   - Never rely on colour alone. The presence banner pairs colour with a word, for example.
6. **Motion.** Use `lib/animations.ts` variants or `MotionReveal`, guard JS animation with `useReducedMotion()`, and prefer `motion-safe:` for hover transforms.
7. **Dark mode.** Tokens handle most of it. Check both themes and high contrast. Avoid literal `white`/`black` except on fixed-dark image overlays.
8. **Testing.** Add a React Testing Library test under `__tests__/components/` (Jest + jsdom, see `jest.setup.ts`) that queries by role and accessible name. For new public pages, consider adding the path to `tests/accessibility.spec.ts`.
9. **Reuse.** Check `ui/` before building. `Button`, `Container`, `SectionHeading`, `MotionReveal`, `ShowMoreButton`/`useExpandable`, `FormSelectField`, `FileUploadField`, `ConfirmDialog`, `Skeleton`, and `Loader` already cover most needs.

## Design QA Checklist

Before merging a UI change:

- [ ] Mobile verified (≈375px, including a short viewport ≤ 700px tall)
- [ ] Tablet verified (≈768px, and just below `xl`, 1279px, where navigation switches)
- [ ] Desktop verified (≥ 1280px)
- [ ] Light theme verified
- [ ] Dark theme verified
- [ ] High contrast, large text, and bold text (Accessibility options) verified
- [ ] Reduced motion verified (OS setting)
- [ ] Keyboard navigation verified (Tab order, Escape, arrow keys where applicable)
- [ ] Focus states visible
- [ ] Form validation verified (required, invalid, server errors)
- [ ] Loading states verified
- [ ] Error, empty, and offline states verified
- [ ] No layout overflow or horizontal scroll, and no overlap with fixed controls (chat launcher, Back to Top, Accessibility options, cookie banner)
- [ ] RTL checked if the change affects layout direction (`/ar`)
- [ ] No console errors or hydration warnings
- [ ] Lint passes: `npm run lint`
- [ ] Type checking passes: `npx tsc --noEmit`
- [ ] Tests pass: `npm test` and `npm run test:accessibility`
- [ ] Production build passes: `npm run build`

## Maintenance

Update `DESIGN.md` in the same pull request whenever you change any of these:

- colour or font tokens, theme mechanics, or high-contrast rules
- breakpoints or layout primitives (`Container`, section spacing)
- shared components listed here, or new reusable components
- interaction patterns (Show more, modals, chat states, notifications)
- accessibility behaviour or motion rules

Keep this file about UI, UX, and visual architecture. Setup, environment, data, and deployment details belong in [README.md](README.md).
