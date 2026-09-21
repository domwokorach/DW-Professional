"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ShowMoreToggleProps {
  /** Whether the controlled content is currently expanded. */
  expanded: boolean;
  onToggle: () => void;
  /** id of the element this control expands/collapses. */
  controls: string;
  /** Accessible-name suffix appended after "Show more"/"Show less", e.g. "services" or "for Frontend". */
  label: string;
  className?: string;
}

/**
 * Shared arrow-based Show more / Show less control.
 *
 * Renders "→ Show more" when collapsed and "← Show less" when expanded.
 * Used both as a standalone toggle (ShowMoreButton) and inside
 * ExpandableCardDetails, so wording and accessibility behaviour stay
 * identical everywhere in the app.
 */
const ShowMoreToggle = forwardRef<HTMLButtonElement, ShowMoreToggleProps>(
  ({ expanded, onToggle, controls, label, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-label={`${expanded ? "Show less" : "Show more"} ${label}`}
        className={cn(
          "group/toggle inline-flex items-center gap-2 text-sm font-medium text-muted",
          "transition-colors duration-200 hover:text-accent",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:text-accent",
          "active:scale-[0.97] motion-reduce:active:scale-100",
          className
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block transition-transform duration-300 ease-out motion-reduce:transition-none",
            expanded
              ? "group-hover/toggle:-translate-x-0.5"
              : "group-hover/toggle:translate-x-0.5"
          )}
        >
          {expanded ? "←" : "→"}
        </span>
        <span>{expanded ? "Show less" : "Show more"}</span>
      </button>
    );
  }
);

ShowMoreToggle.displayName = "ShowMoreToggle";

export default ShowMoreToggle;
