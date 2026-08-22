"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  defaultPreferences,
  getStoredConsent,
  saveConsent,
  applyConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
} from "@/lib/cookieConsent";
import CookiePreferencesModal from "./CookiePreferencesModal";

export default function CookieConsentManager() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const reduceMotion = useReducedMotion();
  const customiseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setPreferences(stored);
      applyConsent(stored);
      setBannerVisible(false);
    } else {
      setBannerVisible(true);
    }

    const openSettings = () => setModalOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const handleAccept = () => {
    const consent = saveConsent({ analytics: true, functional: true, marketing: true });
    setPreferences(consent);
    setBannerVisible(false);
  };

  const handleDecline = () => {
    const consent = saveConsent({ analytics: false, functional: false, marketing: false });
    setPreferences(consent);
    setBannerVisible(false);
  };

  const handleSavePreferences = (prefs: {
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
  }) => {
    const consent = saveConsent(prefs);
    setPreferences(consent);
    setBannerVisible(false);
    setModalOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            role="region"
            aria-label="Cookie preferences"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[100] border-t border-line bg-surface/95 p-5 shadow-2xl backdrop-blur-lg sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:max-w-3xl sm:rounded-2xl sm:border sm:p-7"
          >
            <h2 className="text-lg font-semibold text-white">Cookie Preferences</h2>
            <p className="mt-2 max-w-2xl text-sm leading-[1.65] text-muted">
              We use essential cookies to make this website work. With your
              permission, we may also use optional cookies to understand how
              the website is used and improve your experience. You can accept
              all cookies, decline optional cookies, or customise your
              preferences.
            </p>

            <p className="mt-3 text-sm">
              <Link href="/privacy" className="text-muted underline hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="mx-2 text-muted">·</span>
              <Link href="/cookies" className="text-muted underline hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={handleDecline}
                className="min-h-[48px] rounded-full border border-line px-6 py-3 text-sm font-medium text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:order-1"
              >
                Decline
              </button>
              <button
                ref={customiseButtonRef}
                type="button"
                onClick={() => setModalOpen(true)}
                className="min-h-[48px] rounded-full border border-line px-6 py-3 text-sm font-medium text-white transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:order-2"
              >
                Customise
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="min-h-[48px] rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:order-3"
              >
                Accept
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CookiePreferencesModal
        open={modalOpen}
        initial={preferences}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePreferences}
        onAcceptAll={() => handleSavePreferences({ analytics: true, functional: true, marketing: true })}
        onRejectOptional={() =>
          handleSavePreferences({ analytics: false, functional: false, marketing: false })
        }
        returnFocusRef={customiseButtonRef}
      />
    </>
  );
}
