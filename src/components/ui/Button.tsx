import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import ScrollButton from "./ScrollButton";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

type ButtonAsLink = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type ButtonAsButton = CommonProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type ButtonProps = ButtonAsLink | ButtonAsButton;

const variantClasses = {
  primary:
    "bg-cta text-cta-fg hover:bg-accent hover:text-accent-fg focus-visible:outline-cta",
  secondary:
    "border border-line text-paper hover:border-accent/60 focus-visible:outline-accent",
  ghost: "text-muted hover:text-paper focus-visible:outline-accent",
};

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  className,
  disabled,
}: ButtonProps & { disabled?: boolean }) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    className
  );

  if (href?.startsWith("#")) {
    return (
      <ScrollButton targetId={href.slice(1)} className={classes}>
        {children}
      </ScrollButton>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
