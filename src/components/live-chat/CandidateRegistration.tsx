"use client";

import { useRef, useState } from "react";
import { Minus, X } from "lucide-react";
import type { CandidateDetails } from "@/hooks/use-live-chat";

const MOBILE_PATTERN = /^[+()\d\s-]{5,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<keyof CandidateDetails, string>>;

function validate(values: CandidateDetails): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) errors.name = "Full name is required.";

  const email = values.email.trim();
  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";

  const mobile = values.mobile.trim();
  if (!mobile) errors.mobile = "Mobile number is required.";
  else if (!MOBILE_PATTERN.test(mobile)) errors.mobile = "Enter a valid mobile number.";

  if (!values.companyName.trim()) errors.companyName = "Company name is required.";

  return errors;
}

export default function CandidateRegistration({
  onSubmit,
  submitting,
  submitError,
  onMinimise,
  onClose,
  closeButtonRef,
}: {
  onSubmit: (details: CandidateDetails) => void;
  submitting: boolean;
  submitError: string | null;
  onMinimise: () => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [values, setValues] = useState<CandidateDetails>({
    name: "",
    email: "",
    mobile: "",
    companyName: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const submittingRef = useRef(false);

  const handleChange =
    (field: keyof CandidateDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // A ref guard (not just `submitting` state) belt-and-braces against a
    // second click landing between the click and the re-render that disables
    // the button.
    if (submittingRef.current || submitting) return;

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submittingRef.current = true;
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      mobile: values.mobile.trim(),
      companyName: values.companyName.trim(),
    });
    // Released once the parent flips `submitting` back to false on failure;
    // on success this component unmounts before it matters.
    window.setTimeout(() => {
      submittingRef.current = false;
    }, 0);
  };

  return (
    <div
      id="live-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Start live chat"
      className="fixed right-4 top-1/2 z-[100] flex max-h-[85vh] w-[calc(100vw-32px)] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:right-[84px] md:w-[380px] md:max-w-[380px]"
      style={{ right: "max(16px, env(safe-area-inset-right))" }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-sm font-semibold text-white">Start Live Chat</p>
          <p className="mt-1 text-xs text-muted">Tell us a bit about you to get started.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Minimise live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <Field
            id="candidate-name"
            label="Full Name"
            value={values.name}
            error={errors.name}
            onChange={handleChange("name")}
            autoComplete="name"
          />
          <Field
            id="candidate-email"
            label="Email Address"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={handleChange("email")}
            autoComplete="email"
          />
          <Field
            id="candidate-mobile"
            label="Mobile Number"
            type="tel"
            value={values.mobile}
            error={errors.mobile}
            onChange={handleChange("mobile")}
            autoComplete="tel"
          />
          <Field
            id="candidate-company"
            label="Company Name"
            value={values.companyName}
            error={errors.companyName}
            onChange={handleChange("companyName")}
            autoComplete="organization"
            placeholder="Lloyds Banking Group"
          />

          {submitError ? (
            <p role="alert" className="text-xs text-red-400">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex h-11 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-ink transition-opacity duration-150 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {submitting ? "Starting chat…" : "Start Chat"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-11 rounded-2xl border border-line bg-ink px-4 text-sm text-white placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      />
      {error ? (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
