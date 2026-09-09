"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PortfolioChatLauncher from "./PortfolioChatLauncher";
import PortfolioChatPanel from "./PortfolioChatPanel";
import ResumeDownloadModal from "@/components/resume/ResumeDownloadModal";
import { getResponseForIntent } from "@/lib/portfolioAssistant/responses";
import { matchIntent } from "@/lib/portfolioAssistant/match";
import type { ChatAction, ChatMessage } from "@/lib/portfolioAssistant/types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi 👋 I'm Dominic's portfolio assistant. I can help you explore his experience, projects, skills, availability and contact information. What would you like to know?",
  timestamp: Date.now(),
};

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

export default function PortfolioChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    launcherButtonRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (text: string, overrideIntentId?: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const typingDelay = 400 + Math.random() * 300;

    try {
      let content: string;
      let actions: ChatAction[] | undefined;

      if (overrideIntentId) {
        const response = getResponseForIntent(overrideIntentId);
        content = response.content;
        actions = response.actions;
      } else {
        const res = await fetch("/api/portfolio-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });

        if (!res.ok) {
          const localIntentId = matchIntent(text);
          const response = getResponseForIntent(localIntentId);
          content = response.content;
          actions = response.actions;
        } else {
          const data = await res.json();
          content = data.content;
          actions = data.actions;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, typingDelay));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: Date.now(),
          actions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSuggestedQuestion = useCallback(
    (intentId: string, label: string) => {
      void sendMessage(label, intentId);
    },
    [sendMessage]
  );

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (action.href === "#resume-modal") {
        setResumeOpen(true);
        return;
      }
      if (action.external || action.href.startsWith("http") || action.href.startsWith("mailto:")) {
        window.open(action.href, action.href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
        return;
      }
      if (action.href.startsWith("#")) {
        setOpen(false);
        scrollToSection(action.href.slice(1));
      }
    },
    []
  );

  return (
    <>
      <PortfolioChatLauncher
        ref={launcherButtonRef}
        open={open}
        onToggle={() => setOpen((o) => !o)}
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <PortfolioChatPanel
              messages={messages}
              loading={loading}
              input={input}
              onInputChange={setInput}
              onSend={(text) => void sendMessage(text)}
              onSuggestedQuestion={handleSuggestedQuestion}
              onAction={handleAction}
              onClose={handleClose}
              closeButtonRef={closeButtonRef}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ResumeDownloadModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </>
  );
}
