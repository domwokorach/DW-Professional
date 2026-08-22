"use client";

import LegalPage from "@/components/ui/LegalPage";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookieConsent";

export default function CookiesPage() {
  const openSettings = () => {
    window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
  };

  return (
    <LegalPage title="Cookie Policy">
      <p>
        This website uses a small number of cookies to function correctly
        and, with your permission, to understand how the site is used.
      </p>
      <div>
        <p className="font-medium text-white">Strictly Necessary</p>
        <p>
          Always active. Required for essential website functionality,
          security, and storing your cookie preferences.
        </p>
      </div>
      <div>
        <p className="font-medium text-white">Analytics</p>
        <p>
          Optional. Used to understand how visitors use the website, such as
          page views, traffic patterns and anonymous usage statistics.
        </p>
      </div>
      <div>
        <p className="font-medium text-white">Functional</p>
        <p>Optional. Used to remember preferences and provide enhanced functionality.</p>
      </div>
      <div>
        <p className="font-medium text-white">Marketing</p>
        <p>Optional. Used for advertising, campaign measurement or remarketing where applicable.</p>
      </div>
      <button
        type="button"
        onClick={openSettings}
        className="mt-2 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-white transition-colors hover:border-accent/60"
      >
        Manage Cookie Preferences
      </button>
    </LegalPage>
  );
}
