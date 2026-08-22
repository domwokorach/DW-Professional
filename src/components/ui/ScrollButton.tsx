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
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" })
      }
    >
      {children}
    </button>
  );
}
