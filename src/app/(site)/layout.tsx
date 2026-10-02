import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsentManager from "@/components/ui/CookieConsentManager";
import BackToTopButton from "@/components/ui/BackToTopButton";
import AccessibilityControls from "@/components/ui/AccessibilityControls";
import OfflineStatus from "@/components/ui/OfflineStatus";
import LiveChatLoader from "@/components/live-chat/LiveChatLoader";
import HiddenOnPaths from "@/components/layout/HiddenOnPaths";

// Standalone pages rendered without the header, footer and live chat.
const STANDALONE_PAGES = ["/barcode", "/info"];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <HiddenOnPaths paths={STANDALONE_PAGES}>
        <Header />
      </HiddenOnPaths>
      <main id="main">{children}</main>
      <HiddenOnPaths paths={STANDALONE_PAGES}>
        <Footer />
      </HiddenOnPaths>
      <CookieConsentManager />
      <BackToTopButton />
      <AccessibilityControls />
      <OfflineStatus />
      <HiddenOnPaths paths={STANDALONE_PAGES}>
        <LiveChatLoader />
      </HiddenOnPaths>
    </>
  );
}
