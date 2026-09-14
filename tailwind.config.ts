import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090909",
        surface: "#111111",
        line: "rgba(255,255,255,0.10)",
        accent: "#5b8def",
        accent2: "#8b7bf0",
        accent3: "#6ee7ff",
        muted: "#a3a3a3",
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
