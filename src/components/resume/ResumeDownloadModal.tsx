"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import OtpInput from "@/components/ui/OtpInput";
import {
  RESEND_COOLDOWN_SECONDS,
  RESUME_PIN_TTL_MINUTES,
} from "@/lib/resumeConstants";

type Step = "email" | "pin" | "success";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_LENGTH = 6;
const EXPIRED_REASON = "Code has expired";

export default function ResumeDownloadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [challenge, setChallenge] = useState("");
  const [downloadToken, setDownloadToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const isExpired = error === EXPIRED_REASON;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setPin("");
    setChallenge("");
    setDownloadToken("");
    setError("");
    setLoading(false);
    setCooldown(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    return () => previouslyFocusedRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (step === "email") emailInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  async function requestPin(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resume/request-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't send the code. Try again.");
        return;
      }

      setEmail(trimmed);
      setChallenge(data.challenge);
      setPin("");
      setStep("pin");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Couldn't send the code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPin(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(pin)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resume/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, challenge }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Incorrect code.");
        return;
      }

      setDownloadToken(data.downloadToken);
      setStep("success");
    } catch {
      setError("Couldn't verify the code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-modal-title"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[13px] font-bold tracking-wide text-ink">
                DW
              </span>
              <span className="text-sm font-medium text-muted">
                Dominic Wokorach
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 id="resume-modal-title" className="text-lg font-medium text-white">
                  {step === "success" ? "Resume ready" : "Verify your email"}
                </h2>
                {step === "pin" && (
                  <p className="mt-0.5 text-xs text-muted">
                    Code sent to <span className="text-white">{email}</span>
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1 text-muted hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                ✕
              </button>
            </div>

            {step === "email" && (
              <form onSubmit={requestPin} className="mt-5 space-y-4">
                <p className="text-sm leading-[1.6] text-muted">
                  Enter your email address and we&rsquo;ll send a verification
                  PIN to your inbox before you download the resume.
                </p>
                <div>
                  <label htmlFor="resume-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    ref={emailInputRef}
                    id="resume-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="min-h-11 w-full rounded-lg border border-line bg-black/30 px-4 py-3 text-sm text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "resume-email-error" : undefined}
                  />
                </div>
                {error && (
                  <div
                    id="resume-email-error"
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send verification PIN"}
                </button>
              </form>
            )}

            {step === "pin" && (
              <form onSubmit={verifyPin} className="mt-5 space-y-4">
                <p className="text-sm leading-[1.6] text-muted">
                  Enter the 6-digit code from the email to continue.
                </p>
                <div>
                  <label htmlFor="resume-pin-0" className="sr-only">
                    Verification PIN
                  </label>
                  <OtpInput
                    id="resume-pin"
                    value={pin}
                    onChange={(value) => {
                      setPin(value);
                      if (error) setError("");
                    }}
                    autoFocus
                    invalid={!!error}
                    disabled={loading}
                    aria-label="Six-digit verification code"
                  />
                  <p className="mt-3 text-center text-xs text-muted">
                    This code expires in {RESUME_PIN_TTL_MINUTES} minutes.
                  </p>
                </div>
                {error && (
                  <div
                    id="resume-pin-error"
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                  >
                    <p>{isExpired ? "This code has expired." : error}</p>
                    {isExpired && (
                      <p className="mt-1 text-red-300/80">
                        Request a new code below to keep going.
                      </p>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || pin.length !== PIN_LENGTH}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="min-h-11 text-xs text-muted hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => requestPin()}
                    disabled={cooldown > 0 || loading}
                    className="min-h-11 text-xs text-muted hover:text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="mt-5 space-y-4">
                <div className="flex justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-accent"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                </div>
                <p className="text-sm leading-[1.6] text-muted">
                  Your email has been verified. Click below to download the
                  resume.
                </p>
                <a
                  href={`/api/resume/download?token=${encodeURIComponent(downloadToken)}`}
                  download="Dominic-Wokorach-Resume.pdf"
                  onClick={() => setTimeout(onClose, 400)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  Download Resume
                </a>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
