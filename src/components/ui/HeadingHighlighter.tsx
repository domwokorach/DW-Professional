"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Highlighter } from "@/components/ui/highlighter";

/**
 * Shared Magic UI Highlighter preset for section headings.
 *
 * Centralising the config here (rather than passing props at every call
 * site) is what keeps the highlight consistent across every heading and
 * lets it be retuned in one place.
 */
const HIGHLIGHT_COLOR = {
  dark: "rgba(91, 141, 239, 0.32)",
  light: "rgba(29, 78, 216, 0.18)",
} as const;

export default function HeadingHighlighter({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const color = mounted && resolvedTheme === "light" ? HIGHLIGHT_COLOR.light : HIGHLIGHT_COLOR.dark;

  return (
    <Highlighter
      action="highlight"
      color={color}
      strokeWidth={1.25}
      padding={3}
      iterations={1}
      animationDuration={reducedMotion ? 0 : 900}
      multiline
      isView
    >
      {children}
    </Highlighter>
  );
}
