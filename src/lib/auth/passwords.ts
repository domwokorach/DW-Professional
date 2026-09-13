import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface PasswordStrengthResult {
  valid: boolean;
  reasons: string[];
}

/** Minimum bar enforced server-side; the UI additionally guides toward stronger passwords. */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const reasons: string[] = [];
  if (password.length < 10) reasons.push("Use at least 10 characters.");
  if (!/[a-z]/.test(password)) reasons.push("Include a lowercase letter.");
  if (!/[A-Z]/.test(password)) reasons.push("Include an uppercase letter.");
  if (!/[0-9]/.test(password)) reasons.push("Include a number.");
  if (!/[^A-Za-z0-9]/.test(password)) reasons.push("Include a symbol.");
  return { valid: reasons.length === 0, reasons };
}
