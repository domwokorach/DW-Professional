export default function OnlineStatus({ online }: { online: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-accent3" : "border border-muted"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
