"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  AnimatedThemeToggler,
} from "@/components/ui/animated-theme-toggler";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Renders a static placeholder before hydration so the server-rendered
 * markup and the first client render always match (no theme flash / no
 * hydration mismatch warning).
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/90 text-paper shadow-sm backdrop-blur-md transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&_svg]:h-[18px] [&_svg]:w-[18px]";

/**
 * Icon-only animated theme toggle for desktop and tablet navigation. Wraps
 * Magic UI's Animated Theme Toggler but stays controlled by next-themes so
 * there is a single source of truth for the theme (shared with
 * {@link ThemeToggleMobile}), instead of the toggler owning its own state.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        disabled
        className={cn(iconButtonClassName, className)}
      >
        <span className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <AnimatedThemeToggler
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          onThemeChange={(next) => setTheme(next)}
          aria-label="Toggle theme"
          className={cn(iconButtonClassName, className)}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">Toggle theme</TooltipContent>
    </Tooltip>
  );
}

/**
 * Animated theme toggle for the mobile navigation panel: the same
 * next-themes-controlled toggler as {@link ThemeToggle}, laid out as a full
 * width row with a visible label instead of an icon-only button.
 */
export function ThemeToggleMobile({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-3",
        className
      )}
    >
      {mounted ? (
        <AnimatedThemeToggler
          theme={isDark ? "dark" : "light"}
          onThemeChange={(next) => setTheme(next)}
          aria-label="Toggle theme"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-paper transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&_svg]:h-[18px] [&_svg]:w-[18px]"
        />
      ) : (
        <button
          type="button"
          aria-label="Toggle theme"
          disabled
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-paper"
        >
          <span className="h-[18px] w-[18px]" />
        </button>
      )}
      <span className="flex-1 text-sm text-paper">
        {mounted ? (isDark ? "Dark mode" : "Light mode") : "Toggle theme"}
      </span>
    </div>
  );
}
