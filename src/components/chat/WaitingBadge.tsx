"use client";

import { useEffect, useState } from "react";
import { formatWaitingDuration } from "@/lib/chat/helpers";

// Coarse enough to avoid re-rendering every conversation row every second
// (this badge exists on the whole visible list), fine-grained enough that
// "Waiting 30 sec" still visibly counts up.
const TICK_MS = 5000;

/** Re-renders every second off a client-side interval — never polls the server, just re-formats `waitingSince`. */
export default function WaitingBadge({ waitingSince }: { waitingSince: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-red-400/15 px-1.5 py-0.5 text-[11px] font-medium text-red-400">
      {formatWaitingDuration(waitingSince, now)}
    </span>
  );
}
