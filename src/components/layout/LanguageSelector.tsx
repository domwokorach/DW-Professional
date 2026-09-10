"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { languageNames, locales } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

export default function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { locale, changeLocale, isTranslating } = useLocale();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            mobile ? "w-full" : "max-w-48"
          }`}
          aria-label={`Language: ${languageNames[locale]}`}
          aria-busy={isTranslating}
        >
          <Globe2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate" data-i18n-ignore>{languageNames[locale]}</span>
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align={mobile ? "center" : "end"}
          collisionPadding={12}
          className="z-[100] max-h-[min(70vh,32rem)] min-w-56 overflow-y-auto rounded-xl border border-line bg-ink/95 p-1.5 text-white shadow-2xl backdrop-blur-xl"
          aria-label="Choose a language"
        >
          <DropdownMenu.Label className="px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted">
            Language
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={locale} onValueChange={(value) => changeLocale(value as typeof locale)}>
            {locales.map((option) => (
              <DropdownMenu.RadioItem
                key={option}
                value={option}
                lang={option}
                dir={option === "ar" ? "rtl" : "ltr"}
                className="relative flex min-h-11 cursor-pointer select-none items-center rounded-lg py-2 pe-9 ps-3 text-sm outline-none data-[highlighted]:bg-white/10 data-[highlighted]:text-accent"
              >
                <span data-i18n-ignore>{languageNames[option]}</span>
                <DropdownMenu.ItemIndicator className="absolute end-3 inline-flex items-center">
                  <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
