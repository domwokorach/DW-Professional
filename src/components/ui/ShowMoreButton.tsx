"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ShowMoreButtonProps {
  expanded: boolean;
  onToggle: () => void;
  /** id of the element (list/grid) this control expands and collapses. */
  controls: string;
  /** Noun describing the collection, e.g. "technology categories". Used only for the accessible name. */
  label: string;
  showMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
}

export default function ShowMoreButton({
  expanded,
  onToggle,
  controls,
  label,
  showMoreLabel = "Show More",
  showLessLabel = "Show Less",
  className,
}: ShowMoreButtonProps) {
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const wasExpanded = expanded;
    onToggle();

    if (wasExpanded) {
      // Collapsing removes content above the fold of the viewport's remaining
      // scroll position, so gently bring the control back into view once the
      // collapse animation has had time to settle instead of leaving the
      // page scrolled to empty space.
      const delay = reduceMotion ? 0 : 300;
      window.setTimeout(() => {
        buttonRef.current?.scrollIntoView({
          block: "nearest",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }, delay);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${expanded ? showLessLabel : showMoreLabel} ${label}`}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-white",
        "transition-all duration-200 hover:border-accent/60 hover:bg-white/[0.04]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "active:scale-[0.97]",
        className
      )}
    >
      <span>{expanded ? showLessLabel : showMoreLabel}</span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "h-4 w-4 text-muted transition-transform duration-300 ease-out group-hover:text-accent motion-reduce:transition-none",
          expanded && "-rotate-180"
        )}
      />
    </button>
  );
}
