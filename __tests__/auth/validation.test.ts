import {
  emailSchema,
  newPasswordSchema,
  signInSchema,
  changeEmailSchema,
  updateSettingsSchema,
  updateProfileSchema,
} from '@/lib/auth/validation';

describe('emailSchema', () => {
  it('trims and lowercases a valid email', () => {
    const result = emailSchema.safeParse('  ADMIN@Example.COM  ');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('admin@example.com');
  });

  it('rejects a malformed email', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });
});

describe('newPasswordSchema', () => {
  it('rejects a too-short password', () => {
    expect(newPasswordSchema.safeParse('Sh0rt!').success).toBe(false);
  });

  it('rejects a password missing a lowercase letter', () => {
    expect(newPasswordSchema.safeParse('ALLUPPER123!').success).toBe(false);
  });

  it('rejects a password missing an uppercase letter', () => {
    expect(newPasswordSchema.safeParse('alllower123!').success).toBe(false);
  });

  it('rejects a password missing a number', () => {
    expect(newPasswordSchema.safeParse('NoNumbersHere!').success).toBe(false);
  });

  it('rejects a password missing a symbol', () => {
    expect(newPasswordSchema.safeParse('NoSymbolsHere123').success).toBe(false);
  });

  it('accepts a strong password', () => {
    expect(newPasswordSchema.safeParse('CorrectHorse9!Battery').success).toBe(true);
  });
});

describe('signInSchema', () => {
  it('defaults rememberMe to false when omitted', () => {
    const result = signInSchema.safeParse({ email: 'admin@example.com', password: 'anything' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(false);
  });

  it('accepts an explicit rememberMe: true', () => {
    const result = signInSchema.safeParse({
      email: 'admin@example.com',
      password: 'anything',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rememberMe).toBe(true);
  });

  it('rejects a missing email/password', () => {
    expect(signInSchema.safeParse({}).success).toBe(false);
  });
});

describe('changeEmailSchema', () => {
  it('accepts a valid current password and new email', () => {
    const result = changeEmailSchema.safeParse({
      currentPassword: 'whatever',
      newEmail: 'new@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed new email', () => {
    const result = changeEmailSchema.safeParse({
      currentPassword: 'whatever',
      newEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateSettingsSchema', () => {
  it('accepts a partial notifications object', () => {
    const result = updateSettingsSchema.safeParse({
      notifications: { sound: false },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notifications).toEqual({ sound: false });
  });

  it('accepts a fully empty object (all fields optional)', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid availability enum value', () => {
    expect(updateSettingsSchema.safeParse({ availability: 'NOT_A_STATE' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts avatarUrl: null', () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBeNull();
  });

  it('accepts a valid name and avatarUrl', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Dominic',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-URL avatarUrl', () => {
    expect(updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' }).success).toBe(false);
  });
});
