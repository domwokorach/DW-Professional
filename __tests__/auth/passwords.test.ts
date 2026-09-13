import { hashPassword, verifyPassword, checkPasswordStrength } from '@/lib/auth/passwords';

describe('hashPassword / verifyPassword', () => {
  it('round-trips a password through a real bcrypt hash', async () => {
    const hash = await hashPassword('CorrectHorse9!Battery');
    expect(hash).not.toBe('CorrectHorse9!Battery');
    await expect(verifyPassword('CorrectHorse9!Battery', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a real hash', async () => {
    const hash = await hashPassword('CorrectHorse9!Battery');
    await expect(verifyPassword('WrongPassword1!', hash)).resolves.toBe(false);
  });
});

describe('checkPasswordStrength', () => {
  it('flags a password that is too short', () => {
    const result = checkPasswordStrength('Sh0rt!');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Use at least 10 characters.');
  });

  it('flags a missing lowercase letter', () => {
    const result = checkPasswordStrength('ALLUPPER123!');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Include a lowercase letter.');
  });

  it('flags a missing uppercase letter', () => {
    const result = checkPasswordStrength('alllower123!');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Include an uppercase letter.');
  });

  it('flags a missing number', () => {
    const result = checkPasswordStrength('NoNumbersHere!');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Include a number.');
  });

  it('flags a missing symbol', () => {
    const result = checkPasswordStrength('NoSymbolsHere123');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Include a symbol.');
  });

  it('accepts a fully valid password', () => {
    const result = checkPasswordStrength('CorrectHorse9!Battery');
    expect(result).toEqual({ valid: true, reasons: [] });
  });
});
