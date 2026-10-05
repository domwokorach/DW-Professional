'use client';

import Link from 'next/link';
import { TechIcon } from '@/components/ui';
import { HOME, legalLinks } from '@/config';
import { socialLinks } from '@/data';
import { resetCookieConsent, scrollToTop } from '@/lib';

export default function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href={HOME} className="site-footer__name">DOMINIC WOKORACH OLANYA</Link>
          <p className="site-footer__role">Frontend Software Engineer · London</p>
        </div>

        <nav className="site-footer__group" aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="site-footer__heading">Legal</h2>
          <ul>
            {legalLinks.map((link) => (
              <li key={link.href}><Link href={link.href} className="footer-link">{link.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__group" aria-labelledby="footer-connect">
          <h2 id="footer-connect" className="site-footer__heading">Connect</h2>
          <ul>
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="footer-link footer-link--social">
                  <TechIcon icon={link.icon} fallback={link.label} className="site-footer__icon" />
                  {link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>© 2026 DOMINIC WOKORACH OLANYA</p>
        <div className="site-footer__actions">
          <button type="button" className="footer-link site-footer__textbutton" onClick={resetCookieConsent}>Cookie preferences</button>
          <button type="button" className="site-footer__top" onClick={scrollToTop} aria-label="Back to top">↑</button>
        </div>
      </div>
    </footer>
  );
}
