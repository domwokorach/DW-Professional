"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { headerNavigation, social, type NavItem } from "@/data/navigation";
import { Highlighter } from "@/components/magicui/highlighter";
import { GithubIcon, LinkedinIcon } from "@/components/icons/SocialIcons";
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
          isActive ? "text-paper" : "text-muted"
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
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.25, ease: "easeInOut" }}
          className="lg:hidden overflow-hidden border-b border-line bg-ink/95 backdrop-blur-lg"
        >
          {/* The primary nav items, in the same fixed order as desktop:
              About, Services, Projects, Gallery, Contact Us, Language, Resume. */}
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
              <li className="pt-2">
                <LanguageSelector mobile />
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenResume}
                  className="min-h-11 w-full rounded-full border border-line px-4 py-3 text-center text-sm text-paper transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Resume
                </button>
              </li>
            </ul>
          </nav>

          <div className="mx-auto w-full max-w-content border-t border-line px-6 pb-6 pt-4 sm:px-8">
            <div className="flex items-center justify-center gap-2">
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                aria-label="Visit Dominic Wokorach on GitHub (opens in a new tab)"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:text-paper"
              >
                <GithubIcon aria-hidden="true" className="h-[22px] w-[22px]" />
              </a>
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                aria-label="Visit Dominic Wokorach on LinkedIn (opens in a new tab)"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:text-paper"
              >
                <LinkedinIcon aria-hidden="true" className="h-[22px] w-[22px]" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
