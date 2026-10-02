"use client";

import { useEffect, useState } from "react";
import { isStaleDeploymentError, reloadForStaleDeployment } from "@/lib/staleDeployment";
import "./globals.css";

// Replaces Next's built-in "This page couldn't load" screen for errors thrown
// in the root layout. Renders its own <html>/<body> because the root layout
// (theme, locale and font providers) is what failed.
export default function GlobalError({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (isStaleDeploymentError(error) && reloadForStaleDeployment()) setReloading(true);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="font-sans antialiased">
        <main
          id="main"
          className="flex min-h-screen items-center justify-center px-6 py-16 text-center"
        >
          <div className="max-w-md" role="alert" aria-live="polite">
            {reloading ? (
              <p className="text-base text-muted">Updating to the latest version…</p>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-paper">This page couldn’t load</h1>
                <p className="mt-3 text-base leading-[1.7] text-muted">
                  The site may have just been updated. Reload to get the latest version.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="min-h-11 rounded-full bg-cta px-6 text-sm font-medium text-cta-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Reload
                  </button>
                  {/* Full page load on purpose: <Link> would navigate with the
                      same broken client router. */}
                  <button
                    type="button"
                    onClick={() => window.location.assign("/")}
                    className="min-h-11 rounded-full border border-line px-6 text-sm text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Go to homepage
                  </button>
                </div>
                {error.digest && (
                  <p className="mt-6 font-mono text-xs text-muted">Error {error.digest}</p>
                )}
              </>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
