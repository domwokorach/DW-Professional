"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import ShowMoreToggle, { type ShowMoreToggleProps } from "@/components/ui/ShowMoreToggle";

export interface ExpandableCardDetailsProps {
  /** Additional content revealed when expanded. */
  children: ReactNode;
  /** Card title, used to build an accessible name for the toggle (e.g. "Frontend"). */
  title: string;
  className?: string;
  contentClassName?: string;
  toggleClassName?: string;
  toggleVariant?: ShowMoreToggleProps["variant"];
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
  toggleVariant,
  defaultExpanded = false,
}: ExpandableCardDetailsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      {/* Always mounted so the toggle's aria-controls target exists while collapsed. */}
      <div id={contentId}>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
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
      </div>

      <ShowMoreToggle
        expanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
        controls={contentId}
        label={`for ${title}`}
        variant={toggleVariant}
        className={cn("mt-4 rounded-full px-2.5 py-1 -mx-2.5", toggleClassName)}
      />
    </div>
  );
}
