'use client';

import { resetCookieConsent } from '@/lib/consent';
import { scrollToTop } from '@/lib/scroll';

export default function FooterActions() {
  return (
    <div className="site-footer__actions">
      <button type="button" className="footer-link site-footer__textbutton" onClick={resetCookieConsent}>Cookie preferences</button>
      <button type="button" className="site-footer__top" onClick={scrollToTop} aria-label="Back to top">↑</button>
    </div>
  );
}
