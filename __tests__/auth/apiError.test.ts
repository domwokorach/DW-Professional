import { z } from 'zod';
import { apiError, validationError } from '@/lib/auth/apiError';
import { signInSchema } from '@/lib/auth/validation';

describe('apiError', () => {
  it('returns a JSON response with the given status and body', async () => {
    const response = apiError('not_found', 'Resource not found.', 404);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: { code: 'not_found', message: 'Resource not found.' } });
  });

  it('includes fields when provided', async () => {
    const response = apiError('validation_error', 'Bad input.', 422, { email: 'Invalid email.' });
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body).toEqual({
      error: { code: 'validation_error', message: 'Bad input.', fields: { email: 'Invalid email.' } },
    });
  });
});

describe('validationError', () => {
  it('builds a 422 response with one field entry per invalid path', async () => {
    const parsed = signInSchema.safeParse({});
    expect(parsed.success).toBe(false);

    const response = validationError(parsed.error!);
    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.error.code).toBe('validation_error');
    expect(body.error.fields).toHaveProperty('email');
    expect(body.error.fields).toHaveProperty('password');
  });

  it('keys a root-level (path-less) issue under "_root"', async () => {
    const rootRefinedSchema = z.object({ a: z.string() }).refine(() => false, { message: 'Object-level failure.' });
    const parsed = rootRefinedSchema.safeParse({ a: 'x' });
    expect(parsed.success).toBe(false);

    const response = validationError(parsed.error!);
    const body = await response.json();
    expect(body.error.fields).toEqual({ _root: 'Object-level failure.' });
  });

  it('keeps only the first message when multiple issues share the same path', async () => {
    const dupPathSchema = z
      .string()
      .refine((v) => v.length > 5, 'Too short.')
      .refine((v) => /[0-9]/.test(v), 'Needs a digit.');
    const parsed = dupPathSchema.safeParse('abc');
    expect(parsed.success).toBe(false);

    const response = validationError(parsed.error!);
    const body = await response.json();
    // Both refinements fail against the same (empty) path — only the first
    // message registered for that key should survive.
    expect(body.error.fields._root).toBe('Too short.');
  });
});
