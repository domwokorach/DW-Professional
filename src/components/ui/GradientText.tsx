import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function GradientText({
  children,
  as: Component = "span",
  variant = "default",
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: "default" | "button";
  className?: string;
}) {
  return (
    <Component
      className={cn(
        variant === "button" ? "gradient-text-button" : "gradient-text",
        className,
      )}
    >
      {children}
    </Component>
  );
}
