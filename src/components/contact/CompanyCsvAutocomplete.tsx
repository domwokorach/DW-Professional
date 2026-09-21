"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Building2, Loader2, X } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

export interface CsvCompanyResult {
  name: string;
  industry?: string;
  location?: string;
}

export interface CompanyCsvAutocompleteProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName: string;
  helperId?: string;
}

/**
 * Optional "Company" field for the project enquiry form, backed by the
 * bundled CSV dataset (see /api/companies/csv-search). The input is always
 * the source of truth for the field's value — the dropdown only offers
 * suggestions, so free typing (a company not in the dataset) stays valid.
 */
export default function CompanyCsvAutocomplete({
  id,
  name,
  value,
  onChange,
  inputClassName,
  helperId,
}: CompanyCsvAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CsvCompanyResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  const term = debouncedValue.trim();

  useEffect(() => {
    if (term.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setResults([]);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setErrorMessage(null);

    (async () => {
      try {
        const res = await fetch(`/api/companies/csv-search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data: { companies?: CsvCompanyResult[]; error?: string } | null = await res
          .json()
          .catch(() => null);
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data?.error ?? "Unable to load companies. Please try again.");
          setResults([]);
          return;
        }
        setResults(data?.companies ?? []);
        setStatus("idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
        setErrorMessage("Unable to load companies. Please try again.");
        setResults([]);
      }
    })();

    return () => controller.abort();
  }, [term]);

  useEffect(() => setActiveIndex(-1), [results]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const showDropdown = isOpen && value.trim().length >= MIN_QUERY_LENGTH;
  const activeDescendant = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  function selectCompany(company: CsvCompanyResult) {
    onChange(company.name);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function clearSelection() {
    onChange("");
    setResults([]);
    setStatus("idle");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || results.length === 0) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      if (activeIndex < 0 || !results[activeIndex]) return;
      event.preventDefault();
      selectCompany(results[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  const statusMessage =
    status === "loading"
      ? "Searching companies..."
      : status === "error"
        ? (errorMessage ?? "Unable to load companies. Please try again.")
        : status === "idle" && results.length === 0
          ? "No companies found."
          : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          aria-describedby={helperId}
          autoComplete="off"
          maxLength={160}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(inputClassName, value ? "pr-9" : undefined)}
          style={{ fontSize: "16px" }}
        />
        {status === "loading" ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        ) : value ? (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Clear company"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "absolute left-0 right-0 z-20 mt-1.5 max-w-full origin-top overflow-hidden rounded-lg border border-line bg-ink shadow-lg transition-all duration-150",
          showDropdown
            ? "pointer-events-auto scale-y-100 opacity-100"
            : "pointer-events-none scale-y-95 opacity-0"
        )}
      >
        <ul id={listboxId} role="listbox" aria-label="Matching companies" className="max-h-64 overflow-y-auto py-1">
          {statusMessage ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted" role="status">
              {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
              {statusMessage}
            </li>
          ) : (
            results.map((company, index) => (
              <li
                key={company.name}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCompany(company);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm transition-colors",
                  index === activeIndex ? "bg-accent/20 text-white" : "text-white hover:bg-accent/10"
                )}
              >
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-line p-1 text-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{company.name}</div>
                  {(company.industry || company.location) && (
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {[company.industry, company.location].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
