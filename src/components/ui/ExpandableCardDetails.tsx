"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpandableCardDetailsProps {
  /** Additional content revealed when expanded. */
  children: ReactNode;
  /** Card title, used to build an accessible name for the toggle (e.g. "Frontend"). */
  title: string;
  className?: string;
  contentClassName?: string;
  toggleClassName?: string;
  defaultExpanded?: boolean;
}

/**
 * Compact, self-contained Show more / Show less control plus the animated
 * region it reveals. Each instance owns its own open/closed state so
 * expanding one card never affects any other.
 */
export default function ExpandableCardDetails({
  children,
  title,
  className,
  contentClassName,
  toggleClassName,
  defaultExpanded = false,
}: ExpandableCardDetailsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            id={contentId}
            initial={{ opacity: 0, height: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: reduceMotion ? 0 : 8 }}
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn("overflow-hidden", contentClassName)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={contentId}
        aria-label={`${expanded ? "Show less" : "Show more"} for ${title}`}
        className={cn(
          "group/toggle mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 -mx-2.5 text-xs font-medium text-muted",
          "transition-colors duration-200 hover:text-accent active:scale-[0.97]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          toggleClassName
        )}
      >
        <span aria-hidden="true">{expanded ? "Show less" : "Show more"}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300 ease-out motion-reduce:transition-none",
            expanded && "-rotate-180"
          )}
        />
      </button>
    </div>
  );
}
