"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, CheckCircle2, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { CompanySearchResult, CompanyStatus } from "@/types/company";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;
const LETTER_PATTERN = /^[A-Z]$/i;
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

function isValidQuery(term: string): boolean {
  return term.length >= MIN_QUERY_LENGTH || LETTER_PATTERN.test(term);
}

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

const COMPANY_TYPE_LABELS: Record<string, string> = {
  ltd: "Private limited company",
  plc: "Public limited company",
  "private-unlimited": "Private unlimited company",
  "private-unlimited-nsc": "Private unlimited company",
  "old-public-company": "Old public company",
  llp: "Limited liability partnership",
  "limited-partnership": "Limited partnership",
  "industrial-and-provident-society": "Industrial and provident society",
  "royal-charter": "Royal charter company",
  "registered-society-non-jurisdictional": "Registered society",
  "charitable-incorporated-organisation": "Charitable incorporated organisation",
  "further-education-or-sixth-form-college-corporation":
    "Further education / sixth form corporation",
};

function formatCompanyType(type: string | undefined): string | null {
  if (!type) return null;
  if (COMPANY_TYPE_LABELS[type]) return COMPANY_TYPE_LABELS[type];
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function statusBadgeClassName(status: CompanyStatus | undefined): string {
  if (status === "active") return "border-transparent bg-status-active-bg text-status-active-fg";
  if (status === "dissolved" || status === "liquidation" || status === "administration") {
    return "border-transparent bg-status-negative-bg text-status-negative-fg";
  }
  return "";
}

// Module-level so results survive re-renders (and re-mounts within the same
// page load) without a dedicated cache layer — this is a small, low-stakes
// lookup, not data that needs invalidation. Only the first page is cached;
// "load more" pages are always fetched fresh.
const searchCache = new Map<string, { companies: CompanySearchResult[]; totalResults: number }>();

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<CompanySearchResult | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();
  const helperId = `${id}-helper`;

  const effectiveTerm = activeLetter ?? debouncedValue.trim();

  useEffect(() => {
    const term = effectiveTerm;
    if (!isValidQuery(term)) {
      abortRef.current?.abort();
      setResults([]);
      setTotalResults(0);
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    const cacheKey = term.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setResults(cached.companies);
      setTotalResults(cached.totalResults);
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
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        let data: { companies?: CompanySearchResult[]; totalResults?: number; error?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            data?.error ??
              "Company search is temporarily unavailable. You can continue without selecting a company."
          );
          setResults([]);
          setTotalResults(0);
          return;
        }
        const found = data?.companies ?? [];
        const total = data?.totalResults ?? found.length;
        searchCache.set(cacheKey, { companies: found, totalResults: total });
        setResults(found);
        setTotalResults(total);
        setStatus("idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
        setErrorMessage(
          "Company search is temporarily unavailable. You can continue without selecting a company."
        );
        setResults([]);
        setTotalResults(0);
      }
    })();

    return () => controller.abort();
  }, [effectiveTerm]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

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

  const trimmedValue = value.trim();
  const showDropdown = isOpen && (trimmedValue.length >= MIN_QUERY_LENGTH || activeLetter !== null);
  const showManualOption = showDropdown && status !== "loading" && trimmedValue.length > 0;
  const manualOptionIndex = results.length;

  function selectLetter(letter: string | null) {
    setActiveLetter(letter);
    onChange("");
    if (selected) onSelect?.(null);
    setIsOpen(true);
    inputRef.current?.focus();
  }

  const activeDescendant =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  function selectCompany(company: CompanySearchResult) {
    setSelected(company);
    onChange(company.name);
    onSelect?.(company);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function applyManualEntry() {
    setSelected(null);
    onSelect?.(null);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function clearSelection() {
    setSelected(null);
    setActiveLetter(null);
    onChange("");
    onSelect?.(null);
    setResults([]);
    setStatus("idle");
    setErrorMessage(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function loadMore() {
    const term = effectiveTerm;
    if (!isValidQuery(term) || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/companies/search?q=${encodeURIComponent(term)}&start_index=${results.length}`
      );
      const data: { companies?: CompanySearchResult[]; totalResults?: number } | null = await res
        .json()
        .catch(() => null);
      if (!res.ok || !data?.companies) return;
      setResults((prev) => [...prev, ...data.companies!]);
      if (typeof data.totalResults === "number") setTotalResults(data.totalResults);
    } finally {
      setLoadingMore(false);
    }
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
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  const statusMessage = useMemo(() => {
    if (status === "loading") return "Searching Companies House…";
    if (status === "error") return errorMessage ?? "Company search is temporarily unavailable. You can still continue without selecting a company.";
    if (status === "idle" && results.length === 0) return "No UK companies found";
    return null;
  }, [status, errorMessage, results.length]);

  if (selected) {
    const statusLabel = formatStatus(selected.status);
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-ink px-3.5 py-2.5">
        <Building2 className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line p-1 text-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{selected.name}</p>
          {selected.companyNumber ? (
            <p className="mt-0.5 truncate text-xs text-muted">Company no. {selected.companyNumber}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Companies House
            {statusLabel ? <span className="text-muted">· {statusLabel}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Clear selected company"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        role="group"
        aria-label="Browse UK companies alphabetically"
        className="mb-2 flex flex-wrap gap-1"
      >
        <button
          type="button"
          onClick={() => selectLetter(null)}
          aria-pressed={activeLetter === null}
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
            activeLetter === null
              ? "bg-accent/25 text-accent"
              : "text-muted hover:bg-accent/10 hover:text-white"
          )}
        >
          All
        </button>
        {LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => selectLetter(letter)}
            aria-pressed={activeLetter === letter}
            aria-label={`Browse companies starting with ${letter}`}
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
              activeLetter === letter
                ? "bg-accent/25 text-accent"
                : "text-muted hover:bg-accent/10 hover:text-white"
            )}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          aria-describedby={helperId}
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (activeLetter) setActiveLetter(null);
            if (selected) onSelect?.(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Search UK companies"}
          className={status === "loading" ? "pr-9" : undefined}
        />
        {status === "loading" ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p id={helperId} className="mt-1.5 text-xs text-muted">
        Start typing to search UK companies
      </p>

      <div
        className={cn(
          "absolute left-0 right-0 z-20 mt-1.5 max-w-full origin-top overflow-hidden rounded-lg border border-line bg-ink shadow-lg transition-all duration-150",
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
              Searching Companies House…
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
                  const typeLabel = formatCompanyType(company.type);
                  const locationParts = company.address
                    ? [company.address.locality, company.address.postalCode].filter(Boolean)
                    : company.location
                      ? [company.location]
                      : [];
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
                      <Building2
                        className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line p-1 text-muted"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {highlightMatch(company.name, value)}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
                          {company.companyNumber ? <span>{company.companyNumber}</span> : null}
                          {statusLabel ? (
                            <>
                              {company.companyNumber ? <span aria-hidden="true">·</span> : null}
                              <Badge
                                variant="outline"
                                className={cn("border-transparent px-1.5 py-0", statusBadgeClassName(company.status))}
                              >
                                {statusLabel}
                              </Badge>
                            </>
                          ) : null}
                          {typeLabel ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{typeLabel}</span>
                            </>
                          ) : null}
                        </div>
                        {locationParts.length > 0 ? (
                          <div className="mt-0.5 truncate text-xs text-muted/80">
                            {locationParts.join(" · ")}
                          </div>
                        ) : null}
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

              {results.length > 0 && results.length < totalResults ? (
                <li className="border-t border-line px-3 py-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {loadingMore ? "Loading…" : "Load more companies"}
                  </button>
                </li>
              ) : null}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
