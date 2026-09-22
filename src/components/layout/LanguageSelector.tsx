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

export default function LanguageSelector({ mobile = false }: { mobile?: boolean }) {
  const { locale, changeLocale, isTranslating } = useLocale();

  return (
    <Select value={locale} onValueChange={(value) => changeLocale(value as Locale)}>
      <SelectTrigger
        className={mobile ? "w-full" : "max-w-48"}
        aria-label={`Language: ${languageNames[locale]}`}
        aria-busy={isTranslating}
      >
        <Globe2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <SelectValue className="truncate" data-i18n-ignore>
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
