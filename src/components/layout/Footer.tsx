"use client";

import Link from "next/link";
import { social } from "@/data/navigation";
import Container from "@/components/ui/Container";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookieConsent";

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCookieSettings = () => {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  };

  return (
    <footer className="border-t border-line py-14">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-lg font-semibold text-white">
              Dominic Wokorach Olanya
            </p>
            <p className="mt-1 text-sm text-muted">
              Software Engineer &amp; Frontend Developer
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-white transition-colors"
            >
              GitHub
            </a>
            <Link href="/privacy" className="text-muted hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted hover:text-white transition-colors">
              Terms
            </Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-muted hover:text-white transition-colors"
            >
              Cookie Settings
            </button>
            <button
              onClick={scrollToTop}
              className="text-muted hover:text-white transition-colors"
            >
              Back to top ↑
            </button>
          </nav>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-xs text-muted">
            © {year} Dominic Wokorach Olanya. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
