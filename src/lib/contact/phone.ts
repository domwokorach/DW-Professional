/**
 * Shared mobile number handling for the "Have a project in mind?" contact
 * form. Imported by both the client field (src/components/ui/PhoneNumberField.tsx,
 * Contact.tsx) for inline validation and by the server route
 * (src/app/api/contact/route.ts) for authoritative validation — the server
 * never trusts a client-normalised value, it re-derives E.164 itself from
 * the raw digits + selected country.
 */
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export const DEFAULT_MOBILE_COUNTRY: CountryCode = "GB";

export const MOBILE_INVALID_ERROR = "Enter a valid mobile number.";

export interface NormalizeMobileResult {
  /** E.164 formatted number, or null when no number was supplied. */
  value: string | null;
  error: string | null;
}

/** Empty/whitespace-only input is valid (the field is optional) and normalises to `value: null`. */
export function normalizeMobileNumber(
  rawValue: string | null | undefined,
  country: string | null | undefined
): NormalizeMobileResult {
  const trimmed = (rawValue ?? "").trim();
  if (!trimmed) return { value: null, error: null };

  const countryCode = ((country ?? "").trim().toUpperCase() || DEFAULT_MOBILE_COUNTRY) as CountryCode;
  const parsed = parsePhoneNumberFromString(trimmed, countryCode);
  if (!parsed || !parsed.isValid()) {
    return { value: null, error: MOBILE_INVALID_ERROR };
  }
  return { value: parsed.number, error: null };
}
