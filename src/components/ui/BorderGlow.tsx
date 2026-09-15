import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function BorderGlow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-glow relative isolate rounded-2xl", className)}>
      {children}
    </div>
  );
}
