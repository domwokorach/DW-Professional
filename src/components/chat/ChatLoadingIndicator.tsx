"use client";

import { useReducedMotion } from "framer-motion";
import { Ripple } from "@/components/loading-ui/ripple";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

/**
 * Shared loading indicator for async chat states (typing, awaiting a
 * response, etc). Wraps the Ripple primitive with a fixed, clipped size so
 * it never grows the message bubble, a static dot fallback for
 * `prefers-reduced-motion` (the Ripple's SMIL `<animate>` tags ignore CSS
 * animation overrides), and accessible status semantics.
 */
export default function ChatLoadingIndicator({
  label = "Loading",
  size = "md",
  /** Set false when an ancestor already exposes an aria-live status with
   * equivalent text, to avoid a duplicate screen-reader announcement. */
  standalone = true,
  className,
}: {
  label?: string;
  size?: keyof typeof SIZE_CLASSES;
  standalone?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <span
      {...(standalone
        ? { role: "status" as const, "aria-live": "polite" as const }
        : { "aria-hidden": true })}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden text-accent",
        SIZE_CLASSES[size],
        className
      )}
    >
      {reduceMotion ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      ) : (
        <Ripple className="h-full w-full" aria-hidden="true" />
      )}
      {standalone ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
