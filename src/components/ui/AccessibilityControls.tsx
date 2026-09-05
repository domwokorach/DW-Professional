"use client";

import { useEffect, useState } from "react";

type TextSize = "small" | "default" | "large";
type ThemePreference = "light" | "dark" | "system";

type AccessibilitySettings = {
  highContrast: boolean;
  textSize: TextSize;
  boldText: boolean;
};

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  textSize: "default",
  boldText: false,
};

const storageKey = "accessibility-settings-v1";
const themeStorageKey = "theme-preference-v1";

function isTextSize(value: unknown): value is TextSize {
  return value === "small" || value === "default" || value === "large";
}

function restoreSettings(value: string): AccessibilitySettings {
  let parsedSettings: unknown;

  try {
    parsedSettings = JSON.parse(value);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    localStorage.removeItem(storageKey);
    return defaultSettings;
  }

  if (
    typeof parsedSettings === "object" &&
    parsedSettings !== null &&
    "highContrast" in parsedSettings &&
    "textSize" in parsedSettings &&
    "boldText" in parsedSettings &&
    typeof parsedSettings.highContrast === "boolean" &&
    isTextSize(parsedSettings.textSize) &&
    typeof parsedSettings.boldText === "boolean"
  ) {
    return {
      highContrast: parsedSettings.highContrast,
      textSize: parsedSettings.textSize,
      boldText: parsedSettings.boldText,
    };
  }

  localStorage.removeItem(storageKey);
  return defaultSettings;
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.dataset.highContrast = String(settings.highContrast);
  root.dataset.textSize = settings.textSize;
  root.dataset.boldText = String(settings.boldText);
}

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

export default function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [isReady, setIsReady] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const savedSettings = localStorage.getItem(storageKey);

    if (savedSettings) {
      const restoredSettings = restoreSettings(savedSettings);
      setSettings(restoredSettings);
      applySettings(restoredSettings);
    } else {
      applySettings(defaultSettings);
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    applySettings(settings);
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [isReady, settings]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(themeStorageKey);
    const preference = isThemePreference(savedTheme) ? savedTheme : "system";

    setThemePreference(preference);
    applyTheme(preference);
    setIsThemeReady(true);
  }, []);

  useEffect(() => {
    if (!isThemeReady) return;

    localStorage.setItem(themeStorageKey, themePreference);
    applyTheme(themePreference);

    if (themePreference !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => applyTheme("system");
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, [isThemeReady, themePreference]);

  const setTextSize = (textSize: TextSize) => {
    setSettings((current) => ({ ...current, textSize }));
    setAnnouncement(
      textSize === "small"
        ? "Text size decreased."
        : textSize === "large"
          ? "Text size increased."
          : "Text size restored to default."
    );
  };

  const toggleHighContrast = () => {
    setSettings((current) => {
      const highContrast = !current.highContrast;
      setAnnouncement(`High contrast mode ${highContrast ? "enabled" : "disabled"}.`);
      return { ...current, highContrast };
    });
  };

  const toggleBoldText = () => {
    setSettings((current) => {
      const boldText = !current.boldText;
      setAnnouncement(`Bold text ${boldText ? "enabled" : "disabled"}.`);
      return { ...current, boldText };
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setAnnouncement("Accessibility settings reset.");
  };

  const hasCustomSettings =
    settings.highContrast || settings.boldText || settings.textSize !== "default";

  return (
    <div className="fixed bottom-5 left-4 z-50 sm:bottom-6 sm:left-6">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="accessibility-controls"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-11 items-center rounded-full border border-line bg-ink/95 px-4 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:border-accent hover:text-accent"
      >
        Accessibility options
      </button>

      {isOpen && (
        <aside
          id="accessibility-controls"
          aria-label="Accessibility display settings"
          className="absolute bottom-14 left-0 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
        >
          <h2 className="text-base font-semibold text-white">Display preferences</h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Settings apply throughout this website and are saved on this device.
          </p>

          <div className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-white">Appearance</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["light", "Light"],
                    ["dark", "Dark"],
                    ["system", "System"],
                  ] as const
                ).map(([preference, label]) => (
                  <button
                    key={preference}
                    type="button"
                    aria-pressed={themePreference === preference}
                    onClick={() => {
                      setThemePreference(preference);
                      setAnnouncement(`${label} appearance selected.`);
                    }}
                    className="min-h-11 rounded-lg border border-line px-2 text-sm font-medium text-white transition-colors hover:border-accent"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <section aria-labelledby="contrast-setting">
              <h3 id="contrast-setting" className="text-sm font-medium text-white">
                Contrast
              </h3>
              <button
                type="button"
                aria-pressed={settings.highContrast}
                onClick={toggleHighContrast}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-line px-3 text-left text-sm font-medium text-white transition-colors hover:border-accent"
              >
                <span>High contrast</span>
                <span>{settings.highContrast ? "On" : "Off"}</span>
              </button>
            </section>

            <fieldset>
              <legend className="text-sm font-medium text-white">Text size</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  aria-pressed={settings.textSize === "small"}
                  aria-label="Decrease text size"
                  onClick={() => setTextSize("small")}
                  className="min-h-11 rounded-lg border border-line px-2 text-sm font-medium text-white transition-colors hover:border-accent"
                >
                  A−
                </button>
                <button
                  type="button"
                  aria-pressed={settings.textSize === "default"}
                  aria-label="Restore default text size"
                  onClick={() => setTextSize("default")}
                  className="min-h-11 rounded-lg border border-line px-2 text-base font-medium text-white transition-colors hover:border-accent"
                >
                  A
                </button>
                <button
                  type="button"
                  aria-pressed={settings.textSize === "large"}
                  aria-label="Increase text size"
                  onClick={() => setTextSize("large")}
                  className="min-h-11 rounded-lg border border-line px-2 text-lg font-medium text-white transition-colors hover:border-accent"
                >
                  A+
                </button>
              </div>
            </fieldset>

            <section aria-labelledby="weight-setting">
              <h3 id="weight-setting" className="text-sm font-medium text-white">
                Text weight
              </h3>
              <button
                type="button"
                aria-pressed={settings.boldText}
                onClick={toggleBoldText}
                className="mt-2 inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-line px-3 text-left text-sm font-medium text-white transition-colors hover:border-accent"
              >
                <span>Bold text</span>
                <span>{settings.boldText ? "On" : "Off"}</span>
              </button>
            </section>

            <button
              type="button"
              onClick={resetSettings}
              disabled={!hasCustomSettings}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-white transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset accessibility settings
            </button>
          </div>

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </aside>
      )}
    </div>
  );
}
