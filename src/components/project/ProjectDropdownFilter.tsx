"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectDropdownItem = {
  label: string;
  href: string;
};

export default function ProjectDropdownFilter({
  label,
  description,
  items,
}: {
  label: string;
  description: string;
  items: ProjectDropdownItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-3 rounded-full border border-line bg-surface/60 px-5 py-2.5 text-sm font-medium text-white transition-colors sm:w-auto",
          "hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
          isOpen && "border-accent/60"
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
            isOpen && "rotate-180 text-accent"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={panelId}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full max-w-[calc(100vw-3rem)] rounded-xl border border-line bg-surface p-3 shadow-xl sm:w-80"
          >
            <p className="px-1 text-xs leading-[1.6] text-muted">{description}</p>

            <ul className="mt-3 max-h-[min(60vh,360px)] space-y-0.5 overflow-y-auto">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault();
                      setIsOpen(false);

                      const target = document.getElementById(item.href.slice(1));
                      if (!target) return;

                      const skipAnimation = window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                      ).matches;
                      target.setAttribute("tabindex", "-1");
                      target.focus({ preventScroll: true });
                      target.scrollIntoView({
                        behavior: skipAnimation ? "auto" : "smooth",
                        block: "start",
                      });
                    }}
                    className="block min-h-11 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[-2px]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
