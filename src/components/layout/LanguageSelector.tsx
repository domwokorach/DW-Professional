"use client";

import { Globe2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/motion/select";
import { languageNames, locales, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export default function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { locale, changeLocale, isTranslating } = useLocale();

  return (
    <Select value={locale} onValueChange={(value) => changeLocale(value as Locale)}>
      <SelectTrigger
        // Mobile: centre the globe + label in the full-width button while the
        // chevron stays at the right. The auto margins on the globe and the
        // chevron split the free space evenly, and pl-9 mirrors the chevron's
        // width + gap + padding on the left so the pair sits at true centre.
        className={mobile ? "w-full pl-9 [&>svg:last-child]:ml-auto" : "max-w-48"}
        aria-label={`Language: ${languageNames[locale]}`}
        aria-busy={isTranslating}
      >
        <Globe2 className={cn("h-4 w-4 shrink-0 text-accent", mobile && "ml-auto")} aria-hidden="true" />
        <SelectValue className={cn("truncate", mobile && "min-w-0 flex-initial")} data-i18n-ignore>
          {(value: Locale) => languageNames[value]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align={mobile ? "center" : "end"} className="min-w-56">
        {locales.map((option) => (
          <SelectItem key={option} value={option} lang={option} dir={option === "ar" ? "rtl" : "ltr"}>
            <span data-i18n-ignore>{languageNames[option]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
