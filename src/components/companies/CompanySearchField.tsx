"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, CheckCircle2, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { CompanySearchResult, CompanyStatus } from "@/types/company";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

const DEFAULT_INPUT_CLASSES =
  "flex h-9 w-full rounded-md border border-line bg-ink px-3 py-1 text-base text-paper shadow-sm transition-colors placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export interface CompanySearchFieldProps {
  id: string;
  /** Sets the `name` attribute on the visible text input, so a plain `new FormData(form)` picks up the typed/selected company name. */
  name?: string;
  value: string;
  onChange: (value: string) => void;
  /** Fires with the selected company's metadata, or null once the value no longer represents a confirmed selection (manual edit, cleared, or "use as entered"). */
  onSelect?: (company: CompanySearchResult | null) => void;
  inputClassName?: string;
  helperId?: string;
  placeholder?: string;
  maxLength?: number;
}

function formatStatus(status: CompanyStatus | undefined): string | null {
  if (!status) return null;
  return status
    .split(/[-\s]+/)
    .filter(Boolean)
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

function highlightMatch(name: string, term: string) {
  if (!term.trim()) return name;
  const index = name.toLowerCase().indexOf(term.trim().toLowerCase());
  if (index === -1) return name;
  return (
    <>
      {name.slice(0, index)}
      <mark className="rounded-sm bg-accent/30 text-paper">{name.slice(index, index + term.length)}</mark>
      {name.slice(index + term.length)}
    </>
  );
}

/**
 * "Company (optional)" autocomplete backed by the imported CSV company
 * dataset (/api/companies/search, reading CompanyRecord — see
 * src/lib/companies/search.ts). The input is always the source of truth
 * for the field's value, so free typing (a company not in the dataset)
 * stays valid — selecting a result is a shortcut, not a requirement.
 */
export default function CompanySearchField({
  id,
  name,
  value,
  onChange,
  onSelect,
  inputClassName,
  helperId,
  placeholder,
  maxLength = 160,
}: CompanySearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState<CompanySearchResult | null>(null);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();
  const generatedHelperId = useId();
  const resolvedHelperId = helperId ?? generatedHelperId;

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
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        let data: { companies?: CompanySearchResult[]; error?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
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

  const trimmedValue = value.trim();
  const showDropdown = isOpen && trimmedValue.length >= MIN_QUERY_LENGTH;
  const showManualOption = showDropdown && status !== "loading" && trimmedValue.length > 0;
  const manualOptionIndex = results.length;

  const activeDescendant = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

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
    onChange("");
    onSelect?.(null);
    setResults([]);
    setStatus("idle");
    setErrorMessage(null);
    requestAnimationFrame(() => inputRef.current?.focus());
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
    if (status === "loading") return "Searching companies...";
    if (status === "error") return errorMessage ?? "Unable to load companies. Please try again.";
    if (status === "idle" && results.length === 0) return "No companies found.";
    return null;
  }, [status, errorMessage, results.length]);

  if (selected) {
    const statusLabel = formatStatus(selected.status);
    const locationParts = selected.address
      ? [selected.address.locality, selected.address.postalCode].filter(Boolean)
      : selected.location
        ? [selected.location]
        : [];
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-ink px-3.5 py-2.5">
        {/* Hidden so a plain `new FormData(form)` submission still carries the selected name under `name`, matching the plain-input case. */}
        {name ? <input type="hidden" name={name} value={selected.name} /> : null}
        <Building2 className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line p-1 text-muted" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-paper">{selected.name}</p>
          {selected.companyNumber ? (
            <p className="mt-0.5 truncate text-xs text-muted">Company no. {selected.companyNumber}</p>
          ) : null}
          {locationParts.length > 0 ? (
            <p className="mt-0.5 truncate text-xs text-muted">{locationParts.join(", ")}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Company directory
            {statusLabel ? <span className="text-muted">· {statusLabel}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Clear selected company"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          aria-describedby={resolvedHelperId}
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (selected) onSelect?.(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Search companies"}
          className={cn(inputClassName ?? DEFAULT_INPUT_CLASSES, status === "loading" ? "pr-9" : undefined)}
          style={{ fontSize: "16px" }}
        />
        {status === "loading" ? (
          <Loader2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {!helperId ? (
        <p id={resolvedHelperId} className="mt-1.5 text-xs text-muted">
          Start typing to search companies
        </p>
      ) : null}

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
            <li className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Searching companies...
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
                        index === activeIndex ? "bg-accent/20 text-paper" : "text-paper hover:bg-accent/10"
                      )}
                    >
                      <Building2
                        className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-line p-1 text-muted"
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
                        </div>
                        {locationParts.length > 0 ? (
                          <div className="mt-0.5 truncate text-xs text-muted/80">{locationParts.join(", ")}</div>
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
                    activeIndex === manualOptionIndex ? "bg-accent/20 text-paper" : "text-muted hover:bg-accent/10 hover:text-paper"
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
