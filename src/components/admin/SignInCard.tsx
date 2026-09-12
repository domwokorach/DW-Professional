"use client";

import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";

const palettes = {
  dark: {
    colorPrimary: "#5b8def",
    colorBackground: "#111111",
    colorInput: "#090909",
    colorInputForeground: "#ffffff",
    colorForeground: "#ffffff",
    colorMutedForeground: "#a3a3a3",
    colorNeutral: "#ffffff",
  },
  light: {
    colorPrimary: "#1d4ed8",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#172033",
    colorForeground: "#172033",
    colorMutedForeground: "#475569",
    colorNeutral: "#172033",
  },
} as const;

function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function SignInCard({ path, fallbackRedirectUrl }: { path: string; fallbackRedirectUrl: string }) {
  const [theme, setTheme] = useState<"dark" | "light">(readTheme);

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <SignIn
      path={path}
      routing="path"
      fallbackRedirectUrl={fallbackRedirectUrl}
      appearance={{
        variables: { ...palettes[theme], borderRadius: "1rem" },
        elements: {
          card: "border border-line shadow-2xl",
          headerTitle: "font-semibold tracking-tight",
        },
      }}
    />
  );
}
