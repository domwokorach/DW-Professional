"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CookiePreferences } from "@/lib/cookieConsent";

type ToggleCategory = "analytics" | "functional" | "marketing";

const categories: {
  key: ToggleCategory;
  title: string;
  description: string;
}[] = [
  {
    key: "analytics",
    title: "Analytics",
    description:
      "Used to understand how visitors use the website, such as page views, traffic patterns, website performance and anonymous usage statistics.",
  },
  {
    key: "functional",
    title: "Functional",
    description:
      "Used to remember preferences and provide enhanced website functionality.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description:
      "Used for advertising, campaign measurement or remarketing where applicable.",
  },
];

function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        checked ? "border-accent bg-accent/30" : "border-line bg-white/5"
      }`}
    >
      <span
        className={`ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-ink transition-transform ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
        aria-hidden
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

export default function CookiePreferencesModal({
  open,
  initial,
  onClose,
  onSave,
  onAcceptAll,
  onRejectOptional,
  returnFocusRef,
}: {
  open: boolean;
  initial: Pick<CookiePreferences, "analytics" | "functional" | "marketing">;
  onClose: () => void;
  onSave: (prefs: Pick<CookiePreferences, "analytics" | "functional" | "marketing">) => void;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [functional, setFunctional] = useState(initial.functional);
  const [marketing, setMarketing] = useState(initial.marketing);

  useEffect(() => {
    if (open) {
      setAnalytics(initial.analytics);
      setFunctional(initial.functional);
      setMarketing(initial.marketing);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const elementToRestore = returnFocusRef.current ?? previouslyFocused;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      elementToRestore?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-modal-title"
            aria-describedby="cookie-modal-description"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 shadow-2xl sm:rounded-2xl sm:p-8"
          >
            <h2 id="cookie-modal-title" className="text-xl font-semibold text-white">
              Customise Cookie Preferences
            </h2>
            <p id="cookie-modal-description" className="mt-2 text-sm leading-[1.6] text-muted">
              Choose which optional cookies you would like to allow. Strictly
              necessary cookies are always active because they are required
              for the website to function.
            </p>

            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">Strictly Necessary</p>
                    <p className="mt-0.5 text-xs font-mono uppercase tracking-wide text-accent">
                      Always Active
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-[1.6] text-muted">
                  Required for essential website functionality, security and
                  storing cookie preferences. This option cannot be disabled.
                </p>
              </div>

              {categories.map((cat) => {
                const value =
                  cat.key === "analytics"
                    ? analytics
                    : cat.key === "functional"
                    ? functional
                    : marketing;
                const setValue =
                  cat.key === "analytics"
                    ? setAnalytics
                    : cat.key === "functional"
                    ? setFunctional
                    : setMarketing;

                return (
                  <div key={cat.key} className="rounded-xl border border-line p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <label htmlFor={`toggle-${cat.key}`} className="font-medium text-white">
                          {cat.title}
                        </label>
                        <p className="mt-0.5 text-xs font-mono uppercase tracking-wide text-muted">
                          Optional — Off by default
                        </p>
                      </div>
                      <Toggle
                        id={`toggle-${cat.key}`}
                        checked={value}
                        onChange={setValue}
                        label={`${cat.title} cookies`}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-[1.6] text-muted">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => onSave({ analytics, functional, marketing })}
                className="min-h-[48px] flex-1 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={onAcceptAll}
                className="min-h-[48px] flex-1 rounded-full border border-line px-5 py-3 text-sm font-medium text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={onRejectOptional}
                className="min-h-[48px] flex-1 rounded-full border border-line px-5 py-3 text-sm font-medium text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                Reject Optional Cookies
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
