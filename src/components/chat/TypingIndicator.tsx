export default function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-start" role="status" aria-live="polite">
      <div className="rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
        {label}
      </div>
    </div>
  );
}
