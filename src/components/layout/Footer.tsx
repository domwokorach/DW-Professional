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
        <div className="flex flex-col items-center justify-center gap-10 text-center md:flex-row md:flex-wrap md:items-stretch md:justify-start md:gap-x-12 md:gap-y-10 md:text-left lg:flex-nowrap">
          <nav
            aria-labelledby="footer-explore-heading"
            className="w-full md:min-w-52 md:flex-1"
          >
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

          <nav
            aria-labelledby="footer-social-heading"
            className="w-full md:min-w-52 md:flex-1"
          >
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

          <nav
            aria-labelledby="footer-legal-heading"
            className="w-full md:min-w-52 md:flex-1"
          >
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
                  className="inline-flex min-h-11 items-center rounded px-1 text-center text-sm text-muted transition-colors hover:text-white md:text-left"
                >
                  Cookie settings
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-line pt-6 text-center md:flex-row md:justify-between md:text-left">
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
