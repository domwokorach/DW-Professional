'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { HOME, RESUME_URL } from '@/config';
import CompanyField, { type CompanySelection } from '@/components/contact/CompanyField';
import { FadeArc } from '@/components/loading-ui/fade-arc';
import {
  ACCESS_FIELDS,
  ACCESS_LIMITS,
  validateAccess,
  validateAccessField,
  type AccessErrors,
  type AccessField,
  type AccessFields,
} from '@/lib/portfolio-access';

type Status = 'idle' | 'submitting' | 'error' | 'success';
/** Whether the CV tab opened by itself after the submission, or the browser blocked it. */
type ResumeState = 'opening' | 'opened' | 'blocked';

const EMPTY: AccessFields = { fullName: '', email: '', mobile: '', company: '' };
const id = (field: AccessField) => `pa-${field}`;
const PRIVACY_PATH = '/en-gb/privacy';

const GENERIC_ERROR = "We couldn't complete your request. Please check your details and try again.";
const UNAVAILABLE = "We couldn't save your details just now. Please try again in a moment.";
const RATE_LIMITED = 'Too many attempts from this connection. Please wait a few minutes and try again.';

/** Never throws: haptics are optional (Chromium on Android only). */
const triggerHapticFeedback = (pattern: number | number[] = [80, 40, 80]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
};

/** Opens the CV in a new tab. False when the browser blocked it (window.open returns null). */
function openResumeTab(): boolean {
  try {
    const tab = window.open(RESUME_URL, '_blank');
    if (!tab) return false;
    tab.opener = null; // same-origin PDF, but the new tab never needs a handle back to this page
    return true;
  } catch {
    return false;
  }
}

