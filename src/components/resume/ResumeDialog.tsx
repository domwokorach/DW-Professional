'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  PIN_PATTERN, RESUME_LIMITS, RESEND_COOLDOWN_MS, validateResume, validateResumeField, type ResumeErrors, type ResumeField,
} from '@/lib/resume-access';
import CompanyField, { type CompanySelection } from '@/components/contact/CompanyField';
import VerifiedPanel from './VerifiedPanel';

type Step = 'details' | 'verify' | 'done';
type Values = Record<ResumeField, string>;

const FIELDS: { name: ResumeField; label: string; type: string; autoComplete: string; placeholder: string }[] = [
  { name: 'fullName', label: 'Full name', type: 'text', autoComplete: 'name', placeholder: 'Jane Smith' },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', placeholder: 'jane@company.com' },
  { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization', placeholder: 'Company or agency' },
];
const STEPS: { id: Step; label: string }[] = [{ id: 'details', label: 'Details' }, { id: 'verify', label: 'Verify email' }, { id: 'done', label: 'Download' }];

async function post(path: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } catch {
    return { status: 0, data: {} };
  }
}

const clock = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

/** The four-step résumé flow: details, email sent + PIN, verified, automatic download. Rendered as a native modal <dialog>. */
export default function ResumeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  // The dialog element as state: the company suggestions must be mounted inside it (a modal makes everything outside inert).
  const [dialogEl, setDialogEl] = useState<HTMLDialogElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<Step>('details');
  const [values, setValues] = useState<Values>({ fullName: '', email: '', company: '' });
  const [errors, setErrors] = useState<ResumeErrors>({});
  // The UK company picked from the suggestions (the server re-checks it by number); null when typed by hand.
  const [company, setCompany] = useState<CompanySelection | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [busy, setBusy] = useState<'send' | 'verify' | 'resend' | null>(null);
  const [formError, setFormError] = useState('');
  const [recordId, setRecordId] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [notice, setNotice] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Native modal: focus trap, Escape and top-layer stacking come from the browser.
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Move focus to the step heading whenever the step changes, so screen readers announce it.
  useEffect(() => { if (open) heading.current?.focus(); }, [step, open]);

  useEffect(() => {
    if (step !== 'verify') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step]);

  const reset = useCallback(() => {
    setStep('details'); setErrors({}); setFormError(''); setPin(''); setPinError(''); setNotice(''); setRecordId(''); setExpiresAt(null); setBusy(null);
  }, []);

  const close = () => { onClose(); };
  // The dialog also closes on Escape / backdrop; keep the parent in sync and start fresh next time.
  const onDialogClose = () => { onClose(); reset(); };

  const setField = (name: ResumeField, value: string) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: validateResumeField(name, value) }));
  };

  async function submitDetails(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const found = validateResume(values);
    setErrors(found);
    setFormError('');
    const first = FIELDS.find((f) => found[f.name]);
    if (first) { dialog.current?.querySelector<HTMLInputElement>(`[name="${first.name}"]`)?.focus(); return; }

    setBusy('send');
    const companyNumber = company && values.company === company.companyName ? company.companyNumber : undefined;
    const { status, data } = await post('/api/resume/request', { ...values, companyNumber, website: honeypot });
    setBusy(null);
    if (status === 200 && typeof data.id === 'string') {
      setRecordId(data.id);
      setExpiresAt(typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : Date.now() + 10 * 60 * 1000);
      setResendAt(Date.now() + RESEND_COOLDOWN_MS);
      setNow(Date.now()); setPin(''); setPinError(''); setNotice(''); setStep('verify');
    } else if (status === 422 && data.errors) {
      setErrors(data.errors as ResumeErrors);
    } else if (status === 429) {
      setFormError('Too many requests from this connection. Please wait a few minutes and try again.');
    } else if (status === 502) {
      setFormError('We could not send the verification email. Please check the address and try again.');
    } else {
      setFormError('Something went wrong. Please try again in a moment.');
    }
  }

  async function submitPin(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!PIN_PATTERN.test(pin)) { setPinError('Enter the six-digit code from your email.'); return; }
    setBusy('verify'); setPinError('');
    const { status, data } = await post('/api/resume/verify', { id: recordId, pin });
    setBusy(null);
    if (status === 200) { setStep('done'); return; }
    const reason = data.error;
    setPinError(
      reason === 'expired' ? 'This code has expired. Send a new one below.'
      : reason === 'locked' ? 'Too many incorrect attempts. Send a new code below.'
      : status === 429 ? 'Too many attempts. Please wait a few minutes.'
      : status === 0 || status >= 500 ? 'Something went wrong. Please try again.'
      : 'That code is not correct. Check the email and try again.',
    );
  }

  async function resend() {
    if (busy || Date.now() < resendAt) return;
    setBusy('resend'); setPinError(''); setNotice('');
    const { status, data } = await post('/api/resume/resend', { id: recordId });
    setBusy(null);
    if (status === 200) {
      setExpiresAt(typeof data.expiresAt === 'string' ? Date.parse(data.expiresAt) : Date.now() + 10 * 60 * 1000);
      setResendAt(Date.now() + RESEND_COOLDOWN_MS); setNow(Date.now()); setPin('');
      setNotice('A new code is on its way. Check your inbox, spam or junk folder.');
    } else if (status === 429) {
      setPinError('Please wait a minute before requesting another email. You can request up to four an hour.');
    } else {
      setPinError('We could not send the email. Please try again shortly.');
    }
  }

  const remaining = expiresAt ? Math.max(0, expiresAt - now) : 0;
  const expired = step === 'verify' && expiresAt !== null && remaining === 0;
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const current = STEPS.findIndex((s) => s.id === step);

  return (
    <dialog
      ref={(el) => { dialog.current = el; setDialogEl(el); }}
      className="rs-dialog"
      aria-labelledby="rs-title"
      onClose={onDialogClose}
      onClick={(e) => { if (e.target === dialog.current) close(); }}
    >
      <div className="rs-card">
        <button type="button" className="rs-close" onClick={close} aria-label="Close résumé form"><span aria-hidden="true">×</span></button>

        <ol className="rs-steps" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className="rs-steps__item" data-state={i < current ? 'done' : i === current ? 'current' : 'todo'} aria-current={i === current ? 'step' : undefined}>
              <span className="rs-steps__dot" aria-hidden="true">{i < current ? '✓' : i + 1}</span>
              <span>{s.label}</span>
            </li>
          ))}
        </ol>

        {step === 'details' && (
          <div className="rs-panel" key="details">
            <p className="rs-eyebrow">Résumé access</p>
            <h2 id="rs-title" className="rs-title" tabIndex={-1} ref={heading}>Get my résumé</h2>
            <p className="rs-text">Verify your email to receive a copy of my professional résumé.</p>
            <form className="rs-form" onSubmit={submitDetails} noValidate>
              {FIELDS.map((f) => f.name === 'company' ? (
                <div className="rs-field" key={f.name}>
                  <label htmlFor="rs-company">{f.label}</label>
                  {dialogEl && <CompanyField
                    id="rs-company" variant="resume" value={values.company} selection={company} popupContainer={dialogEl}
                    maxLength={RESUME_LIMITS.company} invalid={Boolean(errors.company)} describedBy={errors.company ? 'rs-company-err' : undefined}
                    onTextChange={(text) => setField('company', text)} onSelectionChange={setCompany}
                    onBlur={() => values.company && setErrors((er) => ({ ...er, company: validateResumeField('company', values.company) }))}
                  />}
                  {errors.company && <p className="rs-error" id="rs-company-err" role="alert">{errors.company}</p>}
                </div>
              ) : (
                <div className="rs-field" key={f.name}>
                  <label htmlFor={`rs-${f.name}`}>{f.label}</label>
                  <input
                    id={`rs-${f.name}`} name={f.name} type={f.type} autoComplete={f.autoComplete} placeholder={f.placeholder}
                    maxLength={RESUME_LIMITS[f.name]} value={values[f.name]} required
                    aria-invalid={errors[f.name] ? true : undefined} aria-describedby={errors[f.name] ? `rs-${f.name}-err` : undefined}
                    onChange={(e) => setField(f.name, e.target.value)}
                    onBlur={() => values[f.name] && setErrors((er) => ({ ...er, [f.name]: validateResumeField(f.name, values[f.name]) }))}
                  />
                  {errors[f.name] && <p className="rs-error" id={`rs-${f.name}-err`} role="alert">{errors[f.name]}</p>}
                </div>
              ))}
              <input className="rs-hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              {formError && <p className="rs-banner" role="alert">{formError}</p>}
              <button type="submit" className="rs-btn rs-btn--primary" aria-disabled={busy === 'send'}>
                {busy === 'send' ? <><span className="rs-spinner" aria-hidden="true" /> Sending…</> : 'Verify Email & Download Resume'}
              </button>
              <p className="rs-privacy">
                Your name, email, company and basic access details (IP address, browser and device) are recorded for recruitment-related
                follow-up and kept for up to 12 months. See the{' '}
                <Link href="/privacy" target="_blank">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        )}

        {step === 'verify' && (
          <div className="rs-panel" key="verify">
            <p className="rs-eyebrow">Step 2 of 3</p>
            <h2 id="rs-title" className="rs-title" tabIndex={-1} ref={heading}>Thank you! Please check your email.</h2>
            <p className="rs-text">We&apos;ve sent a verification link and six-digit PIN to <strong className="rs-email">{values.email.trim()}</strong>.</p>
            <p className="rs-text rs-text--small">Check your Inbox, Spam or Junk folder. Once your email is verified, your résumé download will start automatically.</p>
            <form className="rs-form" onSubmit={submitPin} noValidate>
              <div className="rs-field">
                <label htmlFor="rs-pin">Six-digit PIN</label>
                <input
                  id="rs-pin" className="rs-pin" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="000000"
                  value={pin} aria-invalid={pinError ? true : undefined} aria-describedby="rs-pin-msg"
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); if (pinError) setPinError(''); }}
                />
                <p className="rs-timer" aria-live="off">
                  {expired ? 'This code has expired.' : <>Expires in <time>{clock(remaining)}</time></>}
                </p>
                <div id="rs-pin-msg">
                  {pinError && <p className="rs-error" role="alert">{pinError}</p>}
                  {notice && !pinError && <p className="rs-ok" role="status">{notice}</p>}
                </div>
              </div>
              <button type="submit" className="rs-btn rs-btn--primary" aria-disabled={busy === 'verify' || expired}>
                {busy === 'verify' ? <><span className="rs-spinner" aria-hidden="true" /> Verifying…</> : 'Verify & Download'}
              </button>
              <div className="rs-links">
                <button type="button" className="rs-linkbtn" onClick={resend} aria-disabled={busy === 'resend' || resendIn > 0}>
                  {busy === 'resend' ? 'Sending…' : resendIn > 0 ? `Resend email in ${resendIn}s` : 'Resend verification email'}
                </button>
                <button type="button" className="rs-linkbtn" onClick={reset}>Change email address</button>
              </div>
            </form>
          </div>
        )}

        {step === 'done' && <VerifiedPanel headingRef={heading} />}
      </div>
    </dialog>
  );
}
