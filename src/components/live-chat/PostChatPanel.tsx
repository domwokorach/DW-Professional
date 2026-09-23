"use client";

import { useState } from "react";
import { Star, Download } from "lucide-react";

/**
 * Shown in place of the composer once a conversation is closed — transcript
 * download works any time (idempotent GET), the rating can only ever be
 * submitted once (the server enforces this too, see
 * src/lib/chat/rate-conversation.ts; the client-side `submitted` flag is
 * just to keep the confirmation from disappearing on its own).
 */
export default function PostChatPanel({ conversationId, visitorId }: { conversationId: string; visitorId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transcriptHref = `/api/chat/conversations/${conversationId}/transcript?visitorId=${encodeURIComponent(visitorId)}`;

  async function handleSubmit() {
    if (rating < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, rating, feedback: feedback.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError("Couldn't submit your feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-4">
      <a
        href={transcriptHref}
        download
        className="flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-paper transition-colors duration-150 hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download transcript
      </a>

      {submitted ? (
        <p className="text-center text-sm text-muted" role="status" aria-live="polite">
          Thanks for your feedback.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-center text-sm text-paper">How was your chat experience?</p>
          <div className="flex items-center justify-center gap-1" role="radiogroup" aria-label="Rate your experience, 1 to 5 stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Star
                  className={`h-5 w-5 ${
                    value <= (hoverRating || rating) ? "fill-accent text-accent" : "text-muted"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          {rating > 0 ? (
            <>
              <label htmlFor="chat-feedback" className="sr-only">
                Tell me more about your experience
              </label>
              <textarea
                id="chat-feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Tell me more about your experience (optional)"
                rows={2}
                maxLength={2000}
                className="w-full min-w-0 resize-none rounded-xl border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
              {error ? (
                <p className="text-center text-xs text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  className="rounded-full px-4 py-2 text-xs font-medium text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-ink transition-opacity duration-150 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
                >
                  {submitting ? "Submitting…" : "Submit feedback"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
