"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

type ThemePreference = "light" | "dark" | "system";

const storageKey = "theme-preference-v1";

const themeOptions: {
  preference: ThemePreference;
  label: string;
  Icon: LucideIcon;
}[] = [
  { preference: "light", label: "Light", Icon: Sun },
  { preference: "dark", label: "Dark", Icon: Moon },
  { preference: "system", label: "System", Icon: Monitor },
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.dataset.theme = isDark ? "dark" : "light";
}

export default function ThemeModeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [isReady, setIsReady] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedPreference = localStorage.getItem(storageKey);
    const restoredPreference = isThemePreference(savedPreference) ? savedPreference : "system";

    setPreference(restoredPreference);
    applyTheme(restoredPreference);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    applyTheme(preference);
    localStorage.setItem(storageKey, preference);

    if (preference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => applyTheme("system");
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, [isReady, preference]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [isOpen]);

  const selectTheme = (nextPreference: ThemePreference) => {
    const option = themeOptions.find((item) => item.preference === nextPreference);
    setPreference(nextPreference);
    setAnnouncement(`${option?.label ?? "System"} theme selected.`);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const focusMenuItem = (direction: "first" | "last" | "next" | "previous") => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []
    );
    if (!items.length) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      direction === "first"
        ? 0
        : direction === "last"
          ? items.length - 1
          : direction === "next"
            ? (currentIndex + 1 + items.length) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex].focus();
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusMenuItem("next");
        break;
      case "ArrowUp":
        event.preventDefault();
        focusMenuItem("previous");
        break;
      case "Home":
        event.preventDefault();
        focusMenuItem("first");
        break;
      case "End":
        event.preventDefault();
        focusMenuItem("last");
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };

  const selectedOption = themeOptions.find((option) => option.preference === preference)!;
  const SelectedIcon = selectedOption.Icon;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Theme mode: ${selectedOption.label}`}
        title={`Theme mode: ${selectedOption.label}. Change theme`}
        aria-expanded={isOpen}
        aria-controls="theme-mode-menu"
        aria-haspopup="menu"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            requestAnimationFrame(() => focusMenuItem("first"));
          }
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface/90 px-3 text-sm font-medium text-white shadow-sm backdrop-blur-md transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <SelectedIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="theme-mode-menu"
          role="menu"
          aria-label="Theme mode"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-40 grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-2 shadow-xl"
        >
          {themeOptions.map(({ preference: optionPreference, label, Icon }) => {
            const isSelected = preference === optionPreference;

            return (
              <button
                key={optionPreference}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                aria-label={`Switch to ${label} theme${
                  optionPreference === "system" ? " (automatic)" : ""
                }`}
                title={`${label}${optionPreference === "system" ? " (Automatic)" : ""}`}
                onClick={() => selectTheme(optionPreference)}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent ${
                  isSelected
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-transparent text-white hover:border-accent/60 hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
