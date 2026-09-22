"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import GradientText from "@/components/ui/GradientText";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import GlyphMatrixBackground from "@/components/magicui/glyph-matrix-background";
import FileUploadField from "@/components/ui/FileUploadField";
import BudgetInput from "@/components/ui/BudgetInput";
import CompanySearchField from "@/components/companies/CompanySearchField";
import { social } from "@/data/navigation";
import { MESSAGE_MAX_WORDS, clampToWordLimit, countWords } from "@/lib/contact/words";
import type { BudgetCurrency } from "@/lib/contact/validation";
import type { CompanySearchResult } from "@/types/company";

const projectTypes = [
  "Frontend Development",
  "Web Application",
  "UX/UI Development",
  "Software Engineering",
  "Accessibility",
  "Recruitment",
  "Hiring Manager",
  "Other",
];

const inputClasses =
  "w-full rounded-lg border border-line bg-transparent px-4 py-3 text-white placeholder:text-muted/60 outline-none transition-colors focus:border-accent";

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
  const [company, setCompany] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState<BudgetCurrency | "">("");
  const [budgetCurrencyOther, setBudgetCurrencyOther] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submittedAttachment, setSubmittedAttachment] = useState<SubmittedAttachment | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const messageHelpId = useId();
  const companyHelpId = useId();

  const wordCount = useMemo(() => countWords(message), [message]);
  const atWordLimit = wordCount >= MESSAGE_MAX_WORDS;

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  function handleMessageChange(next: string) {
    setMessage(clampToWordLimit(next, MESSAGE_MAX_WORDS));
  }

  function handleCompanySelect(selected: CompanySearchResult | null) {
    setCompanyNumber(selected?.companyNumber ?? "");
  }

  function handleFileChange(next: File | null) {
    setFile(next);
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

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const trimmedMessage = message.trim();

    const nextFieldErrors: Record<string, string> = {};
    if (!name) nextFieldErrors.name = "Enter your name.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) nextFieldErrors.email = "Enter your email address.";
    else if (!emailPattern.test(email)) nextFieldErrors.email = "Enter a valid email address.";
    if (!trimmedMessage) nextFieldErrors.message = "Enter a message.";
    else if (countWords(trimmedMessage) > MESSAGE_MAX_WORDS) {
      nextFieldErrors.message = `Keep your message under ${MESSAGE_MAX_WORDS.toLocaleString()} words.`;
    }
    if (fileError) nextFieldErrors.attachment = fileError;
    if (budgetAmount && !budgetCurrency) {
      nextFieldErrors.budgetCurrency = "Choose a currency for your budget.";
    }
    if (budgetCurrency === "OTHER" && !budgetCurrencyOther.trim()) {
      nextFieldErrors.budgetCurrencyOther = "Enter your currency (e.g. JPY, AUD).";
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
              <p className="text-lg font-medium text-white">
                Let&rsquo;s work together.
              </p>
            </MotionReveal>

            <MotionReveal delay={0.2} className="mt-10 space-y-3 text-sm">
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-white transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href={social.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted hover:text-white transition-colors"
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
                  className="text-2xl font-medium text-white"
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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm text-muted">
                    <GradientText>Company</GradientText>{" "}
                    <span className="text-xs">(optional)</span>
                  </label>
                  <CompanySearchField
                    id="company"
                    name="company"
                    value={company}
                    onChange={setCompany}
                    onSelect={handleCompanySelect}
                    inputClassName={inputClasses}
                    helperId={companyHelpId}
                  />
                  <input type="hidden" name="companyNumber" value={companyNumber} />
                  <p id={companyHelpId} className="mt-1.5 text-xs text-muted">
                    Start typing to search companies
                  </p>
                </div>
                <BudgetInput
                  amount={budgetAmount}
                  currency={budgetCurrency}
                  otherCurrency={budgetCurrencyOther}
                  onAmountChange={setBudgetAmount}
                  onCurrencyChange={setBudgetCurrency}
                  onOtherCurrencyChange={setBudgetCurrencyOther}
                  error={fieldErrors.budgetCurrency || fieldErrors.budgetCurrencyOther || fieldErrors.budgetAmount}
                />
              </div>

              <div>
                <label htmlFor="projectType" className="mb-2 block text-sm text-muted">
                  <GradientText>Project Type</GradientText>{" "}
                  <span className="text-xs">(optional)</span>
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  className={inputClasses}
                  style={{ fontSize: "16px" }}
                  defaultValue={projectTypes[0]}
                >
                  {projectTypes.map((type) => (
                    <option key={type} value={type} className="bg-ink">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <FileUploadField
                id="attachment"
                name="attachment"
                label="Project brief, screenshots or specs"
                file={file}
                onFileChange={handleFileChange}
                error={fileError || fieldErrors.attachment || undefined}
                onError={setFileError}
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
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  className={inputClasses}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={[messageHelpId, fieldErrors.message ? "message-error" : null]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ fontSize: "16px" }}
                />
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  {fieldErrors.message ? (
                    <p id="message-error" role="alert" className="text-sm text-red-300">
                      {fieldErrors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    id={messageHelpId}
                    aria-live="polite"
                    className={`shrink-0 text-xs ${atWordLimit ? "text-red-300" : "text-muted"}`}
                  >
                    {wordCount.toLocaleString()} / {MESSAGE_MAX_WORDS.toLocaleString()} words
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
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
