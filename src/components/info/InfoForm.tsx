"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import GradientText from "@/components/ui/GradientText";
import FileUploadField, {
  UPLOAD_FAILED_MESSAGE,
  type AttachmentUploadStatus,
  type UploadedAttachment,
} from "@/components/ui/FileUploadField";
import FormSelectField from "@/components/ui/FormSelectField";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MESSAGE_MAX_CHARS, clampToCharLimit, countCharacters } from "@/lib/contact/message";
import { DEFAULT_MOBILE_COUNTRY, normalizeMobileNumber } from "@/lib/contact/phone";
import { INFO_MAX_MESSAGE_LINKS, INFO_PROJECT_TYPE_OPTIONS, countLinks, validateUrlInput } from "@/lib/info/validation";

const inputClasses =
  "w-full rounded-lg border border-line bg-transparent px-4 py-3 text-paper placeholder:text-muted/60 outline-none transition-colors focus:border-accent aria-[invalid=true]:border-red-400/60";

const SUCCESS_MESSAGE = "Thank you! Your information has been submitted successfully.";
const GENERIC_ERROR = "Something went wrong and your information wasn't sent. Please try again.";

type Status = "idle" | "submitting" | "error";

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm text-muted">
      <GradientText>{children}</GradientText>{" "}
      {required ? <span aria-hidden="true">(required)</span> : <span className="text-xs">(optional)</span>}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-red-300">
      {message}
    </p>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "url";
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "url";
  placeholder?: string;
  error?: string;
}

