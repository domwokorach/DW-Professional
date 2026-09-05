"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionReveal from "@/components/ui/MotionReveal";
import Container from "@/components/ui/Container";
import { social } from "@/data/navigation";

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

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === "submitting" || status === "sent") return;

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    const nextFieldErrors: Record<string, string> = {};
    if (!name) nextFieldErrors.name = "Enter your name.";
    if (!email) nextFieldErrors.email = "Enter your email address.";
    if (!message) nextFieldErrors.message = "Enter a message.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setStatus("error");
      setErrorMessage("Please correct the required fields below.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          company: String(data.get("company") || ""),
          budget: String(data.get("budget") || ""),
          projectType: String(data.get("projectType") || ""),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to send your message");
      }

      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  return (
    <section id="contact" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading index="07" label="Contact" heading="Have a project in mind?" />

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
                href={`mailto:${social.email}`}
                className="block text-white hover:text-accent transition-colors"
              >
                {social.email}
              </a>
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

          <MotionReveal delay={0.1}>
            {status === "sent" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-[200px] items-center justify-center rounded-lg border border-line px-6 py-16 text-center"
              >
                <p className="text-2xl font-medium text-white">Thank you</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-muted">
                    Name <span aria-hidden="true">(required)</span>
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
                    <p id="name-error" className="mt-2 text-sm text-red-300">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-muted">
                    Email <span aria-hidden="true">(required)</span>
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
                    <p id="email-error" className="mt-2 text-sm text-red-300">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm text-muted">
                    Company <span className="text-xs">(optional)</span>
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    className={inputClasses}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div>
                  <label htmlFor="budget" className="mb-2 block text-sm text-muted">
                    Budget <span className="text-xs">(optional)</span>
                  </label>
                  <input
                    id="budget"
                    name="budget"
                    type="text"
                    className={inputClasses}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="projectType" className="mb-2 block text-sm text-muted">
                  Project Type <span className="text-xs">(optional)</span>
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

              <div>
                <label htmlFor="message" className="mb-2 block text-sm text-muted">
                  Message <span aria-hidden="true">(required)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className={inputClasses}
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? "message-error" : undefined}
                  style={{ fontSize: "16px" }}
                />
                {fieldErrors.message && (
                  <p id="message-error" className="mt-2 text-sm text-red-300">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Send Enquiry →"}
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
