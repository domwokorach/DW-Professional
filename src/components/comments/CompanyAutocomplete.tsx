"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { CompanySearchResult, CompanyStatus } from "@/types/company";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

interface CompanyAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Fires with the selected company's metadata, or null once the value no longer represents a confirmed selection (manual edit or "use as entered"). */
  onSelect?: (company: CompanySearchResult | null) => void;
  maxLength?: number;
  placeholder?: string;
}

function highlightMatch(name: string, term: string) {
  if (!term.trim()) return name;
  const index = name.toLowerCase().indexOf(term.trim().toLowerCase());
  if (index === -1) return name;
  return (
    <>
      {name.slice(0, index)}
      <mark className="rounded-sm bg-accent/30 text-white">
        {name.slice(index, index + term.length)}
      </mark>
      {name.slice(index + term.length)}
    </>
  );
}

function formatStatus(status: CompanyStatus | undefined): string | null {
  if (!status) return null;
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusVariant(status: CompanyStatus | undefined): "secondary" | "outline" | "destructive" {
  if (status === "active") return "secondary";
  if (status === "dissolved" || status === "liquidation" || status === "administration") return "destructive";
  return "outline";
}

// Module-level so results survive re-renders (and re-mounts within the same
// page load) without a dedicated cache layer — this is a small, low-stakes
// lookup, not data that needs invalidation.
const searchCache = new Map<string, CompanySearchResult[]>();

export default function CompanyAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  maxLength = 160,
  placeholder,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  useEffect(() => {
    const term = debouncedValue.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setResults([]);
      setStatus("idle");
      return;
    }

    const cacheKey = term.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setResults(cached);
      setStatus("idle");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");

    (async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          setStatus("error");
          setResults([]);
          return;
        }
        const data: { companies?: CompanySearchResult[] } = await res.json();
        const found = data.companies ?? [];
        searchCache.set(cacheKey, found);
        setResults(found);
        setStatus("idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
        setResults([]);
      }
    })();

    return () => controller.abort();
  }, [debouncedValue]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedValue = value.trim();
  const showDropdown = isOpen && trimmedValue.length >= MIN_QUERY_LENGTH;
  const showManualOption = showDropdown && status !== "loading" && trimmedValue.length > 0;
  const manualOptionIndex = results.length;

  const activeDescendant =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  function selectCompany(company: CompanySearchResult) {
    onChange(company.name);
    onSelect?.(company);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function applyManualEntry() {
    onSelect?.(null);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const optionCount = results.length + (showManualOption ? 1 : 0);
    if (!showDropdown || optionCount === 0) {
      if (event.key === "Escape") setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % optionCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? optionCount - 1 : prev - 1));
    } else if (event.key === "Enter") {
      if (activeIndex < 0) return;
      event.preventDefault();
      if (activeIndex === manualOptionIndex && showManualOption) {
        applyManualEntry();
      } else if (results[activeIndex]) {
        selectCompany(results[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const statusMessage = useMemo(() => {
    if (status === "loading") return "Searching UK companies…";
    if (status === "error") return "Unable to search companies right now. You can still enter your company manually.";
    if (status === "idle" && results.length === 0) return `No UK companies found for "${trimmedValue}".`;
    return null;
  }, [status, results.length, trimmedValue]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onSelect?.(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Search UK company..."}
          className={status === "loading" ? "pr-9" : undefined}
        />
        {status === "loading" ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        ) : null}
      </div>

      <div
        className={cn(
          "absolute z-20 mt-1.5 w-full origin-top overflow-hidden rounded-lg border border-line bg-ink shadow-lg transition-all duration-150",
          showDropdown
            ? "pointer-events-auto scale-y-100 opacity-100"
            : "pointer-events-none scale-y-95 opacity-0"
        )}
      >
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Matching companies"
          className="max-h-72 overflow-y-auto py-1"
        >
          {status === "loading" && results.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Searching UK companies…
            </li>
          ) : (
            <>
              {statusMessage && results.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-muted" role="status">
                  {statusMessage}
                </li>
              ) : (
                results.map((company, index) => {
                  const statusLabel = formatStatus(company.status);
                  return (
                    <li
                      key={company.id}
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
                      {company.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable-domain logos; not worth Image's remote-pattern config for a small autocomplete thumbnail
                        <img
                          src={company.logo}
                          alt=""
                          className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <Building2
                          className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line p-1 text-muted"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-medium">{highlightMatch(company.name, value)}</span>
                          {statusLabel ? (
                            <Badge variant={statusVariant(company.status)} className="shrink-0">
                              {statusLabel}
                            </Badge>
                          ) : null}
                        </div>
                        {company.companyNumber ? (
                          <div className="mt-0.5 truncate text-xs text-muted/80">
                            Company No. {company.companyNumber}
                          </div>
                        ) : null}
                        {(company.industry || company.location) && (
                          <div className="mt-0.5 truncate text-xs text-muted">
                            {[company.industry, company.location].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              )}

              {showManualOption ? (
                <li
                  id={`${listboxId}-option-${manualOptionIndex}`}
                  role="option"
                  aria-selected={activeIndex === manualOptionIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyManualEntry();
                  }}
                  onMouseEnter={() => setActiveIndex(manualOptionIndex)}
                  className={cn(
                    "cursor-pointer border-t border-line px-3 py-2.5 text-sm transition-colors",
                    activeIndex === manualOptionIndex ? "bg-accent/20 text-white" : "text-muted hover:bg-accent/10 hover:text-white"
                  )}
                >
                  {results.length === 0 ? (
                    <>
                      Can&rsquo;t find your company?{" "}
                      <span className="font-medium text-accent">Enter &ldquo;{trimmedValue}&rdquo; manually</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-accent">Can&rsquo;t find your company?</span> Enter &ldquo;
                      {trimmedValue}&rdquo; manually
                    </>
                  )}
                </li>
              ) : null}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
