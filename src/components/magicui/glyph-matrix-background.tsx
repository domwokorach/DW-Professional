"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GlyphMatrix } from "@/components/ui/glyph-matrix";
import { cn } from "@/lib/utils";

interface GlyphMatrixBackgroundProps {
  className?: string;
  cellSize?: number;
  mutationRate?: number;
  interval?: number;
  fadeBottom?: number;
}

const GLYPH_COLOR = {
  dark: "rgba(163, 163, 163, 0.38)",
  light: "rgba(71, 85, 105, 0.28)",
} as const;

function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * Decorative, theme-aware Glyph Matrix background layer.
 *
 * Purely visual (aria-hidden, pointer-events-none) — never place readable
 * content-critical contrast requirements on top of it. Skips the animated
 * canvas entirely under prefers-reduced-motion so it never introduces motion
 * for users who've asked to avoid it. Tracks the `data-theme` attribute set
 * by next-themes (see components/theme-provider.tsx) so the glyph colour
 * follows the same light/dark switch as the rest of the UI.
 */
export default function GlyphMatrixBackground({
  className,
  cellSize = 18,
  mutationRate = 0.025,
  interval = 140,
  fadeBottom = 0.7,
}: GlyphMatrixBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const [theme, setTheme] = useState<"dark" | "light">(readTheme);

  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  if (reduceMotion) return null;

  return (
    <div
      className={cn("glyph-matrix-bg pointer-events-none absolute inset-0 z-0", className)}
      aria-hidden="true"
    >
      <GlyphMatrix
        glyphs="01{}<>/*+=."
        cellSize={cellSize}
        mutationRate={mutationRate}
        interval={interval}
        fadeBottom={fadeBottom}
        color={GLYPH_COLOR[theme]}
      />
    </div>
  );
}
