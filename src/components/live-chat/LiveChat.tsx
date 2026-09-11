"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import LiveChatLauncher from "./LiveChatLauncher";
import LiveChatPanel from "./LiveChatPanel";
import ResumeDownloadModal from "@/components/resume/ResumeDownloadModal";
import { useLiveChatSocket } from "./useLiveChatSocket";
import type { ChatAction, PanelState } from "./types";

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

export default function LiveChat() {
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [unreadCount, setUnreadCount] = useState(0);
  const [resumeOpen, setResumeOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const seenMessageCount = useRef(0);

  const { connectionState, messages, typing, sendMessage } = useLiveChatSocket();

  useEffect(() => {
    if (panelState === "open") {
      seenMessageCount.current = messages.length;
      setUnreadCount(0);
      return;
    }
    if (messages.length > seenMessageCount.current) {
      const newAssistantMessages = messages
        .slice(seenMessageCount.current)
        .filter((message) => message.role === "assistant").length;
      if (newAssistantMessages > 0) {
        setUnreadCount((count) => count + newAssistantMessages);
      }
      seenMessageCount.current = messages.length;
    }
  }, [messages, panelState]);

  useEffect(() => {
    if (panelState !== "open") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelState("minimised");
        launcherButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [panelState]);

  const handleToggle = useCallback(() => {
    setPanelState((current) => (current === "open" ? "minimised" : "open"));
  }, []);

  const handleMinimise = useCallback(() => {
    setPanelState("minimised");
    launcherButtonRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    // Conversation history is preserved (see useLiveChatSocket's session storage
    // persistence) even though the panel is fully dismissed.
    setPanelState("closed");
    launcherButtonRef.current?.focus();
  }, []);

  const handleAction = useCallback((action: ChatAction) => {
    if (action.href === "#resume-modal") {
      setResumeOpen(true);
      return;
    }
    if (action.external || action.href.startsWith("http") || action.href.startsWith("mailto:")) {
      window.open(action.href, action.href.startsWith("mailto:") ? "_self" : "_blank", "noopener,noreferrer");
      return;
    }
    if (action.href.startsWith("#")) {
      setPanelState("minimised");
      scrollToSection(action.href.slice(1));
    }
  }, []);

  return (
    <>
      <LiveChatLauncher
        ref={launcherButtonRef}
        panelState={panelState}
        connectionState={connectionState}
        unreadCount={unreadCount}
        onToggle={handleToggle}
      />

      <AnimatePresence>
        {panelState === "open" ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <LiveChatPanel
              messages={messages}
              typing={typing}
              connectionState={connectionState}
              onSend={sendMessage}
              onAction={handleAction}
              onMinimise={handleMinimise}
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
