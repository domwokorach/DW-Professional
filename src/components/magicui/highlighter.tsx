"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HighlighterProps {
  children: ReactNode;
  className?: string;
  /** "highlight" draws a soft marker block behind the text, "underline" draws a line beneath it. */
  action?: "highlight" | "underline";
  animationDuration?: number;
}

export function Highlighter({
  children,
  className,
  action = "highlight",
  animationDuration = 500,
}: HighlighterProps) {
  const reduceMotion = useReducedMotion();

  const markInitial = reduceMotion
    ? false
    : action === "highlight"
      ? { scaleX: 0, opacity: 0 }
      : { scaleX: 0 };
  const markAnimate =
    action === "highlight" ? { scaleX: 1, opacity: 1 } : { scaleX: 1 };

  return (
    <span className={cn("relative inline-block", className)}>
      <motion.span
        aria-hidden="true"
        initial={markInitial}
        animate={markAnimate}
        transition={{ duration: animationDuration / 1000, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left center" }}
        className={cn(
          "pointer-events-none absolute",
          action === "highlight"
            ? "inset-x-[-0.3em] inset-y-[-0.15em] -z-10 rounded-md bg-accent/15 ring-1 ring-inset ring-accent/30"
            : "inset-x-0 -bottom-[0.15em] -z-10 h-[2px] rounded-full bg-accent"
        )}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
