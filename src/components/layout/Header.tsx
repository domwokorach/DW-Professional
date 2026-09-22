"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { headerNavigation } from "@/data/navigation";
import MobileNavigation from "./MobileNavigation";
import ResumeDownloadModal from "@/components/resume/ResumeDownloadModal";
import { ThemeToggle } from "@/components/theme-toggle";
import LanguageSelector from "./LanguageSelector";
import { localisedPathname, stripLocale } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/motion/navigation-menu";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const scrollToSection = useCallback((id: string) => {
    const section = document.getElementById(id);
    if (!section) return;

    section.setAttribute("tabindex", "-1");
    section.focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    if (stripLocale(pathname) !== "/" || !window.location.hash) return;
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
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const marker = window.scrollY + 112;
      let current = "home";
      for (const item of headerNavigation) {
        const section = document.getElementById(item.id);
        if (section && section.offsetTop <= marker) current = item.id;
      }
      setActive(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const handleNavigate = (id: string) => {
    setMenuOpen(false);
    setActive(id);
    if (stripLocale(pathname) !== "/") {
      router.push(`${localisedPathname("/", locale)}#${id}`);
      return;
    }
    scrollToSection(id);
  };

  const activeGroup = active;

  // Below `lg`, the Hero section's portrait image sits full-bleed behind
  // this header with a fixed dark scrim (see Hero.tsx), so while unscrolled
  // on the home page the nav text needs to stay light regardless of theme —
  // same treatment as Hero's own copy. `.hero-scrim-text` is a no-op above
  // `lg` and once `scrolled` swaps in the opaque, theme-adaptive bg-ink/70.
  const isHome = stripLocale(pathname) === "/";
  const overHeroScrim = isHome && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-300 ${
        overHeroScrim ? "hero-scrim-text" : ""
      } ${
        scrolled ? "border-b border-line bg-ink/70 backdrop-blur-lg" : "bg-ink/30 backdrop-blur-sm"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-2 px-6 sm:px-8 lg:px-10">
        <button
          onClick={() => handleNavigate("home")}
          className="shrink-0 font-mono text-lg font-semibold tracking-tight text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          aria-label="Go to home"
        >
          Dominic<span className="text-accent">.</span>
        </button>

        <div className="hidden min-w-0 xl:flex xl:flex-1 xl:justify-center">
          <NavigationMenu className="max-w-full">
            <NavigationMenuList className="flex-nowrap">
              {headerNavigation.map((item) => {
                const isActive = activeGroup === item.id;
                return (
                  <NavigationMenuItem key={item.id}>
                    <NavigationMenuLink
                      href={`#${item.id}`}
                      active={isActive}
                      onClick={(event) => {
                        event.preventDefault();
                        handleNavigate(item.id);
                      }}
                      className="whitespace-nowrap px-2.5 py-2 font-mono 2xl:px-3.5"
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden xl:block">
            <LanguageSelector />
          </div>
          <ThemeToggle />
          <button
            onClick={() => setResumeOpen(true)}
            className="hidden xl:inline-flex items-center rounded-full border border-line px-4 py-2 text-sm text-paper transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Resume
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="xl:hidden flex h-11 w-11 items-center justify-center rounded text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          {menuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      <MobileNavigation
        open={menuOpen}
        activeGroup={activeGroup}
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
