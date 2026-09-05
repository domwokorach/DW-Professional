"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState kind="connection" onRetry={reset} />;
}
