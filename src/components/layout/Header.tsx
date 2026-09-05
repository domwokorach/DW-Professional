"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { navigation } from "@/data/navigation";
import Navigation from "./Navigation";
import MobileNavigation from "./MobileNavigation";
import ResumeDownloadModal from "@/components/resume/ResumeDownloadModal";
import ThemeModeButton from "@/components/ui/ThemeModeButton";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const scrollToSection = useCallback((id: string) => {
    const section = document.getElementById(id);
    if (!section) return;

    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;
    const id = window.location.hash.slice(1);
    scrollToSection(id);
  }, [pathname, scrollToSection]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navigation
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (id: string) => {
    setMenuOpen(false);
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    scrollToSection(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-ink/70 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-6 sm:px-8 lg:px-10">
        <button
          onClick={() => handleNavigate("home")}
          className="font-mono text-lg font-semibold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          aria-label="Go to home"
        >
          Dominic<span className="text-accent">.</span>
        </button>

        <Navigation active={active} onNavigate={handleNavigate} />

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeModeButton />
          <button
            onClick={() => setResumeOpen(true)}
            className="hidden md:inline-flex items-center rounded-full border border-line px-4 py-2 text-sm text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Resume
          </button>
          <button
            onClick={() => handleNavigate("contact")}
            className="tablet-white hidden md:inline-flex items-center rounded-full border border-accent/40 px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Get in Touch
          </button>
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden font-mono text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded px-1"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </nav>

      <MobileNavigation
        open={menuOpen}
        active={active}
        onNavigate={handleNavigate}
        onOpenResume={() => {
          setMenuOpen(false);
          setResumeOpen(true);
        }}
      />

      <ResumeDownloadModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </header>
  );
}
