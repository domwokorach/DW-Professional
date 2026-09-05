"use client";

import type { ReactNode } from "react";

export default function ScrollButton({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  const navigateToSection = () => {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={navigateToSection}
    >
      {children}
    </button>
  );
}
