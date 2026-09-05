"use client";

import { useEffect, useState } from "react";
import ErrorState from "@/components/ui/ErrorState";

export default function OfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const showOfflineState = () => setIsOffline(true);

    if (!navigator.onLine) showOfflineState();
    window.addEventListener("offline", showOfflineState);
    return () => window.removeEventListener("offline", showOfflineState);
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-ink/95 backdrop-blur-sm">
      <ErrorState kind="connection" />
    </div>
  );
}
