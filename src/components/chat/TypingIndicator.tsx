export default function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
        <span>{label}</span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-muted motion-safe:animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
      </div>
    </div>
  );
}
