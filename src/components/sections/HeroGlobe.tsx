"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Client-only: cobe needs a canvas + WebGL, and keeping it out of the server
// render also keeps it out of the hero's initial JS.
const Cobe = dynamic(() => import("@/components/ui/cobe-globe").then((m) => m.Cobe), { ssr: false });

// A single London marker in the accent colour instead of the demo markers.
const MARKERS = [{ location: [51.5074, -0.1278] as [number, number], size: 0.06 }];

// Globe colours per theme, matched to the --color-* tokens in globals.css.
const THEME_COLOURS = {
  dark: { dark: 1, baseColor: "#2a2f3a", markerColor: "#5b8def", glowColor: "#1e2b4d", mapBrightness: 4, diffuse: 1.2 },
  // Light mode: low diffuse keeps cobe's shading from turning the sphere into a grey disc.
  light: { dark: 0, baseColor: "#f8fafc", markerColor: "#1d4ed8", glowColor: "#e2e8f0", mapBrightness: 1.2, diffuse: 0.4 },
} as const;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Release the probe context straight away so it doesn't count against the browser's limit.
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Decorative, slowly rotating globe behind the homepage hero copy
 * (Eldora UI Cobe, "auto-rotation" variant). Purely visual: aria-hidden,
 * pointer-events: none, faded at the edges. Falls back to a static glow when
 * WebGL is unavailable or fails, holds still for reduced-motion users, and
 * only runs while the hero is on screen.
 */
export default function HeroGlobe({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    setWebgl(supportsWebGL());
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.warn("[HeroGlobe] WebGL globe unavailable, showing fallback:", error);
    setFailed(true);
  }, []);

  const colours = THEME_COLOURS[resolvedTheme === "light" ? "light" : "dark"];
  const showGlobe = webgl === true && !failed;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "hero-globe pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[150vw] max-w-[1000px] -translate-x-1/2 -translate-y-1/2 select-none sm:w-[110vw] lg:left-[32%] lg:w-[72vw]",
        className
      )}
    >
      {showGlobe && inView ? (
        <Cobe
          key={resolvedTheme ?? "dark"}
          variant="auto-rotation"
          style={{ maxWidth: "none", width: "100%", height: "100%" }}
          markers={MARKERS}
          markerSize={0.06}
          mapSamples={16000}
          mapBaseBrightness={0.02}
          theta={0.25}
          opacity={1}
          rotationSpeed={reduceMotion ? 0 : 0.0025}
          onError={handleError}
          {...colours}
        />
      ) : webgl === false || failed ? (
        <div className="hero-globe-fallback h-full w-full rounded-full" />
      ) : null}
    </div>
  );
}
