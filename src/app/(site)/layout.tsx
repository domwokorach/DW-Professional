import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsentManager from "@/components/ui/CookieConsentManager";
import BackToTopButton from "@/components/ui/BackToTopButton";
import AccessibilityControls from "@/components/ui/AccessibilityControls";
import OfflineStatus from "@/components/ui/OfflineStatus";
import LiveChatLoader from "@/components/live-chat/LiveChatLoader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CookieConsentManager />
      <BackToTopButton />
      <AccessibilityControls />
      <OfflineStatus />
      <LiveChatLoader />
    </>
  );
}
