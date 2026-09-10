"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  type Locale,
  isRtlLocale,
  localeCookieName,
  localisedPathname,
} from "./config";

type LocaleContextValue = {
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  localiseHref: (href: string) => string;
  isTranslating: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type TextRecord = { source: string; applied?: string };
type AttributeRecord = { source: string; applied?: string };
const translatedAttributes = ["aria-label", "placeholder", "title"] as const;
const excludedSelector = [
  "script",
  "style",
  "code",
  "pre",
  "kbd",
  "samp",
  "[data-i18n-ignore]",
  "[translate='no']",
  "[contenteditable='true']",
].join(",");

function shouldTranslateText(text: string) {
  const value = text.trim();
  return value.length > 1 && /[A-Za-z]/.test(value) && !/^https?:\/\//i.test(value) && !/^\S+@\S+\.\S+$/.test(value);
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [isTranslating, setIsTranslating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const textRecords = useRef(new WeakMap<Text, TextRecord>());
  const attributeRecords = useRef(new WeakMap<Element, Map<string, AttributeRecord>>());
  const translationCache = useRef(new Map<string, string>());
  const generation = useRef(0);

  const localiseHref = useCallback(
    (href: string) => {
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) return href;
      const [pathAndQuery, hash = ""] = href.split("#");
      const queryIndex = pathAndQuery.indexOf("?");
      const path = queryIndex >= 0 ? pathAndQuery.slice(0, queryIndex) : pathAndQuery;
      const query = queryIndex >= 0 ? pathAndQuery.slice(queryIndex) : "";
      return `${localisedPathname(path || "/", locale)}${query}${hash ? `#${hash}` : ""}`;
    },
    [locale]
  );

  const changeLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;
      document.cookie = `${localeCookieName}=${encodeURIComponent(nextLocale)}; Max-Age=31536000; Path=/; SameSite=Lax${
        location.protocol === "https:" ? "; Secure" : ""
      }`;
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = isRtlLocale(nextLocale) ? "rtl" : "ltr";
      setLocale(nextLocale);
      router.push(`${localisedPathname(pathname, nextLocale)}${window.location.hash}`);
    },
    [locale, pathname, router]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale]);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const currentGeneration = ++generation.current;

    const restoreEnglish = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;
      while (node) {
        const record = textRecords.current.get(node);
        if (record) node.nodeValue = record.source;
        node = walker.nextNode() as Text | null;
      }
      document.querySelectorAll("*").forEach((element) => {
        const records = attributeRecords.current.get(element);
        records?.forEach((record, name) => element.setAttribute(name, record.source));
      });
    };

    if (locale === "en-GB") {
      restoreEnglish();
      setIsTranslating(false);
      return;
    }

    const translatePage = async () => {
      if (disposed || currentGeneration !== generation.current) return;
      const textTargets = new Map<string, Text[]>();
      const attributeTargets = new Map<string, Array<{ element: Element; name: string }>>();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;

      while (node) {
        const parent = node.parentElement;
        const value = node.nodeValue ?? "";
        if (parent && !parent.closest(excludedSelector) && shouldTranslateText(value)) {
          let record = textRecords.current.get(node);
          if (!record) {
            record = { source: value };
            textRecords.current.set(node, record);
          } else if (value !== record.applied && value !== record.source) {
            record = { source: value };
            textRecords.current.set(node, record);
          }
          const targets = textTargets.get(record.source) ?? [];
          targets.push(node);
          textTargets.set(record.source, targets);
        }
        node = walker.nextNode() as Text | null;
      }

      document.querySelectorAll("*").forEach((element) => {
        if (element.closest(excludedSelector)) return;
        for (const name of translatedAttributes) {
          const value = element.getAttribute(name);
          if (!value || !shouldTranslateText(value)) continue;
          let records = attributeRecords.current.get(element);
          if (!records) {
            records = new Map();
            attributeRecords.current.set(element, records);
          }
          let record = records.get(name);
          if (!record || (value !== record.applied && value !== record.source)) {
            record = { source: value };
            records.set(name, record);
          }
          const targets = attributeTargets.get(record.source) ?? [];
          targets.push({ element, name });
          attributeTargets.set(record.source, targets);
        }
      });

      const allSources = [...new Set([...textTargets.keys(), ...attributeTargets.keys()])];
      const missing = allSources.filter(
        (source) => !translationCache.current.has(`${locale}:${source}`)
      );

      setIsTranslating(missing.length > 0);
      for (let start = 0; start < missing.length; start += 60) {
        const batch = missing.slice(start, start + 60);
        try {
          const response = await fetch("/api/translations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale, texts: batch }),
          });
          if (!response.ok) throw new Error("Translation unavailable");
          const data = (await response.json()) as { translations?: string[] };
          batch.forEach((source, index) => {
            translationCache.current.set(`${locale}:${source}`, data.translations?.[index] ?? source);
          });
        } catch {
          batch.forEach((source) => translationCache.current.set(`${locale}:${source}`, source));
        }
      }

      if (disposed || currentGeneration !== generation.current) return;
      allSources.forEach((source) => {
        const translated = translationCache.current.get(`${locale}:${source}`) ?? source;
        textTargets.get(source)?.forEach((target) => {
          const record = textRecords.current.get(target);
          if (record) record.applied = translated;
          target.nodeValue = translated;
        });
        attributeTargets.get(source)?.forEach(({ element, name }) => {
          const record = attributeRecords.current.get(element)?.get(name);
          if (record) record.applied = translated;
          element.setAttribute(name, translated);
        });
      });
      setIsTranslating(false);
    };

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(translatePage, 80);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    schedule();

    return () => {
      disposed = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [locale, pathname]);

  const value = useMemo(
    () => ({ locale, changeLocale, localiseHref, isTranslating }),
    [locale, changeLocale, localiseHref, isTranslating]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
