import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "var(--color-line)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        accent2: "rgb(var(--color-accent2) / <alpha-value>)",
        accent3: "rgb(var(--color-accent3) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        // Adaptive "glass" white: literal white on the dark page, an
        // inverted near-black tint on the light page. Use for any card,
        // border, or text that was previously hard-coded to `white` but
        // needs to sit on the page background (not on a fixed-dark image
        // overlay — those should keep literal `white`/`black`).
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        // Foreground for content sitting on an `accent`-coloured surface
        // (badges, solid accent buttons, chat bubbles). Accent itself gets
        // darker/more saturated in light mode, so its paired foreground
        // must flip from dark ink to white to keep contrast.
        "accent-fg": "rgb(var(--color-accent-fg) / <alpha-value>)",
        // Solid "inverted" CTA surface + its foreground: bright on the
        // dark page, dark on the light page, always contrasting with the
        // page background.
        cta: "rgb(var(--color-cta) / <alpha-value>)",
        "cta-fg": "rgb(var(--color-cta-fg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: {
        content: "1280px",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, transparent, rgba(9,9,9,0.95) 88%)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        typing: {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(-2px)", opacity: "1" },
        },
        "loading-dots": {
          "0%, 100%": { opacity: "0" },
          "50%": { opacity: "1" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.6)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "text-blink": {
          "0%, 100%": { color: "#ffffff" },
          "50%": { color: "#a3a3a3" },
        },
        "bounce-dots": {
          "0%, 100%": { transform: "scale(0.8)", opacity: "0.5" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        "thin-pulse": {
          "0%, 100%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.05)", opacity: "0.4" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.5)", opacity: "1" },
        },
        "wave-bars": {
          "0%, 100%": { transform: "scaleY(1)", opacity: "0.5" },
          "50%": { transform: "scaleY(0.6)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
        "spinner-fade": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee var(--duration) linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
