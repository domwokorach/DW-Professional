"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ErrorState from "@/components/ui/ErrorState";
import { useEffect } from "react";
import { isStaleDeploymentError, reloadForStaleDeployment } from "@/lib/staleDeployment";

// Renders only under the root layout (no (site) route group boundary was
// matched), so Header/Footer are rendered directly rather than relying on
// layout nesting.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // A tab left open across a deploy fails to load the old JS chunks; reset()
  // can't recover from that, but a reload picks up the new deployment.
  useEffect(() => {
    if (isStaleDeploymentError(error)) reloadForStaleDeployment();
  }, [error]);

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
