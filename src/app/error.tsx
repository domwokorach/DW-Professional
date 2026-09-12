"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorState from "@/components/ui/ErrorState";

// Renders only under the root layout (no (site) route group boundary was
// matched), so Header/Footer are rendered directly rather than relying on
// layout nesting.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <Header />
      <main id="main">
        <ErrorState kind="connection" onRetry={reset} />
      </main>
      <Footer />
    </>
  );
}
