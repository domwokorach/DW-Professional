'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getConsent, onConsentOpen, setConsent, type Consent } from '@/lib/consent';

type Phase = 'hidden' | 'enter' | 'shown' | 'leave';
const SHOW_DELAY_MS = 700;
const EXIT_MS = 320;

/**
 * Non-blocking consent panel for first-time visitors. Nothing is rendered on the server, so
 * there is no hydration mismatch; the stored choice is checked after mount. Reopens when
 * resetCookieConsent() is called (e.g. from the Cookie page).
 */
export default function CookieConsent() {
  const [phase, setPhase] = useState<Phase>('hidden');
  const rejectRef = useRef<HTMLButtonElement>(null);
  const focusOnShow = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const show = (delay: number) => {
      timers.push(setTimeout(() => {
        setPhase('enter');
        // Two frames so the initial (hidden) styles apply before transitioning in.
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase('shown')));
      }, delay));
    };
    if (getConsent() === null) show(SHOW_DELAY_MS);
    const off = onConsentOpen(() => {
      focusOnShow.current = true;
      show(0);
    });
    return () => { off(); timers.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (phase === 'shown' && focusOnShow.current) {
      focusOnShow.current = false;
      rejectRef.current?.focus();
    }
  }, [phase]);

  const choose = (value: Consent) => {
    setConsent(value);
    setPhase('leave');
    setTimeout(() => setPhase('hidden'), EXIT_MS);
  };

  if (phase === 'hidden') return null;

  return (
    <section className={`cookie-consent is-${phase}`} role="region" aria-labelledby="cookie-consent-title">
      <h2 id="cookie-consent-title" className="cookie-consent__title">Privacy &amp; cookies</h2>
      <p className="cookie-consent__text">
        This site only uses what it needs to work. Any optional cookies, such as analytics, stay off unless you accept.{' '}
        <Link href="/cookies" className="cookie-consent__link">Cookie policy</Link>
      </p>
      <div className="cookie-consent__actions">
        <button ref={rejectRef} type="button" className="cookie-reject" onClick={() => choose('rejected')}>Reject all</button>
        <button type="button" className="cookie-accept" onClick={() => choose('accepted')}>Accept all</button>
      </div>
    </section>
  );
}
