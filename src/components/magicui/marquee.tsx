"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  /** Seconds per loop. Slower (larger) reads as calmer for a testimonials strip. */
  duration?: number;
  /** Gap between items, as a CSS length (e.g. "1.5rem"). */
  gap?: string;
}

/**
 * Magic UI-style marquee: renders `repeat` copies of the content in a flex
 * row/column, each animated by the same CSS `marquee` keyframe (see
 * tailwind.config.ts) so the loop is seamless — as soon as one copy fully
 * scrolls past, an identical one is already in place, with no visible jump.
 * `motion-reduce:` disables the animation outright for prefers-reduced-motion.
 * Touch is handled explicitly (not just `:hover`) so a tap-and-hold on
 * mobile pauses the strip the same way hovering does on desktop.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
  vertical = false,
  repeat = 2,
  duration = 60,
  gap = "1.5rem",
}: MarqueeProps) {
  const [touchPaused, setTouchPaused] = useState(false);

  return (
    <div
      className={cn(
        "group flex overflow-hidden [--duration:60s] [--gap:1.5rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={{ ["--duration" as string]: `${duration}s`, ["--gap" as string]: gap }}
      onTouchStart={() => setTouchPaused(true)}
      onTouchEnd={() => setTouchPaused(false)}
      onTouchCancel={() => setTouchPaused(false)}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            "flex shrink-0 justify-around motion-reduce:animate-none [gap:var(--gap)]",
            vertical ? "animate-marquee flex-col" : "animate-marquee flex-row",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
            reverse && "[animation-direction:reverse]"
          )}
          style={touchPaused ? { animationPlayState: "paused" } : undefined}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