export default function PortfolioAccessView() {
  const [fields, setFields] = useState<AccessFields>(EMPTY);
  // A UK company picked from the Company field's suggestions (optional; a typed name needs none).
  const [company, setCompany] = useState<CompanySelection | null>(null);
  const [errors, setErrors] = useState<AccessErrors>({});
  const [touched, setTouched] = useState<Partial<Record<AccessField, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState('');
  const [resume, setResume] = useState<ResumeState>('opening');
  const [honeypot, setHoneypot] = useState('');
  // One id per submission, reused on retry so the server never records or emails it twice.
  const submissionId = useRef<string | null>(null);
  // Synchronous guard: state updates are async, so a fast double click could otherwise post twice.
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const successTitle = useRef<HTMLHeadingElement>(null);
  const resumeButton = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();

  // When the confirmation mounts (after the form's exit animation), move focus to it, or to Open Resume when the
  // new tab was blocked, so keyboard and screen-reader users land on what matters next. Once per submission.
  const focusedSuccess = useRef(false);
  const onSuccessMount = (el: HTMLDivElement | null) => {
    if (!el || focusedSuccess.current) return;
    focusedSuccess.current = true;
    (resume === 'blocked' ? resumeButton.current : successTitle.current)?.focus();
  };

  const setError = (field: AccessField, message?: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });

  const update = (field: AccessField, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (status === 'error') setStatus('idle');
    // Once a field shows an error, re-check it as the visitor fixes it.
    if (errors[field]) setError(field, validateAccessField(field, value));
  };

  const onBlur = (field: AccessField) => () => {
    if (touched[field]) setError(field, validateAccessField(field, fields[field]));
  };

  const describedBy = (field: AccessField, extra?: string) =>
    [extra, errors[field] ? `${id(field)}-error` : undefined].filter(Boolean).join(' ') || undefined;

  const errorText = (field: AccessField) =>
    errors[field] ? (
      <p className="contact-error pa-error" id={`${id(field)}-error`}>
        <span aria-hidden="true">!</span>{errors[field]}
      </p>
    ) : null;

  const focusField = (field: AccessField) => formRef.current?.querySelector<HTMLElement>(`#${id(field)}`)?.focus();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;

    const found = validateAccess(fields);
    setErrors(found);
    setTouched({ fullName: true, email: true, mobile: true, company: true });
    const firstInvalid = ACCESS_FIELDS.find((f) => found[f]);
    if (firstInvalid) {
      setFormError('');
      focusField(firstInvalid);
      return;
    }

    inFlight.current = true;
    submissionId.current ??= crypto.randomUUID();
    setStatus('submitting');
    setFormError('');
    try {
      const res = await fetch('/api/portfolio-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          companyNumber: company && company.companyName === fields.company ? company.companyNumber : '',
          website: honeypot,
          submissionId: submissionId.current,
        }),
      });
      if (res.ok) {
        // Open straight away, while the browser still counts the Submit click as the user's action
        // (pop-up blockers allow new tabs only shortly after one).
        const opened = openResumeTab();
        setResume(opened ? 'opened' : 'blocked');
        setStatus('success');
        triggerHapticFeedback();
        return;
      }
      const body = (await res.json().catch(() => null)) as { errors?: AccessErrors } | null;
      if (res.status === 400 && body?.errors && Object.keys(body.errors).length) {
        setErrors(body.errors);
        setStatus('idle');
        const first = ACCESS_FIELDS.find((f) => body.errors?.[f]);
        if (first) focusField(first);
        return;
      }
      setFormError(res.status === 429 ? RATE_LIMITED : res.status >= 500 ? UNAVAILABLE : GENERIC_ERROR);
      setStatus('error');
    } catch {
      setFormError(GENERIC_ERROR);
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }

  const submitting = status === 'submitting';

  const input = (field: Exclude<AccessField, 'company'>, label: string, props: InputHTMLAttributes<HTMLInputElement>) => (
    <div className="contact-field pa-field">
      <label className="contact-label" htmlFor={id(field)}>{label}</label>
      <input
        id={id(field)}
        name={field}
        className="contact-control"
        value={fields[field]}
        onChange={(e) => update(field, e.target.value)}
        onBlur={onBlur(field)}
        required
        aria-invalid={errors[field] ? true : undefined}
        aria-describedby={describedBy(field)}
        maxLength={ACCESS_LIMITS[field]}
        readOnly={submitting}
        {...props}
      />
      {errorText(field)}
    </div>
  );

  const panel: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: reduce ? 0.15 : 0.35, ease: 'easeOut', staggerChildren: reduce ? 0 : 0.08 } },
    exit: { opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: reduce ? 0.1 : 0.2 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: 'easeOut' } },
  };

  const resumeMessage =
    resume === 'blocked'
      ? 'Your browser blocked the new tab. Use the button below to open the resume.'
      : resume === 'opened'
        ? 'Your resume has opened in a new tab.'
        : 'Your resume is opening now.';

  return (
    <main className="pa">
      <section className="pa-card pa-card--js" aria-labelledby="pa-title">
        {/* initial={false}: the form is plain server-rendered markup (visible before JavaScript loads); its entrance
            is a CSS animation. The confirmation enters through motion. */}
        <AnimatePresence mode="wait" initial={false}>
          {status !== 'success' ? (
            <motion.div key="form" className="pa-panel pa-panel--enter pa-panel--form" variants={panel} initial="hidden" animate="show" exit="exit">
              <header className="pa-head">
                <p className="pa-eyebrow">Dominic Wokorach Olanya</p>
                <h1 id="pa-title" className="pa-title">Portfolio Access</h1>
                <p className="pa-text">Please share a few details to open my CV.</p>
              </header>

              <form ref={formRef} className="pa-form" onSubmit={onSubmit} noValidate aria-describedby="pa-required-note" aria-busy={submitting}>
                <p className="pa-note" id="pa-required-note">All fields are required unless marked optional.</p>
                {input('fullName', 'Your Full Name', { type: 'text', autoComplete: 'name', autoCapitalize: 'words' })}
                {input('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email', spellCheck: false })}
                {input('mobile', 'Mobile', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: 'e.g. +44 7700 900123' })}
                <div className="contact-field pa-field">
                  <label className="contact-label" htmlFor={id('company')}>Company<span className="contact-optional"> (optional)</span></label>
                  <CompanyField
                      id={id('company')}
                      value={fields.company}
                      selection={company}
                      onTextChange={(text) => update('company', text)}
                      onSelectionChange={setCompany}
                      onBlur={onBlur('company')}
                      invalid={Boolean(errors.company)}
                      describedBy={describedBy('company')}
                      maxLength={ACCESS_LIMITS.company}
                    />
                  {errorText('company')}
                </div>

                {/* Honeypot: hidden from people and assistive technology; bots that fill it are rejected. */}
                <div className="pa-hp" aria-hidden="true">
                  <label htmlFor="pa-website">Website</label>
                  <input id="pa-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </div>

                <p className="pa-privacy" id="pa-privacy">
                  Your details, plus basic access information (date and time, device and browser type, and IP address), are used
                  only to manage and monitor access to my CV and are sent to me by email. See the{' '}
                  <Link href={PRIVACY_PATH}>Privacy Policy</Link>.
                </p>

                <div className="pa-form-error" role="alert">
                  {status === 'error' && formError && (
                    <p><strong>Something went wrong.</strong> {formError}</p>
                  )}
                </div>

                {/* aria-disabled rather than disabled while sending, so keyboard focus stays on the button; the in-flight
                    guard in onSubmit (and the server's submission id) is what actually stops a second request. */}
                <button type="submit" className="pa-btn pa-btn--primary pa-submit" aria-disabled={submitting || undefined} aria-describedby="pa-privacy">
                  {submitting ? (
                    <>
                      <FadeArc className="pa-submit__spinner" aria-hidden="true" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
                <span className="sr-only" role="status" aria-live="polite">{submitting ? 'Submitting your details. Please wait.' : ''}</span>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" ref={onSuccessMount} className="pa-panel" variants={panel} initial="hidden" animate="show" exit="exit">
              <motion.div className="pa-visual pa-visual--success" variants={item}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </motion.div>
              <motion.div variants={item} role="status" aria-live="polite">
                <p className="pa-eyebrow">Dominic Wokorach Olanya</p>
                <h1 id="pa-title" className="pa-title" ref={successTitle} tabIndex={-1}>Thank you!</h1>
                <p className="pa-text">Your details have been submitted successfully.<br />{resumeMessage}</p>
              </motion.div>
              <motion.div className="pa-actions" variants={item}>
                <a
                  ref={resumeButton}
                  className={`pa-btn ${resume === 'blocked' ? 'pa-btn--primary' : 'pa-btn--secondary'}`}
                  href={RESUME_URL}
                  target="_blank"
                  rel="noopener"
                  onClick={() => { triggerHapticFeedback(40); setResume('opened'); }}
                >
                  Open Resume<span className="sr-only"> (PDF, opens in a new tab)</span>
                </a>
              </motion.div>
              <motion.p className="pa-meta" variants={item}>PDF document</motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <Link href={HOME} className="pa-back">← Back to portfolio</Link>
      </section>

      {/* The form needs JavaScript to submit; say so rather than showing a form that can't work. */}
      <noscript>
        <style>{'.pa-card--js{display:none}'}</style>
        <section className="pa-card">
          <div className="pa-panel">
            <h1 className="pa-title">Portfolio Access</h1>
            <p className="pa-text">Please enable JavaScript to complete the short form and open the CV.</p>
          </div>
        </section>
      </noscript>
    </main>
  );
}
