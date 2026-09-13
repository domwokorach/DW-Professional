import type { PresenceStatus } from "@/lib/chat/helpers";

const STATUS_CONFIG: Record<PresenceStatus, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-emerald-400" },
  waiting: { label: "Waiting for admin", dot: "bg-sky-400" },
  offline: { label: "Offline", dot: "bg-muted" },
};

export default function OnlineStatus({ status }: { status: PresenceStatus }) {
  const { label, dot } = STATUS_CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function PresenceDot({
  status,
  className = "h-2.5 w-2.5",
}: {
  status: PresenceStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 rounded-full border-2 border-ink ${STATUS_CONFIG[status].dot} ${className}`}
    />
  );
}

export function presenceLabel(status: PresenceStatus): string {
  return STATUS_CONFIG[status].label;
}
