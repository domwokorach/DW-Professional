"use client";

import { useState, type FormEvent } from "react";
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
  "Other",
];

const inputClasses =
  "w-full rounded-lg border border-line bg-transparent px-4 py-3 text-white placeholder:text-muted/60 outline-none transition-colors focus:border-accent";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const subject = encodeURIComponent(
      `Project enquiry: ${data.get("projectType") || "General"}`
    );
    const body = encodeURIComponent(
      `Name: ${data.get("name")}\nCompany: ${data.get("company")}\nBudget: ${data.get(
        "budget"
      )}\n\n${data.get("message")}`
    );
    window.location.href = `mailto:${social.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  };

  return (
    <section id="contact" className="relative border-t border-line py-28 sm:py-36">
      <Container>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading index="06" label="Contact" heading="Have a project in mind?" />

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
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-muted">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className={inputClasses}
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-muted">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={inputClasses}
                    style={{ fontSize: "16px" }}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-2 block text-sm text-muted">
                    Company
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
                    Budget
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
                  Project Type
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
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className={inputClasses}
                  style={{ fontSize: "16px" }}
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Send Enquiry →
              </button>

              <p role="status" aria-live="polite" className="text-sm text-accent">
                {status === "sent" ? "Opening your email client…" : ""}
              </p>
            </form>
          </MotionReveal>
        </div>
      </Container>
    </section>
  );
}
