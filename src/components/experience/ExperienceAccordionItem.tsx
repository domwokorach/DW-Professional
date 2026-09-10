"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { EASE } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { ExperienceItem } from "@/types/experience";

export default function ExperienceAccordionItem({
  item,
  id,
  isOpen,
  onToggle,
}: {
  item: ExperienceItem;
  id?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const slug = id ?? item.role.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const triggerId = `experience-trigger-${slug}`;
  const panelId = `experience-panel-${slug}`;

  return (
    <li id={id} className="scroll-mt-24 border-b border-line first:border-t">
      <h3 className="text-base">
        <button
          type="button"
          id={triggerId}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="flex w-full min-h-11 items-start justify-between gap-4 py-6 text-left transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]"
        >
          <span className="min-w-0">
            <span className="block font-mono text-xs text-accent">{item.period}</span>
            <span
              className={cn(
                "mt-2 block text-lg font-medium transition-colors",
                isOpen ? "text-white" : "text-white/90"
              )}
            >
              {item.role}
            </span>
            {item.org && <span className="mt-1 block text-sm text-muted">{item.org}</span>}
            {item.location && <span className="block text-xs text-muted">{item.location}</span>}
          </span>

          <ChevronDown
            aria-hidden="true"
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-muted transition-transform duration-200",
              isOpen && "rotate-180 text-accent"
            )}
          />
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-6 pr-9">
              {item.points.length > 0 ? (
                <ul className="space-y-1.5">
                  {item.points.map((pt) => (
                    <li
                      key={pt}
                      className="text-sm leading-[1.7] text-muted before:mr-2 before:text-accent before:content-['—']"
                    >
                      {pt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-[1.7] text-muted">{item.focus}</p>
              )}

              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line px-3 py-1 text-xs font-mono text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
