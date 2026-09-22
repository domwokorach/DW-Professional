"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import ShowMoreToggle from "@/components/ui/ShowMoreToggle";

export interface ShowMoreButtonProps {
  expanded: boolean;
  onToggle: () => void;
  /** id of the element (list/grid) this control expands and collapses. */
  controls: string;
  /** Noun describing the collection, e.g. "technology categories". Used only for the accessible name. */
  label: string;
  className?: string;
}

export default function ShowMoreButton({
  expanded,
  onToggle,
  controls,
  label,
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
    <ShowMoreToggle
      ref={buttonRef}
      expanded={expanded}
      onToggle={handleClick}
      controls={controls}
      label={label}
      className={cn(
        "rounded-full border border-line px-6 py-3 text-paper",
        "hover:border-accent/60 hover:bg-paper/[0.04] hover:text-paper",
        "focus-visible:outline-offset-4",
        className
      )}
    />
  );
}
