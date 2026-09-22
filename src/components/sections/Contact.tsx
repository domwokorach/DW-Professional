"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import GradientText from "@/components/ui/GradientText";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import GlyphMatrixBackground from "@/components/magicui/glyph-matrix-background";
import FileUploadField, { type AttachmentUploadStatus, type UploadedAttachment } from "@/components/ui/FileUploadField";
import FormSelectField from "@/components/ui/FormSelectField";
import PhoneNumberField from "@/components/ui/PhoneNumberField";
import CompanySearchField from "@/components/companies/CompanySearchField";
import { social } from "@/data/navigation";
import { MESSAGE_MAX_CHARS, clampToCharLimit, countCharacters } from "@/lib/contact/message";
import { DEFAULT_MOBILE_COUNTRY, normalizeMobileNumber } from "@/lib/contact/phone";
import { BUDGET_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/contact/validation";

const inputClasses =
  "w-full rounded-lg border border-line bg-transparent px-4 py-3 text-paper placeholder:text-muted/60 outline-none transition-colors focus:border-accent";

interface SubmittedAttachment {
  name: string;
  size: number;
}

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [messageTouched, setMessageTouched] = useState(false);
  const [limitAnnouncement, setLimitAnnouncement] = useState("");
  const lastAnnouncedRef = useRef<"none" | "warning" | "limit">("none");
  const [mobile, setMobile] = useState("");
  const [mobileCountry, setMobileCountry] = useState<string>(DEFAULT_MOBILE_COUNTRY);
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] = useState("");
  const [attachmentStatus, setAttachmentStatus] = useState<AttachmentUploadStatus>("idle");
  const [attachment, setAttachment] = useState<UploadedAttachment | null>(null);
  const [submittedAttachment, setSubmittedAttachment] = useState<SubmittedAttachment | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const messageHelpId = useId();
  const companyHelpId = useId();
  const mobileHelpId = useId();

  const trimmedMessage = message.trim();
  const messageCharCount = useMemo(() => countCharacters(message), [message]);
  const messageCharsRemaining = MESSAGE_MAX_CHARS - messageCharCount;
  const MESSAGE_WARNING_THRESHOLD = 200;
  const isMessageWarning = messageCharsRemaining <= MESSAGE_WARNING_THRESHOLD && messageCharsRemaining > 0;
  const isMessageAtLimit = messageCharsRemaining <= 0;
  const messageRequiredError =
    (messageTouched || status === "error") && !trimmedMessage ? "Message is required" : "";
  const messageError = fieldErrors.message || messageRequiredError;

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  // Announce only when crossing into the warning / limit-reached thresholds,
  // never on every keystroke, so screen reader users aren't spammed.
  useEffect(() => {
    if (isMessageAtLimit) {
      if (lastAnnouncedRef.current !== "limit") {
        lastAnnouncedRef.current = "limit";
        setLimitAnnouncement("Character limit reached.");
      }
    } else if (isMessageWarning) {
      if (lastAnnouncedRef.current === "none") {
        lastAnnouncedRef.current = "warning";
        setLimitAnnouncement(`${messageCharsRemaining.toLocaleString()} characters left.`);
      }
    } else {
      lastAnnouncedRef.current = "none";
    }
  }, [isMessageAtLimit, isMessageWarning, messageCharsRemaining]);

  function handleMessageChange(next: string) {
    setMessage(clampToCharLimit(next, MESSAGE_MAX_CHARS));
    setFieldErrors((prev) => {
      if (!prev.message) return prev;
      const rest = { ...prev };
      delete rest.message;
      return rest;
    });
  }

  function handleAttachmentChange(next: UploadedAttachment | null) {
    setAttachment(next);
    setFieldErrors((prev) => {
      if (!prev.attachment) return prev;
      const rest = { ...prev };
      delete rest.attachment;
      return rest;
    });
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === "submitting" || status === "sent") return;

    if (attachmentStatus === "uploading") {
      setFieldErrors({ attachment: "Please wait for the attachment to finish uploading." });
      setStatus("error");
      setErrorMessage("Please correct the highlighted fields below.");
      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();

    setMessageTouched(true);

    const nextFieldErrors: Record<string, string> = {};
    if (!name) nextFieldErrors.name = "Enter your name.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) nextFieldErrors.email = "Enter your email address.";
    else if (!emailPattern.test(email)) nextFieldErrors.email = "Enter a valid email address.";
    if (mobile.trim()) {
      const mobileResult = normalizeMobileNumber(mobile, mobileCountry);
      if (mobileResult.error) nextFieldErrors.mobile = mobileResult.error;
    }
    if (!trimmedMessage) nextFieldErrors.message = "Message is required";
    else if (countCharacters(trimmedMessage) > MESSAGE_MAX_CHARS) {
      nextFieldErrors.message = `Keep your message to ${MESSAGE_MAX_CHARS.toLocaleString()} characters or fewer.`;
    }
    if (attachmentStatus === "error") {
      nextFieldErrors.attachment = "Upload failed. Please try again.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setStatus("error");
      setErrorMessage("Please correct the highlighted fields below.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: data,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        const message: string = result?.error?.message ?? result?.error ?? "Failed to send your message";
        const fields: Record<string, string> = result?.error?.fields ?? {};
        setFieldErrors(fields);
        throw new Error(message);
      }

      setSubmittedAttachment(result.attachment ?? null);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <section id="contact" className="relative scroll-mt-24 border-t border-line py-28 sm:py-36">
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="relative overflow-hidden">
            <GlyphMatrixBackground className="opacity-50" fadeBottom={0.85} />

            <div className="relative z-10">
              <SectionHeading
                index="08"
                label="Contact"
                heading="Have a project in mind?"
                animateHeading
                headingEffect="typing"
              />

            <MotionReveal delay={0.1} className="mt-8 max-w-md">
              <p className="text-base leading-[1.7] text-muted">
                Whether you need a modern frontend application, a responsive
                website, an API-driven product or support improving an
                existing digital experience, I&rsquo;d be happy to discuss
                your project.
              </p>
            </MotionReveal>

            <MotionReveal delay={0.15} className="mt-8">
              <p className="text-lg font-medium text-paper">
                Let&rsquo;s work together.
              </p>
            </MotionReveal>

            <MotionReveal delay={0.2} className="mt-10 space-y-3 text-sm">
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-paper transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-paper transition-colors"
              >
                GitHub
              </a>
              <a
                href={social.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-paper transition-colors"
              >
                Portfolio
              </a>
            </MotionReveal>
            </div>
          </div>

          <MotionReveal delay={0.1}>
            {status === "sent" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-line px-6 py-16 text-center"
              >
                <h3
                  ref={successRef}
                  tabIndex={-1}
                  className="text-2xl font-medium text-paper"
                >
                  Thank you
                </h3>
                <p className="max-w-xs text-sm text-muted">
                  Your message has been sent. I&rsquo;ll get back to you soon.
                  {submittedAttachment
                    ? ` I've received your file: ${submittedAttachment.name}.`
                    : ""}
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-muted">
                    <GradientText>Name</GradientText>{" "}
                    <span aria-hidden="true">(required)</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className={inputClasses}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    style={{ fontSize: "16px" }}
                  />
                  {fieldErrors.name && (
                    <p id="name-error" role="alert" className="mt-2 text-sm text-red-300">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-muted">
                    <GradientText>Email</GradientText>{" "}
                    <span aria-hidden="true">(required)</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClasses}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    style={{ fontSize: "16px" }}
                  />
                  {fieldErrors.email && (
                    <p id="email-error" role="alert" className="mt-2 text-sm text-red-300">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <PhoneNumberField
                value={mobile}
                country={mobileCountry}
                onValueChange={setMobile}
                onCountryChange={setMobileCountry}
                error={fieldErrors.mobile}
                helperId={mobileHelpId}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm text-muted">
                    <GradientText>Company</GradientText>{" "}
                    <span className="text-xs">(optional)</span>
                  </label>
                  <CompanySearchField
                    id="company"
                    name="companyName"
                    value={company}
                    onChange={setCompany}
                    inputClassName={inputClasses}
                    helperId={companyHelpId}
                  />
                  <p id={companyHelpId} className="mt-1.5 text-xs text-muted">
                    Search by company name, postcode or registration number
                  </p>
                </div>
                <FormSelectField
                  id="budget"
                  name="budget"
                  label={<GradientText>Budget</GradientText>}
                  placeholder="Select your budget"
                  value={budget}
                  options={BUDGET_OPTIONS}
                  onValueChange={setBudget}
                  error={fieldErrors.budget}
                />
              </div>

              <FormSelectField
                id="projectType"
                name="projectType"
                label={<GradientText>Project Type</GradientText>}
                placeholder="Select a project type"
                value={projectType}
                options={PROJECT_TYPE_OPTIONS}
                onValueChange={setProjectType}
                error={fieldErrors.projectType}
              />

              <FileUploadField
                id="attachment"
                label="Project brief, screenshots or specs"
                status={attachmentStatus}
                onStatusChange={setAttachmentStatus}
                attachment={attachment}
                onAttachmentChange={handleAttachmentChange}
                serverError={fieldErrors.attachment}
              />

              <div>
                <label htmlFor="message" className="mb-2 block text-sm text-muted">
                  <GradientText>Message</GradientText>{" "}
                  <span aria-hidden="true">(required)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  maxLength={MESSAGE_MAX_CHARS}
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onBlur={() => setMessageTouched(true)}
                  className={inputClasses}
                  aria-invalid={Boolean(messageError)}
                  aria-describedby={[messageHelpId, messageError ? "message-error" : null]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ fontSize: "16px" }}
                />
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  {messageError ? (
                    <p id="message-error" role="alert" className="text-sm text-red-300">
                      {messageError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    id={messageHelpId}
                    className={`shrink-0 text-right text-xs ${
                      isMessageAtLimit
                        ? "font-semibold text-red-300"
                        : isMessageWarning
                          ? "font-medium text-amber-400"
                          : "text-muted"
                    }`}
                  >
                    {isMessageAtLimit ? (
                      <span aria-hidden="true">⚠ Limit reached — </span>
                    ) : isMessageWarning ? (
                      <span aria-hidden="true">⚠ </span>
                    ) : null}
                    {messageCharCount.toLocaleString()} / {MESSAGE_MAX_CHARS.toLocaleString()} characters
                    <br className="sm:hidden" />
                    <span className="sm:before:content-['_·_']">
                      {messageCharsRemaining.toLocaleString()} characters left
                    </span>
                  </p>
                </div>
                <span className="sr-only" role="status" aria-live="polite">
                  {limitAnnouncement}
                </span>
              </div>

              <button
                type="submit"
                disabled={status === "submitting" || attachmentStatus === "uploading"}
                className="group inline-flex items-center gap-2 rounded-full bg-cta px-6 py-3.5 text-sm font-medium text-cta-fg transition-colors hover:bg-accent hover:text-accent-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? (
                  "Sending…"
                ) : (
                  <GradientText variant="button">Send Enquiry →</GradientText>
                )}
              </button>

              <p
                ref={errorRef}
                role={status === "error" ? "alert" : "status"}
                aria-live={status === "error" ? "assertive" : "polite"}
                tabIndex={status === "error" ? -1 : undefined}
                className={`text-sm ${status === "error" ? "text-red-400" : "text-accent"}`}
              >
                {status === "submitting" ? "Sending your message…" : ""}
                {status === "error" ? errorMessage : ""}
              </p>
            </form>
            )}
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
