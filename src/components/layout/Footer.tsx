"use client";

import Link from "next/link";
import { footerNavigation, social } from "@/data/navigation";
import Container from "@/components/ui/Container";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookieConsent";
import { useLocale } from "@/i18n/LocaleProvider";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { localiseHref } = useLocale();

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
              {footerNavigation.map((item) => (
                <li key={item.id}>
                  <Link
                    href={localiseHref(`/#${item.id}`)}
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
            <div className="mt-3 flex items-center justify-center gap-2 md:justify-start">
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                aria-label="Visit Dominic Wokorach on GitHub (opens in a new tab)"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:text-white"
              >
                <GithubIcon aria-hidden="true" className="h-[22px] w-[22px]" />
              </a>
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                aria-label="Visit Dominic Wokorach on LinkedIn (opens in a new tab)"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:text-white"
              >
                <LinkedinIcon aria-hidden="true" className="h-[22px] w-[22px]" />
              </a>
            </div>
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
                  href={localiseHref("/privacy")}
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={localiseHref("/terms")}
                  className="inline-flex min-h-11 items-center rounded px-1 text-sm text-muted transition-colors hover:text-white"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href={localiseHref("/accessibility")}
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
