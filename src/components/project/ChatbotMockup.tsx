"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const categories = [
  "HR",
  "Payroll",
  "Annual Leave",
  "Working Hours",
  "Payslips",
  "Opportunities",
];

type Step = "user" | "thinking" | "assistant";

export default function ChatbotMockup() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(reduceMotion ? "assistant" : "user");

  useEffect(() => {
    if (reduceMotion) {
      setStep("assistant");
      return;
    }

    const t1 = window.setTimeout(() => setStep("thinking"), 700);
    const t2 = window.setTimeout(() => setStep("assistant"), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduceMotion]);

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-6 sm:p-7">
      <p className="text-xs font-mono uppercase tracking-widest text-muted">
        Example interaction — illustrative mock-up, not live data
      </p>

      <div className="mt-4 rounded-xl border border-line bg-ink/60 p-5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          <p className="text-sm font-medium text-white">Internal Assistant</p>
        </div>

        <p className="mt-3 text-sm text-muted">How can I help you today?</p>

        <div className="mt-5 space-y-4" aria-live="polite">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-white/10 px-4 py-2.5 text-sm text-white"
          >
            <span className="sr-only">You said: </span>
            Where can I find my payslip?
          </motion.div>

          {step === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex w-fit items-center gap-1.5 rounded-xl bg-white/[0.04] px-4 py-2.5"
              role="status"
              aria-label="Assistant is finding relevant information"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" aria-hidden />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:0.15s]" aria-hidden />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:0.3s]" aria-hidden />
            </motion.div>
          )}

          {step === "assistant" && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/[0.04] px-4 py-3 text-sm text-muted"
            >
              <span className="sr-only">Assistant replied: </span>
              I found information relating to payroll and payslips.
              <ul className="mt-3 space-y-1.5">
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-1.5 text-white underline decoration-line underline-offset-4 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                  >
                    <span aria-hidden>→</span> View Payroll Information
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center gap-1.5 text-white underline decoration-line underline-offset-4 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
                  >
                    <span aria-hidden>→</span> View Payslips
                  </a>
                </li>
              </ul>
            </motion.div>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-line bg-white/[0.02] px-4 py-2.5">
          <label htmlFor="mockup-question" className="sr-only">
            Ask a question (example only, not functional)
          </label>
          <input
            id="mockup-question"
            type="text"
            disabled
            placeholder="Ask another question..."
            className="w-full bg-transparent text-sm text-muted placeholder:text-muted focus:outline-none"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-mono uppercase tracking-widest text-muted">
          What can I help you find?
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li
              key={category}
              className="rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-sm text-neutral-300"
            >
              {category}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
