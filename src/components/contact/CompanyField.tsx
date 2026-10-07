'use client';

import { useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import {
  COMPANY_SEARCH_MIN,
  type CompanySearchResponse,
  type CompanySummary,
  type CompanyVerifyResponse,
} from '@/lib/companies';
import { Combobox, ComboboxContent, ComboboxItem, ComboboxList, ComboboxPrimitive } from '@/components/ui/motion/combobox';

export type CompanySelection = CompanySummary & { verified?: boolean };

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

const DEBOUNCE_MS = 300;

type Props = {
  id: string;
  /** The text in the field: what is sent as "company", whether picked from the list or typed by hand. */
  value: string;
  selection: CompanySelection | null;
  onTextChange: (text: string) => void;
  onSelectionChange: (company: CompanySelection | null) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
  maxLength: number;
  variant?: 'contact' | 'comment';
  disabled?: boolean;
};

const details = (c: CompanySummary) => [c.companyStatus, c.locality].filter(Boolean).join(' · ');

function companyNameWithMatch(name: string, query: string) {
  const term = query.trim();
  const at = name.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
  if (!term || at < 0) return name;
  return <>{name.slice(0, at)}<mark className="company-option__match">{name.slice(at, at + term.length)}</mark>{name.slice(at + term.length)}</>;
}

/**
 * Shared optional Company field: a text input with UK company suggestions.
 * Suggestions come from /api/companies/search (the imported Companies House dataset), debounced,
 * with stale responses dropped. Picking one records its company number and asks
 * /api/companies/verify for the live Companies House details. Typing over a pick, or never picking,
 * leaves a plain name: no company has to be selected, and if search isn't configured or fails the
 * field simply behaves as a text input.
 * Keyboard and screen-reader behaviour (combobox role, arrows, Enter, Escape, Tab) comes from Base UI.
 */
export default function CompanyField({ id, value, selection, onTextChange, onSelectionChange, onBlur, invalid, describedBy, maxLength, variant = 'contact', disabled = false }: Props) {
  const [results, setResults] = useState<CompanySummary[]>([]);
  const [state, setState] = useState<SearchState>('idle');
  const [open, setOpen] = useState(false);
  // 404 from the search API: the feature isn't configured here, so stop offering suggestions.
  const [unavailable, setUnavailable] = useState(false);
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const selectedId = `${id}-selected`;

  const query = value.trim();
  // The text is exactly the picked company: nothing to search for.
  const showingSelection = Boolean(selection && value === selection.companyName);

  useEffect(() => {
    if (unavailable || showingSelection || query.length < COMPANY_SEARCH_MIN) {
      setState('idle');
      setResults([]);
      return;
    }
    setState('loading');
    const controller = new AbortController();
    // Debounce; the cleanup cancels the timer and any request still in flight, so an older
    // response can never replace a newer query's results.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (res.status === 404) {
          setUnavailable(true);
          return;
        }
        if (res.status === 400) {
          // Characters the search doesn't accept: not an error the visitor needs to see.
          setResults([]);
          setState('empty');
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as CompanySearchResponse;
        if (controller.signal.aborted) return;
        setResults(body.companies);
        setState(body.companies.length ? 'results' : 'empty');
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setState('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, showingSelection, unavailable]);

  async function verify(company: CompanySummary) {
    try {
      const res = await fetch(`/api/companies/verify?number=${encodeURIComponent(company.companyNumber)}`);
      if (!res.ok) return; // keep the pick as it is
      const body = (await res.json()) as CompanyVerifyResponse;
      const current = selectionRef.current;
      if (current?.companyNumber !== company.companyNumber) return; // changed since
      onSelectionChange({ ...body.company, verified: body.verified });
      // The company was renamed since the dataset was made: show the current name.
      if (body.company.companyName !== current.companyName) onTextChange(body.company.companyName);
    } catch {
      // Network failure: the selection from search stays.
    }
  }

  function select(company: CompanySummary | null) {
    if (!company) return;
    onSelectionChange(company);
    onTextChange(company.companyName);
    setOpen(false);
    void verify(company);
  }

  function clear() {
    onSelectionChange(null);
    onTextChange('');
    setOpen(false);
    inputRef.current?.focus();
  }

  const popupOpen = open && !unavailable && !showingSelection && query.length >= COMPANY_SEARCH_MIN;
  const announcement = !popupOpen
    ? selection && showingSelection
      ? `Selected ${selection.companyName}, company number ${selection.companyNumber}.`
      : ''
    : state === 'loading'
      ? 'Searching UK companies…'
      : state === 'results'
        ? `${results.length} ${results.length === 1 ? 'company' : 'companies'} found. Use the up and down arrow keys to choose one.`
        : state === 'empty'
          ? 'No matching UK companies found.'
          : state === 'error'
            ? 'Company suggestions are unavailable right now.'
            : '';

  return (
    <MotionConfig reducedMotion="user">
      <Combobox<CompanySummary, false>
        items={results}
        filter={null}
        value={showingSelection ? selection : null}
        onValueChange={(company) => select(company)}
        inputValue={value}
        onInputValueChange={(text, details) => {
          // Only the visitor's own typing changes the text. Base UI's resets (Escape, close, blur)
          // are ignored, so a name typed by hand is never wiped; the × button clears deliberately.
          if (details.reason !== 'input-change') return;
          onTextChange(text);
          if (selection && text !== selection.companyName) onSelectionChange(null);
        }}
        open={popupOpen}
        onOpenChange={setOpen}
        itemToStringLabel={(c) => c.companyName}
        isItemEqualToValue={(a, b) => a.companyNumber === b.companyNumber}
      >
        <div className={`company-input-wrap${variant === 'comment' ? ' company-input-wrap--comment' : ''}`} data-filled={value ? '' : undefined}>
          <ComboboxPrimitive.Input
            ref={inputRef}
            id={id}
            name="company"
            className="contact-control company-input"
            placeholder="Start typing a company name…"
            autoComplete="organization"
            maxLength={maxLength}
            spellCheck={false}
            disabled={disabled}
            onBlur={onBlur}
            aria-invalid={invalid || undefined}
            aria-describedby={[describedBy, selection && showingSelection ? selectedId : undefined].filter(Boolean).join(' ') || undefined}
          />
          {value && !disabled && (
            <button type="button" className="company-clear" onClick={clear} aria-label={selection ? `Remove ${selection.companyName}` : 'Clear company'}>
              <XIcon aria-hidden="true" />
            </button>
          )}
        </div>

        <ComboboxContent
          className={`project-type-popup company-popup${variant === 'comment' ? ' company-popup--comment' : ''}`}
          aria-label="Company suggestions"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {state === 'loading' && (
            <p className="company-popup__note" aria-hidden="true"><span className="company-spinner" />Searching UK companies…</p>
          )}
          {state === 'empty' && (
            <p className="company-popup__note">No matching UK companies found<span>You can keep the name you typed.</span></p>
          )}
          {state === 'error' && (
            <p className="company-popup__note">Suggestions are unavailable right now<span>You can still type your company name.</span></p>
          )}
          <ComboboxList>
            {(company: CompanySummary) => (
              <ComboboxItem key={company.companyNumber} value={company} className="company-option">
                <span className="company-option__name">{companyNameWithMatch(company.companyName, query)}</span>
                <span className="company-option__meta">
                  <span className="company-option__number">Company no. {company.companyNumber}</span>
                  {details(company) && <span>{details(company)}</span>}
                  {company.companyType && <span>{company.companyType}</span>}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {selection && showingSelection && (
        <p className={`company-selected${variant === 'comment' ? ' company-selected--comment' : ''}`} id={selectedId}>
          {variant === 'comment' && <span className="company-selected__label">✓ Company verified {selection.verified ? 'with Companies House' : 'against the UK company register'}</span>}
          <span className="company-selected__number">Company no. {selection.companyNumber}</span>
          {selection.companyStatus && <span>{selection.companyStatus}</span>}
          {selection.address && <span className="company-selected__address">{selection.address}</span>}
          {selection.verified && <span className="company-selected__verified">Verified with Companies House</span>}
        </p>
      )}
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </MotionConfig>
  );
}