function TextField({ id, label, type = "text", required, autoComplete, inputMode, placeholder, error }: TextFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className={inputClasses}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        style={{ fontSize: "16px" }}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

/**
 * The form the QR code opens (/info). Posts to /api/info, which validates
 * everything again and emails the submission to Dominic. Text inputs are
 * left uncontrolled so a failed submission never clears what the visitor
 * typed; the form is only reset after a confirmed success.
 */
export default function InfoForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const [startedAt, setStartedAt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mobile, setMobile] = useState("");
  const [mobileCountry, setMobileCountry] = useState<string>(DEFAULT_MOBILE_COUNTRY);
  const [projectType, setProjectType] = useState("");
  const [message, setMessage] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState<AttachmentUploadStatus>("idle");
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null);
  const [attachmentKey, setAttachmentKey] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const mobileHelpId = useId();
  const messageHelpId = useId();

  // Set after mount (not during render) so SSR and hydration agree; the
  // server uses it to reject forms submitted implausibly fast.
  useEffect(() => {
    setStartedAt(String(Date.now()));
  }, []);

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  const messageCharCount = countCharacters(message);
  const isSubmitting = status === "submitting";

  function clearFieldError(name: string) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const rest = { ...prev };
      delete rest[name];
      return rest;
    });
  }

  // Any edit makes this a new submission. An unedited retry keeps the same
  // id, so the server can't send the same email twice.
  function handleFormInput(event: FormEvent<HTMLFormElement>) {
    submissionIdRef.current = null;
    const target = event.target as HTMLInputElement | null;
    if (target?.name) clearFieldError(target.name);
  }

  function validate(data: FormData): Record<string, string> {
    const errors: Record<string, string> = {};
    const get = (key: string) => String(data.get(key) ?? "").trim();

    if (!get("fullName")) errors.fullName = "Enter your full name.";
    const email = get("email");
    if (!email) errors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!mobile.trim()) errors.mobile = "Enter your mobile number.";
    else {
      const result = normalizeMobileNumber(mobile, mobileCountry);
      if (result.error) errors.mobile = result.error;
    }
    if (!get("company")) errors.company = "Enter your company.";

    const linkedin = validateUrlInput(get("linkedinUrl"), "LinkedIn URL", "linkedin.com");
    if (linkedin) errors.linkedinUrl = linkedin;
    const github = validateUrlInput(get("githubUrl"), "GitHub URL", "github.com");
    if (github) errors.githubUrl = github;
    const other = validateUrlInput(get("otherUrl"), "URL");
    if (other) errors.otherUrl = other;

    if (countLinks(message) > INFO_MAX_MESSAGE_LINKS) {
      errors.message = `Please include no more than ${INFO_MAX_MESSAGE_LINKS} links in your message.`;
    }
    if (attachmentStatus === "uploading") errors.attachment = "Please wait for your file to finish uploading.";
    else if (attachmentStatus === "error") errors.attachment = UPLOAD_FAILED_MESSAGE;
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return; // blocks double-clicks before React re-renders

    const form = event.currentTarget;
    const data = new FormData(form);

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("Please correct the highlighted fields.");
      setStatus("error");
      return;
    }

    submissionIdRef.current ??= crypto.randomUUID();
    data.set("submissionId", submissionIdRef.current);

    submittingRef.current = true;
    setStatus("submitting");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/info", { method: "POST", body: data });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string; fields?: Record<string, string> };
      } | null;

      if (!response.ok || !result?.success) {
        setFieldErrors(result?.error?.fields ?? {});
        setErrorMessage(result?.error?.message ?? GENERIC_ERROR);
        setStatus("error");
        return;
      }

      // Success: clear everything, then confirm in the dialog.
      form.reset();
      setMobile("");
      setMobileCountry(DEFAULT_MOBILE_COUNTRY);
      setProjectType("");
      setMessage("");
      // The blob was emailed and deleted server-side; remount the field so
      // it doesn't try to delete it again or show the old file.
      setAttachment(null);
      setAttachmentStatus("idle");
      setAttachmentKey((key) => key + 1);
      submissionIdRef.current = null;
      setStartedAt(String(Date.now()));
      setStatus("idle");
      setSuccessOpen(true);
    } catch {
      setErrorMessage(GENERIC_ERROR);
      setStatus("error");
    } finally {
      submittingRef.current = false;
    }
  }

  function retry() {
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onInput={handleFormInput}
        noValidate
        aria-busy={isSubmitting}
        className="space-y-5"
      >
        <fieldset disabled={isSubmitting} className="space-y-5 disabled:opacity-80">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="fullName" label="Full Name" required autoComplete="name" error={fieldErrors.fullName} />
            <TextField
              id="email"
              label="Email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              error={fieldErrors.email}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <PhoneNumberField
              value={mobile}
              country={mobileCountry}
              onValueChange={(value) => {
                setMobile(value);
                clearFieldError("mobile");
              }}
              onCountryChange={setMobileCountry}
              error={fieldErrors.mobile}
              helperId={mobileHelpId}
              required
            />
            <TextField
              id="company"
              label="Company"
              required
              autoComplete="organization"
              error={fieldErrors.company}
            />
          </div>

          <FormSelectField
            id="projectType"
            name="projectType"
            label={<GradientText>Project Type</GradientText>}
            placeholder="Select a project type"
            value={projectType}
            options={INFO_PROJECT_TYPE_OPTIONS}
            onValueChange={(value) => {
              setProjectType(value);
              submissionIdRef.current = null;
            }}
            error={fieldErrors.projectType}
          />

          <FileUploadField
            key={attachmentKey}
            id="attachment"
            label="CV, job description or other files"
            status={attachmentStatus}
            onStatusChange={setAttachmentStatus}
            attachment={attachment}
            onAttachmentChange={(next) => {
              setAttachment(next);
              submissionIdRef.current = null;
              clearFieldError("attachment");
            }}
            serverError={fieldErrors.attachment}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="linkedinUrl"
              label="LinkedIn URL"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="linkedin.com/in/your-name"
              error={fieldErrors.linkedinUrl}
            />
            <TextField
              id="githubUrl"
              label="GitHub URL"
              type="url"
              inputMode="url"
              placeholder="github.com/your-name"
              error={fieldErrors.githubUrl}
            />
          </div>

          <TextField
            id="otherUrl"
            label="Other URL"
            type="url"
            inputMode="url"
            placeholder="Portfolio, company site or job posting"
            error={fieldErrors.otherUrl}
          />

          <div>
            <FieldLabel htmlFor="message">Message</FieldLabel>
            <textarea
              id="message"
              name="message"
              rows={5}
              maxLength={MESSAGE_MAX_CHARS}
              value={message}
              onChange={(e) => setMessage(clampToCharLimit(e.target.value, MESSAGE_MAX_CHARS))}
              className={inputClasses}
              aria-invalid={Boolean(fieldErrors.message)}
              aria-describedby={[messageHelpId, fieldErrors.message ? "message-error" : null].filter(Boolean).join(" ")}
              style={{ fontSize: "16px" }}
            />
            <div className="mt-1.5 flex items-start justify-between gap-3">
              <FieldError id="message-error" message={fieldErrors.message} />
              <p id={messageHelpId} className="ml-auto shrink-0 text-xs text-muted">
                {messageCharCount.toLocaleString()} / {MESSAGE_MAX_CHARS.toLocaleString()} characters
              </p>
            </div>
          </div>

          {/* Spam protection: hidden from people and assistive tech; bots that fill it are dropped server-side. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="startedAt" value={startedAt} />
        </fieldset>

        {status === "error" && (
          <div
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className="flex flex-col gap-3 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 outline-none sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </p>
            {Object.keys(fieldErrors).length === 0 && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-red-300/40 px-4 py-2 text-xs font-medium text-red-100 transition-colors hover:bg-red-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 sm:self-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </button>
            )}
          </div>
        )}

        <div className="flex justify-center sm:justify-start">
          <button
            type="submit"
            disabled={isSubmitting || attachmentStatus === "uploading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cta px-8 py-3.5 text-sm font-medium text-cta-fg transition-colors hover:bg-accent hover:text-accent-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <GradientText variant="button">Submit</GradientText>
            )}
          </button>
        </div>

        <p role="status" aria-live="polite" className="sr-only">
          {isSubmitting ? "Submitting your information…" : ""}
        </p>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl text-center sm:rounded-2xl">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" aria-hidden="true" />
          <DialogTitle className="text-xl leading-snug">{SUCCESS_MESSAGE}</DialogTitle>
          <DialogDescription>I&rsquo;ll be in touch soon.</DialogDescription>
          <DialogClose className="mx-auto mt-2 inline-flex items-center justify-center rounded-full bg-cta px-6 py-2.5 text-sm font-medium text-cta-fg transition-colors hover:bg-accent hover:text-accent-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta">
            Close
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
