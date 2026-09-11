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
