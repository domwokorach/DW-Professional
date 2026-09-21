"use client";

import { useState } from "react";
import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COUNTRIES = {
  GB: {
    name: "United Kingdom",
    flag: "🇬🇧",
    callingCode: "+44",
    placeholder: "07123 456789",
  },
  US: {
    name: "United States",
    flag: "🇺🇸",
    callingCode: "+1",
    placeholder: "(202) 555-0123",
  },
  TH: {
    name: "Thailand",
    flag: "🇹🇭",
    callingCode: "+66",
    placeholder: "081 234 5678",
  },
} as const satisfies Record<
  string,
  { name: string; flag: string; callingCode: string; placeholder: string }
>;

type SupportedCountry = keyof typeof COUNTRIES;

export interface MobileNumberChange {
  /** What's currently in the text field, formatted as-you-type. */
  raw: string;
  /** E.164 form (e.g. +447123456789), only set once the number validates. */
  e164: string | null;
  isValid: boolean;
}

interface MobileNumberInputProps {
  id: string;
  onChange: (result: MobileNumberChange) => void;
  required?: boolean;
}

export default function MobileNumberInput({
  id,
  onChange,
  required,
}: MobileNumberInputProps) {
  const [country, setCountry] = useState<SupportedCountry>("GB");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [validE164, setValidE164] = useState<string | null>(null);
  const helperId = `${id}-helper`;

  const countryCode = country as CountryCode;
  const selected = COUNTRIES[country];

  function handleChange(input: string) {
    const formatted = new AsYouType(countryCode).input(input);
    setValue(formatted);
    setError("");

    const phone = parsePhoneNumberFromString(input, countryCode);
    const isValid = phone?.isValid() ?? false;
    const e164 = isValid ? phone!.number : null;
    setValidE164(e164);
    onChange({ raw: formatted, e164, isValid });
  }

  function handleBlur() {
    if (!value) return;
    const phone = parsePhoneNumberFromString(value, countryCode);
    if (!phone?.isValid()) {
      setError(`Enter a valid ${selected.name} phone number.`);
    }
  }

  function handleCountryChange(next: SupportedCountry) {
    setCountry(next);
    setValue("");
    setError("");
    setValidE164(null);
    onChange({ raw: "", e164: null, isValid: false });
  }

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex rounded-md border border-line bg-ink shadow-sm transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-accent"
        )}
      >
        <select
          value={country}
          onChange={(e) => handleCountryChange(e.target.value as SupportedCountry)}
          aria-label="Country"
          className="shrink-0 rounded-l-md border-r border-line bg-transparent px-2 py-1 text-sm text-white outline-none"
        >
          {Object.entries(COUNTRIES).map(([code, item]) => (
            <option key={code} value={code} className="bg-ink text-white">
              {item.flag} {item.name} {item.callingCode}
            </option>
          ))}
        </select>

        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required={required}
          maxLength={20}
          value={value}
          placeholder={selected.placeholder}
          aria-describedby={helperId}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className="min-w-0 flex-1 rounded-l-none border-0 shadow-none focus-visible:outline-none"
        />
      </div>

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : validE164 ? (
        <p id={helperId} className="text-xs text-accent">
          Valid mobile number · International: {validE164}
        </p>
      ) : (
        <p id={helperId} className="text-xs text-muted">
          e.g. {selected.placeholder}
        </p>
      )}
    </div>
  );
}
