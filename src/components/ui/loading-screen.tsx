"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FullPageLoader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

/** How long the loader stays fully visible before it starts fading out. */
const LOADING_DURATION_MS = 5000;
/** Must match the Tailwind `duration-*` class used on the fade transition below. */
const FADE_DURATION_MS = 500;

type Phase = "loading" | "revealing" | "done";

/**
 * Wraps the app shell with a full-screen loader that shows for a fixed
 * duration before cross-fading into the real content. Reusable/isolated so
 * it can wrap any subtree — currently the whole app in `RootLayout`.
 */
export default function LoadingScreen({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const hasStarted = useRef(false);

  useEffect(() => {
    // Guards against React Strict Mode's double-invoke in dev re-arming the
    // timer — the cleanup below already covers real unmounts.
    if (hasStarted.current) return;
    hasStarted.current = true;

    const revealTimer = window.setTimeout(() => setPhase("revealing"), LOADING_DURATION_MS);
    return () => window.clearTimeout(revealTimer);
  }, []);

  useEffect(() => {
    if (phase !== "revealing") return;

    const doneTimer = window.setTimeout(() => setPhase("done"), FADE_DURATION_MS);
    return () => window.clearTimeout(doneTimer);
  }, [phase]);

  const isLoading = phase === "loading";
  const overlayMounted = phase !== "done";

  return (
    <>
      {overlayMounted && (
        <div
          role={isLoading ? "status" : undefined}
          aria-live={isLoading ? "polite" : undefined}
          aria-hidden={!isLoading}
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center bg-ink",
            "transition-opacity ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
            isLoading ? "opacity-100 duration-0" : "pointer-events-none opacity-0 duration-500"
          )}
        >
          <FullPageLoader label="Loading portfolio" className="h-full min-h-0" />
        </div>
      )}

      <div
        aria-hidden={isLoading}
        inert={isLoading}
        className={cn(
          "transition-opacity ease-in-out motion-reduce:transition-none motion-reduce:duration-0",
          isLoading ? "opacity-0 duration-0" : "opacity-100 duration-500"
        )}
      >
        {children}
      </div>
    </>
  );
}
