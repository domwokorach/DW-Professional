"use client";

import { useEffect, useState } from "react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-50 rounded-full border border-white/10 bg-black/70 px-4 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      Back to Top ↑
    </button>
  );
}
