'use client';

import { useRef, useState, type FormEvent } from 'react';

/**
 * Admin sign-in form (email + password). It posts to /api/admin/login, which validates the credentials on the
 * server and sets an HttpOnly session cookie; this component never sees or stores a token. Failures always show
 * the same generic message.
 */
export default function AdminLoginForm({ next, expired }: { next: string; expired: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      document.getElementById(email.trim() ? 'adm-password' : 'adm-email')?.focus();
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next }),
        credentials: 'same-origin',
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; redirect?: string; message?: string };
      if (res.ok && data.ok) {
        setPassword('');
        // A full navigation, so the protected page is rendered on the server with the new session.
        window.location.assign(data.redirect || '/admin/comments');
        return;
      }
      setPassword('');
      // Only a rejected sign-in is "invalid"; a server failure says so instead of blaming the credentials.
      setError(data.message || (res.status === 401 ? 'Invalid email or password.' : 'Sign-in is not available right now. Please try again shortly.'));
      document.getElementById('adm-password')?.focus();
    } catch {
      setError('Sign-in failed. Please check your connection and try again.');
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form className="adm-card adm-login__card" onSubmit={onSubmit} noValidate aria-labelledby="adm-login-title" aria-busy={submitting}>
      <p className="adm-kicker">PORTFOLIO ADMIN</p>
      <h1 id="adm-login-title" className="adm-title">Sign in</h1>

      {expired && !error && (
        <p className="adm-notice" role="status">Your admin session has expired. Please sign in again.</p>
      )}

      <div className="cm-field">
        <label htmlFor="adm-email">Email</label>
        <input
          id="adm-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          maxLength={254}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'adm-login-error' : undefined}
        />
      </div>
      <div className="cm-field">
        <label htmlFor="adm-password">Password</label>
        <input
          id="adm-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          maxLength={256}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'adm-login-error' : undefined}
        />
      </div>

      <div role="alert">
        {error && <p className="cm-status__err" id="adm-login-error"><strong>{error}</strong></p>}
      </div>

      <button type="submit" className="cm-submit adm-submit" disabled={submitting}>
        {submitting && <span className="cm-spinner" aria-hidden="true" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
