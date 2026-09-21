import ChatLoadingIndicator from "@/components/chat/ChatLoadingIndicator";

export default function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm text-muted">
        <span>{label}</span>
        <ChatLoadingIndicator label={label} size="sm" standalone={false} />
      </div>
    </div>
  );
}
