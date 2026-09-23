import type { AdminPresenceState } from "@/types/socket";

// Copy and colour match the brief exactly: a status word plus a short
// second line, never colour alone (the word itself is always present too).
const STATUS_CONFIG: Record<AdminPresenceState, { label: string; detail: string; dot: string; pulse: boolean }> = {
  online: { label: "Online", detail: "Usually replies shortly", dot: "bg-emerald-400", pulse: true },
  away: {
    label: "Away",
    detail: "I may take a little longer to reply.",
    dot: "bg-amber-400",
    pulse: false,
  },
  busy: {
    label: "Busy",
    detail: "I'm currently busy but you can still leave a message.",
    dot: "bg-red-400",
    pulse: false,
  },
  offline: {
    label: "Offline",
    detail: "Leave a message and I'll get back to you.",
    dot: "bg-muted",
    pulse: false,
  },
};

/**
 * Shows Dominic's current availability at all times, independent of
 * whether an admin has opened this specific conversation yet — the brief
 * requires this to be visible from the moment Live Chat opens, not just
 * once someone has replied.
 */
export default function PresenceBanner({ adminStatus }: { adminStatus: AdminPresenceState }) {
  const { label, detail, dot, pulse } = STATUS_CONFIG[adminStatus];

  return (
    <div
      className="flex items-start gap-1.5 border-b border-line px-4 py-2 text-xs text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="relative mt-1 flex h-2 w-2 shrink-0">
        {pulse ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${dot} opacity-60 motion-reduce:hidden`}
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span>
        <span className="font-medium text-paper">{label}</span>
        <br />
        {detail}
      </span>
    </div>
  );
}
