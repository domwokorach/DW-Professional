"use client";

import { forwardRef } from "react";
import { MessageCircle, X } from "lucide-react";

const PortfolioChatLauncher = forwardRef<
  HTMLButtonElement,
  { open: boolean; onToggle: () => void }
>(function PortfolioChatLauncher({ open, onToggle }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close portfolio assistant" : "Open portfolio assistant"}
      aria-expanded={open}
      aria-controls="portfolio-chat-panel"
      className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-accent text-ink shadow-xl transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-auto md:right-6 md:top-1/2 md:-translate-y-1/2"
    >
      {open ? (
        <X className="h-6 w-6" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  );
});

export default PortfolioChatLauncher;
