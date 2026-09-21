"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Button from "@/components/ui/Button";
import BorderGlow from "@/components/ui/BorderGlow";
import CompanyAutocomplete from "@/components/comments/CompanyAutocomplete";
import MobileNumberInput, {
  type MobileNumberChange,
} from "@/components/comments/MobileNumberInput";
import {
  COMMENT_BODY_MAX_LENGTH,
  ALLOWED_AVATAR_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/comments/validation";
import { cn } from "@/lib/utils";
import type { CompanySearchResult } from "@/types/company";

// Mirrors COMMENT_PIN_RESEND_COOLDOWN_SECONDS in src/lib/auth/env.ts — kept as
// a plain constant here rather than importing that (server-oriented) module
// into a client component.
const COMMENT_PIN_RESEND_COOLDOWN_SECONDS = 60;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type VerificationChannel = "email" | "sms";

export default function CommentForm() {
  const [fullName, setFullName] = useState("");
  const [channel, setChannel] = useState<VerificationChannel>("email");
  const [company, setCompany] = useState("");
  const [companyMeta, setCompanyMeta] = useState<CompanySearchResult | null>(
    null,
  );

  async function handleCompanySelect(selected: CompanySearchResult | null) {
    setCompanyMeta(selected);
    if (!selected?.companyNumber) return;
    try {
      const res = await fetch(
        `/api/companies/profile?number=${encodeURIComponent(selected.companyNumber)}`,
      );
      if (!res.ok) return;
      const profile: { status?: string; industry?: string } = await res.json();
      setCompanyMeta((current) => {
        if (!current || current.companyNumber !== selected.companyNumber) return current;
        return {
          ...current,
          status: profile.status ?? current.status,
          industry: profile.industry ?? current.industry,
        };
      });
    } catch (error) {
      // Enrichment is optional — the base selection (name, number, location)
      // already came back from search, so a failed profile fetch just means
      // the industry/status badge won't show.
      console.error("[comments] company profile enrichment failed:", error);
    }
  }
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState<MobileNumberChange>({
    raw: "",
    e164: null,
    isValid: false,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      if (company.trim()) formData.set("company", company.trim());
      if (companyMeta?.id) formData.set("companyId", companyMeta.id);
      if (companyMeta?.companyNumber)
        formData.set("companyNumber", companyMeta.companyNumber);
      if (companyMeta?.status) formData.set("companyStatus", companyMeta.status);
      if (companyMeta?.domain)
        formData.set("companyDomain", companyMeta.domain);
      if (companyMeta?.logo) formData.set("companyLogo", companyMeta.logo);
      if (companyMeta?.industry)
        formData.set("companyIndustry", companyMeta.industry);
      if (companyMeta?.location)
        formData.set("companyLocation", companyMeta.location);
      formData.set(
        "companySource",
        company.trim() ? (companyMeta ? companyMeta.source : "manual") : "",
      );
      formData.set("body", body);
      formData.set("email", email);
      formData.set("mobile", mobile.e164 ?? mobile.raw);
      formData.set("channel", channel);
      if (avatarFile) formData.set("avatar", avatarFile);

      let res: Response;
      try {
        res = await fetch("/api/comments/send-pin", {
          method: "POST",
          body: formData,
        });
      } catch (fetchError) {
        // fetch() itself only rejects for a genuine network failure (offline,
        // DNS, CORS) — this is the one case that's actually "check your
        // connection", so it keeps that message and nothing else does.
        console.error("[comments] fetch failed:", fetchError);
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }

      let data: {
        ok?: boolean;
        requestId?: string;
        error?: { message?: string };
      } | null = null;
      try {
        data = await res.json();
      } catch (parseError) {
        // The server responded, but not with JSON — e.g. a platform error
        // page for an unhandled exception. This is a real server-side
        // failure, not a client network issue, so it gets its own message.
        console.error("[comments] unexpected response body:", parseError);
        throw new Error(
          "Unexpected response from the server. Please try again shortly.",
        );
      }

      if (!res.ok || !data?.requestId) {
        throw new Error(
          data?.error?.message ?? "Something went wrong. Please try again.",
        );
      }

      setRequestId(data.requestId);
      setResendCooldown(COMMENT_PIN_RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      console.error("[comments] submit failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyPin(event: FormEvent) {
    event.preventDefault();
    if (!requestId) return;
    setVerifying(true);
    setErrorMessage(null);

    try {
      let res: Response;
      try {
        res = await fetch("/api/comments/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, pin }),
        });
      } catch (fetchError) {
        console.error("[comments] verify fetch failed:", fetchError);
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }

      let data: { ok?: boolean; error?: { message?: string } } | null = null;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error(
          "[comments] unexpected verify response body:",
          parseError,
        );
        throw new Error(
          "Unexpected response from the server. Please try again shortly.",
        );
      }

      if (!res.ok) {
        throw new Error(
          data?.error?.message ??
            "That code isn't right. Please check and try again.",
        );
      }

      setSubmitted(true);
    } catch (error) {
      console.error("[comments] verify failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendPin() {
    if (!requestId || resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage(null);
    setResendMessage(null);

    try {
      let res: Response;
      try {
        res = await fetch("/api/comments/resend-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId }),
        });
      } catch (fetchError) {
        console.error("[comments] resend fetch failed:", fetchError);
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }

      let data: {
        ok?: boolean;
        retryAfterSeconds?: number;
        error?: { message?: string };
      } | null = null;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error(
          "[comments] unexpected resend response body:",
          parseError,
        );
        throw new Error(
          "Unexpected response from the server. Please try again shortly.",
        );
      }

      if (!res.ok) {
        setResendCooldown(
          data?.retryAfterSeconds ?? COMMENT_PIN_RESEND_COOLDOWN_SECONDS,
        );
        throw new Error(
          data?.error?.message ??
            "We couldn't resend the code. Please try again.",
        );
      }

      setPin("");
      setResendCooldown(
        data?.retryAfterSeconds ?? COMMENT_PIN_RESEND_COOLDOWN_SECONDS,
      );
      setResendMessage("We've sent a new code to your email.");
    } catch (error) {
      console.error("[comments] resend failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-accent" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-white">
          Thanks for your comment
        </h3>
        <p className="max-w-sm text-sm text-muted">
          It&rsquo;s been submitted for review and will appear here once
          approved.
        </p>
      </div>
    );
  }

  if (requestId) {
    return (
      <form
        className="rounded-2xl border border-line bg-surface p-6 text-center sm:p-8"
        onSubmit={handleVerifyPin}
        noValidate
      >
        {errorMessage ? (
          <Alert variant="destructive" role="alert" className="mb-4 text-left">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <h3 className="text-lg font-semibold text-white">
          {channel === "sms" ? "Check your phone" : "Check your email"}
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          We sent a 6-digit code to{" "}
          {channel === "sms" ? mobile.e164 ?? mobile.raw : email}. Enter it
          below to confirm your comment.
        </p>
        <div className="mx-auto mt-6 max-w-[220px] space-y-2 text-left">
          <Label htmlFor="comment-pin">Verification code</Label>
          <Input
            id="comment-pin"
            required
            inputMode="numeric"
            maxLength={6}
            className="text-center tracking-[0.4em]"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
          />
        </div>
        <Button
          type="submit"
          className="mt-6 w-full sm:w-auto"
          disabled={verifying || pin.length !== 6}
        >
          {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {verifying ? "Verifying…" : "Confirm code"}
        </Button>

        {resendMessage ? (
          <p
            className="mt-3 text-xs text-accent"
            role="status"
            aria-live="polite"
          >
            {resendMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleResendPin}
          disabled={resending || resendCooldown > 0}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-muted"
        >
          {resending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : null}
          {resending
            ? "Resending…"
            : resendCooldown > 0
              ? `Resend PIN in ${resendCooldown}s`
              : "Resend PIN"}
        </button>

        <button
          type="button"
          onClick={() => {
            setRequestId(null);
            setPin("");
            setErrorMessage(null);
            setResendMessage(null);
            setResendCooldown(0);
          }}
          className="mt-2 block w-full text-xs text-muted hover:text-white"
        >
          {channel === "sms" ? "Use a different number" : "Use a different email"}
        </button>
      </form>
    );
  }

  return (
    <BorderGlow>
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
            <AvatarFallback className="bg-ink text-white">
              {initials(fullName)}
            </AvatarFallback>
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
                onChange={(e) =>
                  handleAvatarChange(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <p className="text-xs text-muted">
              Optional. JPEG, PNG, WebP, or GIF — up to 5 MB.
            </p>
            {avatarError ? (
              <p className="text-xs text-red-400">{avatarError}</p>
            ) : null}
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
            <CompanyAutocomplete
              id="comment-company"
              maxLength={160}
              value={company}
              onChange={setCompany}
              onSelect={handleCompanySelect}
              placeholder="Search UK companies"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="comment-email">Email</Label>
            <Input
              id="comment-email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-mobile">Mobile number</Label>
            <MobileNumberInput id="comment-mobile" required onChange={setMobile} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <span className="block text-sm font-medium">Send my verification code by</span>
          <div role="radiogroup" aria-label="Verification code delivery method" className="flex gap-2">
            {(
              [
                { value: "email", label: "Email" },
                { value: "sms", label: "Text message" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={channel === option.value}
                onClick={() => setChannel(option.value)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  channel === option.value
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-line text-muted hover:border-accent/60 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="comment-body">Comment</Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                body.length > COMMENT_BODY_MAX_LENGTH
                  ? "text-red-400"
                  : "text-muted",
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

        <p className="mt-4 text-xs text-muted">
          When you click &ldquo;Submit Comment&rdquo;, we will use your email
          address and mobile number to verify your details. A verification PIN
          will be sent to{" "}
          {channel === "sms" ? "your mobile number by text message" : "your email address"}
          . Please enter the PIN to confirm your submission. After
          verification, your comment will be sent to the administrator for
          review. Your comment will only appear publicly on the website after
          it has been approved.
        </p>

        <Button
          type="submit"
          className="mt-4 w-full sm:w-auto"
          disabled={
            submitting ||
            !fullName.trim() ||
            !body.trim() ||
            !email.trim() ||
            !mobile.isValid
          }
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Sending code…" : "Submit Comment"}
        </Button>
      </form>
    </BorderGlow>
  );
}
