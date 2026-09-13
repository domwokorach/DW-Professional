import { Wifi, WifiOff, RefreshCw, TriangleAlert } from "lucide-react";
import type { ConnectionState } from "@/types/chat";

const CONFIG: Record<
  ConnectionState,
  { label: string; icon: typeof Wifi; className: string; spin?: boolean }
> = {
  online: { label: "Connected", icon: Wifi, className: "text-accent3" },
  connecting: { label: "Connecting…", icon: RefreshCw, className: "text-muted", spin: true },
  reconnecting: { label: "Reconnecting…", icon: RefreshCw, className: "text-amber-400", spin: true },
  offline: { label: "Offline", icon: WifiOff, className: "text-muted" },
  unauthorized: { label: "Session expired", icon: TriangleAlert, className: "text-red-400" },
  "auth-failed": { label: "Unable to authenticate chat", icon: TriangleAlert, className: "text-red-400" },
};

export default function ConnectionStatus({ state }: { state: ConnectionState }) {
  const config = CONFIG[state] ?? {
    label: "Connection failed",
    icon: TriangleAlert,
    className: "text-red-400",
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-3.5 w-3.5 ${config.spin ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

/** A full-width strip shown only while disconnected — auto-disappears once `state` returns to "online", rather than occupying header space permanently. */
export function ConnectionBanner({ state }: { state: ConnectionState }) {
  if (state === "online") return null;
  const config = CONFIG[state] ?? { label: "Connection failed", icon: TriangleAlert, className: "text-red-400" };
  const Icon = config.icon;

  return (
    <div
      className={`flex shrink-0 items-center justify-center gap-1.5 border-b border-line bg-surface px-3 py-1.5 text-xs font-medium ${config.className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-3.5 w-3.5 ${config.spin ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
      {config.label}
    </div>
  );
}
