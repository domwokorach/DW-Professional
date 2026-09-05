"use client";

import Link from "next/link";
import { navigation, social } from "@/data/navigation";
import Container from "@/components/ui/Container";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookieConsent";

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const openCookieSettings = () => {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  };

  return (
    <footer className="border-t border-line bg-surface/30 py-12 sm:py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]">
          <section aria-labelledby="footer-name">
            <h2 id="footer-name" className="font-mono text-lg font-semibold text-white">
              Dominic Wokorach
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
              Software Engineer &amp; Frontend Developer
            </p>
          </section>

          <nav aria-labelledby="footer-explore-heading">
            <h2 id="footer-explore-heading" className="text-sm font-semibold text-white">
              Explore
            </h2>
            <ul className="mt-3 space-y-1">
              {navigation.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/#${item.id}`}
                    className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-social-heading">
            <h2 id="footer-social-heading" className="text-sm font-semibold text-white">
              Connect
            </h2>
            <ul className="mt-3 space-y-1">
              <li>
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  GitHub<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal-heading">
            <h2 id="footer-legal-heading" className="text-sm font-semibold text-white">
              Legal
            </h2>
            <ul className="mt-3 space-y-1">
              <li>
                <Link
                  href="/privacy"
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openCookieSettings}
                  className="inline-flex min-h-11 items-center rounded px-1 text-left text-sm text-muted transition-colors hover:text-white"
                >
                  Cookie settings
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">
            © {year} Dominic Wokorach. All rights reserved.
          </p>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex min-h-11 w-fit items-center rounded px-1 text-sm font-medium text-muted transition-colors hover:text-white"
          >
            Back to top
          </button>
        </div>
      </Container>
    </footer>
  );
}
