"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ThemePreference = "light" | "dark" | "system";

const themeOptions: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

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

/**
 * Icon-only theme control with a dropdown menu, for desktop and tablet
 * navigation. Shares theme state with {@link ThemeToggleMobile} via
 * next-themes rather than keeping its own copy.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme();
  const mounted = useMounted();

  const current = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const CurrentIcon = current.Icon;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Change theme"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface/90 text-white shadow-sm backdrop-blur-md transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                className
              )}
            >
              {mounted ? (
                <CurrentIcon className="h-[18px] w-[18px] transition-transform duration-200" aria-hidden="true" />
              ) : (
                <span className="h-[18px] w-[18px]" />
              )}
              <span className="sr-only">Change theme</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Change theme</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-40">
        {themeOptions.map(({ value, label, Icon }) => {
          const isActive = mounted && theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onSelect={() => setTheme(value)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2.5 text-white",
                isActive && "text-accent"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {isActive && <Check className="h-4 w-4" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline row-based theme control for the mobile navigation panel. Avoids a
 * second dropdown layered over an already-open menu.
 */
export function ThemeToggleMobile({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className={cn("flex flex-col gap-1", className)} role="radiogroup" aria-label="Change theme">
      {themeOptions.map(({ value, label, Icon }) => {
        const isActive = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-lg border border-transparent px-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
              isActive ? "border-accent/40 bg-accent/10 text-accent" : "text-white hover:bg-white/5"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {isActive && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
