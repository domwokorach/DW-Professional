"use client";

import Link from "next/link";
import { AlertTriangle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

type ErrorStateProps = {
  kind: "not-found" | "connection";
  onRetry?: () => void;
};

const content = {
  "not-found": {
    code: "404",
    title: "Page not found",
    description:
      "The page you are looking for may have been moved, removed, or does not exist.",
    icon: AlertTriangle,
  },
  connection: {
    title: "Connection lost",
    description:
      "It looks like you are offline or the connection to the website was interrupted.",
    icon: WifiOff,
  },
} as const;

export default function ErrorState({ kind, onRetry }: ErrorStateProps) {
  const [status, setStatus] = useState("");
  const Icon = content[kind].icon;

  useEffect(() => {
    if (kind !== "connection") return;

    const handleOnline = () => setStatus("You’re back online.");
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [kind]);

  const tryAgain = () => {
    if (kind === "connection" && !navigator.onLine) {
      setStatus("Connection is still unavailable. Check your internet connection and try again.");
      return;
    }

    setStatus(kind === "connection" ? "You’re back online. Retrying now." : "Retrying now.");

    if (onRetry) {
      onRetry();
      return;
    }

    window.location.reload();
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/");
  };

  return (
    <section
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-28 sm:px-8"
      aria-labelledby="error-title"
    >
      <div className="w-full max-w-xl rounded-3xl border border-line bg-surface/80 p-8 text-center shadow-2xl sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-accent motion-safe:animate-pulse">
          <Icon aria-hidden="true" size={28} strokeWidth={2} />
        </div>

        {kind === "not-found" && (
          <p className="mt-6 font-mono text-sm font-semibold tracking-[0.15em] text-accent">
            {content["not-found"].code}
          </p>
        )}
        <div role="alert" className={kind === "not-found" ? "mt-3" : "mt-6"}>
          <h1 id="error-title" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {content[kind].title}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
            {content[kind].description}
          </p>
        </div>

        <p aria-live="polite" className="mt-4 min-h-6 text-sm font-medium text-accent">
          {status}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {kind === "connection" && (
            <button
              type="button"
              onClick={tryAgain}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Try Again
            </button>
          )}
          <Link
            href="/"
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
              kind === "not-found"
                ? "bg-white text-ink hover:bg-accent"
                : "border border-line text-white hover:border-accent hover:text-accent"
            }`}
          >
            Go Home
          </Link>
          {kind === "not-found" && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
