'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CV_DOWNLOAD_URL, CV_FILENAME, CV_URL, HOME } from '@/config';
import { QuarterRing } from '@/components/ui';

type PortfolioAccessState = 'loading' | 'success' | 'error';

/** How long the "preparing" screen shows before the confirmation. */
const LOADING_MS = 5000;

/** Returns whether the browser accepted the vibration. Never throws: haptics are optional. */
const triggerHapticFeedback = (): boolean => {
  try {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate([80, 40, 80]);
  } catch {
    return false;
  }
};

export default function PortfolioAccessView() {
  const [state, setState] = useState<PortfolioAccessState>('loading');
  const reduce = useReducedMotion();
  const buzzed = useRef(false);

  // Vibrate once per visit (Chromium on Android; iOS/Safari have no Vibration API, so nothing happens).
  // Chrome only honours vibrate() after the visitor has touched the page, and a page opened by scanning a
  // QR code hasn't been touched yet, so if the first attempt is refused it is retried once, on the first tap.
  useEffect(() => {
    if (buzzed.current) return;
    buzzed.current = triggerHapticFeedback();
    if (buzzed.current || !('vibrate' in navigator)) return;
    const retry = () => {
      if (!buzzed.current) buzzed.current = triggerHapticFeedback();
      events.forEach((e) => window.removeEventListener(e, retry));
    };
    const events = ['pointerdown', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, retry, { once: true }));
    return () => events.forEach((e) => window.removeEventListener(e, retry));
  }, []);

  // Loading -> success. If anything throws, show the fallback instead of spinning forever.
  useEffect(() => {
    try {
      const timer = window.setTimeout(() => setState('success'), LOADING_MS);
      return () => window.clearTimeout(timer);
    } catch {
      setState('error');
    }
  }, []);

  const panel: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: reduce ? 0.15 : 0.35, ease: 'easeOut', staggerChildren: reduce ? 0 : 0.08 } },
    exit: { opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: reduce ? 0.1 : 0.2 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 6 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: 'easeOut' } },
  };

  const actions = (
    <motion.div className="pa-actions" variants={item}>
      <a className="pa-btn pa-btn--primary" href={CV_URL} target="_blank" rel="noopener noreferrer">
        Open CV<span className="sr-only"> (opens in a new tab)</span>
      </a>
      {state === 'success' && (
        <a className="pa-btn pa-btn--secondary" href={CV_DOWNLOAD_URL} download={CV_FILENAME}>Download CV</a>
      )}
    </motion.div>
  );

  return (
    <main className="pa">
      <section className="pa-card pa-card--js" aria-labelledby="pa-title" aria-busy={state === 'loading'}>
        {/* initial={false}: the first panel is plain server-rendered markup (visible before JavaScript loads);
            its entrance is a CSS animation. Later panels enter and exit through motion. */}
        <AnimatePresence mode="wait" initial={false}>
          {state === 'loading' && (
            <motion.div key="loading" className="pa-panel pa-panel--enter" variants={panel} initial="hidden" animate="show" exit="exit">
              <motion.div className="pa-visual" variants={item}>
                <QuarterRing className="pa-ring" style={{ '--duration': '0.8s' } as CSSProperties} />
              </motion.div>
              <motion.div variants={item}>
                <h1 id="pa-title" className="pa-title">Preparing your CV…</h1>
                <p className="pa-text">Securely getting Dominic Wokorach Olanya&rsquo;s CV ready for you.</p>
              </motion.div>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div key="success" className="pa-panel" variants={panel} initial="hidden" animate="show" exit="exit">
              <motion.div className="pa-visual pa-visual--success" variants={item}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </motion.div>
              <motion.div variants={item}>
                <p className="pa-eyebrow">Dominic Wokorach Olanya</p>
                <h1 id="pa-title" className="pa-title">CV Ready</h1>
                <p className="pa-text">Thank you, and I look forward to hearing from you soon.</p>
              </motion.div>
              {actions}
              <motion.p className="pa-meta" variants={item}>Microsoft Word document · DOCX</motion.p>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div key="error" className="pa-panel" variants={panel} initial="hidden" animate="show" exit="exit">
              <motion.div className="pa-visual pa-visual--error" variants={item}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6.5M12 17.2v.1" /></svg>
              </motion.div>
              <motion.div variants={item}>
                <h1 id="pa-title" className="pa-title">Unable to open the CV automatically</h1>
                <p className="pa-text">You can still access the document using the button below.</p>
              </motion.div>
              {actions}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announced to screen readers when the state changes; empty while loading (the ring announces "Loading"). */}
        <div className="sr-only" role="status" aria-live="polite">
          {state === 'success' ? 'Your CV is ready.' : state === 'error' ? 'Unable to open the CV automatically.' : ''}
        </div>

        <Link href={HOME} className="pa-back">← Back to portfolio</Link>
      </section>

      {/* Without JavaScript the animation never runs, so give the CV link straight away. */}
      <noscript>
        <style>{'.pa-card--js{display:none}'}</style>
        <section className="pa-card">
          <div className="pa-panel">
            <h1 className="pa-title">Dominic Wokorach Olanya&rsquo;s CV</h1>
            <p className="pa-text">Thank you, and I look forward to hearing from you soon.</p>
            <div className="pa-actions">
              <a className="pa-btn pa-btn--primary" href={CV_URL}>Open CV</a>
              <a className="pa-btn pa-btn--secondary" href={CV_DOWNLOAD_URL}>Download CV</a>
            </div>
          </div>
        </section>
      </noscript>
    </main>
  );
}
