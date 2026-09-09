"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { handleCopy, handleContextMenu } from "@/lib/copyProtection";

/**
 * Deterrent only — content already delivered to the browser can still be
 * read via devtools, view-source, accessibility tools or screenshots.
 */
export default function ProtectedParagraph({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn("no-copy", className)}
      onCopy={handleCopy}
      onContextMenu={handleContextMenu}
    >
      {children}
    </p>
  );
}
