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
    },
  },
  plugins: [],
};

export default config;
