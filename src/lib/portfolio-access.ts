// Portfolio Access form rules shared by the browser form and the /api/portfolio-access route.
// The server re-runs every check and is the final authority; client validation is only for fast feedback.

export type AccessFields = {
  fullName: string;
  email: string;
  mobile: string;
  company: string;
};
export type AccessField = keyof AccessFields;
export type AccessErrors = Partial<Record<AccessField, string>>;

export const ACCESS_FIELDS: AccessField[] = ['fullName', 'email', 'mobile', 'company'];
export const ACCESS_LIMITS = { fullName: 100, email: 254, mobile: 24, company: 120 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// International-friendly: optional leading +, then digits, spaces, dashes, dots and brackets
// ("07700 900123", "+44 7700 900123", "+1 (415) 555-0100", "0049 151 23456789").
const PHONE = /^\+?[\d\s\-().]+$/;
// Control characters never belong in these single-line fields.
const CONTROL = /[\u0000-\u001f\u007f]/;

export function validateAccessField(field: AccessField, raw: string): string | undefined {
  const value = raw.trim();
  if (value.length > ACCESS_LIMITS[field]) {
    return field === 'company'
      ? `Please keep the company name under ${ACCESS_LIMITS.company} characters.`
      : field === 'fullName'
        ? `Please keep your name under ${ACCESS_LIMITS.fullName} characters.`
        : field === 'email'
          ? 'Please enter a valid email address.'
          : 'Please enter a valid mobile number, including the country code if outside the UK.';
  }
  if (CONTROL.test(value)) return 'Please remove any unusual characters.';
  switch (field) {
    case 'fullName':
      if (!value) return 'Please enter your full name.';
      if (value.length < 2) return 'Please enter your full name.';
      return;
    case 'email':
      if (!value) return 'Please enter your email address.';
      if (!EMAIL.test(value)) return 'Please enter a valid email address, like name@company.com.';
      return;
    case 'mobile': {
      if (!value) return 'Please enter your mobile number.';
      // 7–15 digits covers UK and international numbers (E.164 allows at most 15).
      const digits = value.replace(/\D/g, '').length;
      if (!PHONE.test(value) || digits < 7 || digits > 15) {
        return 'Please enter a valid mobile number, including the country code if outside the UK.';
      }
      return;
    }
    case 'company':
      return; // optional, like the contact form's Company field
  }
}

export function validateAccess(fields: AccessFields): AccessErrors {
  const errors: AccessErrors = {};
  for (const key of ACCESS_FIELDS) {
    const error = validateAccessField(key, fields[key]);
    if (error) errors[key] = error;
  }
  return errors;
}

/** Trims every field and collapses runs of whitespace (the values are single-line). */
export function cleanAccess(fields: AccessFields): AccessFields {
  const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();
  return {
    fullName: tidy(fields.fullName),
    email: fields.email.trim(),
    mobile: tidy(fields.mobile),
    company: tidy(fields.company),
  };
}
