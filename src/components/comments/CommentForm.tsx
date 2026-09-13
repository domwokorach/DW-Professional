"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Button from "@/components/ui/Button";
import { COMMENT_BODY_MAX_LENGTH, ALLOWED_AVATAR_TYPES, AVATAR_MAX_BYTES } from "@/lib/comments/validation";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function CommentForm() {
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [body, setBody] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(file: File | null) {
    setAvatarError(null);
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Image must be smaller than 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      formData.set("company", company);
      formData.set("body", body);
      if (avatarFile) formData.set("avatar", avatarFile);

      const res = await fetch("/api/comments", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-accent" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-white">Thanks for your comment</h3>
        <p className="max-w-sm text-sm text-muted">
          It&rsquo;s been submitted for review and will appear here once approved.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      {errorMessage ? (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0 border border-line">
          <AvatarImage src={avatarPreview ?? undefined} alt="" />
          <AvatarFallback className="bg-ink text-white">{initials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <label
              htmlFor="comment-avatar"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-accent/60 hover:text-accent"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              {avatarPreview ? "Change photo" : "Upload photo"}
            </label>
            {avatarPreview ? (
              <button
                type="button"
                onClick={clearAvatar}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" /> Remove
              </button>
            ) : null}
            <input
              ref={fileInputRef}
              id="comment-avatar"
              type="file"
              accept={ALLOWED_AVATAR_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <p className="text-xs text-muted">Optional. JPEG, PNG, WebP, or GIF — up to 5 MB.</p>
          {avatarError ? <p className="text-xs text-red-400">{avatarError}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="comment-name">Full name</Label>
          <Input
            id="comment-name"
            required
            maxLength={120}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Sarah Johnson"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-company">Company (optional)</Label>
          <Input
            id="comment-company"
            maxLength={160}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Lloyds Banking Group"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="comment-body">Comment</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              body.length > COMMENT_BODY_MAX_LENGTH ? "text-red-400" : "text-muted"
            )}
          >
            {body.length}/{COMMENT_BODY_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="comment-body"
          required
          rows={4}
          maxLength={COMMENT_BODY_MAX_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your experience working together…"
        />
      </div>

      <Button
        type="submit"
        className="mt-6 w-full sm:w-auto"
        disabled={submitting || !fullName.trim() || !body.trim()}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Submitting…" : "Submit Comment"}
      </Button>
    </form>
  );
}
