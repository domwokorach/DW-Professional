"use client";

import { AnimatePresence, motion } from "framer-motion";
import { headerNavigation, type NavItem } from "@/data/navigation";
import { Highlighter } from "@/components/magicui/highlighter";
import LanguageSelector from "./LanguageSelector";

function MobileNavItem({
  item,
  activeGroup,
  onNavigate,
}: {
  item: NavItem;
  activeGroup: string;
  onNavigate: (id: string) => void;
}) {
  const isActive = activeGroup === item.id;

  return (
    <li>
      <button
        onClick={() => onNavigate(item.id)}
        aria-current={isActive ? "true" : undefined}
        className={`block min-h-11 w-full rounded py-3 text-left text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
          isActive ? "text-white" : "text-muted"
        }`}
      >
        {isActive ? <Highlighter action="highlight">{item.label}</Highlighter> : item.label}
      </button>
    </li>
  );
}

export default function MobileNavigation({
  open,
  activeGroup,
  onNavigate,
  onOpenResume,
}: {
  open: boolean;
  activeGroup: string;
  onNavigate: (id: string) => void;
  onOpenResume: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="md:hidden overflow-hidden border-b border-line bg-ink/95 backdrop-blur-lg"
        >
          <nav aria-label="Mobile navigation">
            <ul className="mx-auto flex max-h-[70vh] w-full max-w-content flex-col gap-1 overflow-y-auto px-6 py-4 sm:px-8">
              {headerNavigation.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  activeGroup={activeGroup}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </nav>

          <div className="mx-auto w-full max-w-content px-6 pb-6 sm:px-8">
            <div className="mb-3">
              <LanguageSelector mobile />
            </div>
            <button
              onClick={onOpenResume}
              className="min-h-11 w-full rounded-full border border-line px-4 py-3 text-sm text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Resume
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
