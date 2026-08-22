"use client";

import { AnimatePresence, motion } from "framer-motion";
import { navigation } from "@/data/navigation";

export default function MobileNavigation({
  open,
  active,
  onNavigate,
}: {
  open: boolean;
  active: string;
  onNavigate: (id: string) => void;
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
          <ul className="mx-auto flex w-full max-w-content flex-col gap-1 px-6 py-4 sm:px-8">
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  aria-current={active === item.id ? "true" : undefined}
                  className={`block w-full py-3 text-left text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded ${
                    active === item.id ? "text-white" : "text-muted"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
