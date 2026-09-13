import TypingIndicator from "@/components/chat/TypingIndicator";
import type { AdminPresenceState } from "@/types/socket";

const STATUS_CONFIG: Record<AdminPresenceState, { label: string; dot: string; pulse: boolean }> = {
  online: { label: "Admin is online", dot: "bg-emerald-400", pulse: true },
  away: { label: "Admin is away — you can still leave a message", dot: "bg-amber-400", pulse: false },
  offline: {
    label: "Admin is offline — leave a message and they can reply when available",
    dot: "bg-muted",
    pulse: false,
  },
};

export default function PresenceBanner({
  adminJoined,
  adminStatus,
}: {
  adminJoined: boolean;
  adminStatus: AdminPresenceState;
}) {
  if (!adminJoined) {
    return (
      <div className="border-b border-line px-4 py-2">
        <TypingIndicator label="Waiting for an admin to join…" />
      </div>
    );
  }

  const { label, dot, pulse } = STATUS_CONFIG[adminStatus];

  return (
    <p
      className="flex items-center gap-1.5 border-b border-line px-4 py-2 text-xs text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60 motion-reduce:hidden`}
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      {label}
    </p>
  );
}
