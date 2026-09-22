"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { DEFAULT_MOBILE_COUNTRY } from "@/lib/contact/phone";

export interface PhoneNumberFieldProps {
  value: string;
  country: string;
  onValueChange: (value: string) => void;
  onCountryChange: (country: string) => void;
  error?: string;
  helperId?: string;
}

// Digits plus the characters people commonly type/paste into a phone field —
// spaces, parentheses, hyphens and a leading "+" for international numbers.
const ALLOWED_CHARS = /[^\d\s()+-]/g;

function sanitizeNumber(raw: string): string {
  return raw.replace(ALLOWED_CHARS, "");
}

interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

// Intl.DisplayNames resolves region names from the runtime's bundled CLDR
// data, which can differ between Node (SSR) and the browser (client) — e.g.
// "Falkland Islands (Islas Malvinas)" vs "Falkland Islands". Using it during
// the initial render would make the SSR HTML disagree with the client's
// first paint, so it's deferred to a client-only effect after mount.
function buildCountryOptions(useDisplayNames: boolean): CountryOption[] {
  const displayNames =
    useDisplayNames && typeof Intl !== "undefined" && "DisplayNames" in Intl
      ? new Intl.DisplayNames(["en"], { type: "region" })
      : null;

  return getCountries()
    .map((code) => ({
      code,
      name: displayNames?.of(code) ?? code,
      callingCode: getCountryCallingCode(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function PhoneNumberField({
  value,
  country,
  onValueChange,
  onCountryChange,
  error,
  helperId,
}: PhoneNumberFieldProps) {
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>(() =>
    buildCountryOptions(false)
  );

  useEffect(() => {
    setCountryOptions(buildCountryOptions(true));
  }, []);

  const errorId = "mobile-error";
  const describedBy = [helperId, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    onValueChange(sanitizeNumber(event.target.value));
  }

  return (
    <div>
      <label htmlFor="mobile" className="mb-2 block text-sm text-muted">
        Mobile number <span className="text-xs">(optional)</span>
      </label>

      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg border border-line bg-transparent transition-colors focus-within:border-accent",
          error && "border-red-400/60"
        )}
      >
        <select
          id="mobileCountry"
          name="mobileCountry"
          aria-label="Mobile number country"
          value={country || DEFAULT_MOBILE_COUNTRY}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-[7.5rem] shrink-0 border-r border-line bg-transparent px-3 py-3 text-paper outline-none sm:w-36"
          style={{ fontSize: "16px" }}
        >
          {countryOptions.map((option) => (
            <option key={option.code} value={option.code} className="bg-ink">
              {option.name} +{option.callingCode}
            </option>
          ))}
        </select>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="7123 456789"
          value={value}
          onChange={handleNumberChange}
          aria-label="Mobile number"
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="w-full min-w-0 bg-transparent px-4 py-3 text-paper placeholder:text-muted/60 outline-none"
          style={{ fontSize: "16px" }}
        />
      </div>

      <p id={helperId} className="mt-1.5 text-xs text-muted">
        UK numbers can be entered with or without +44.
      </p>

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
