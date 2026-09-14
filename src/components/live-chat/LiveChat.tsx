"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CandidateRegistration from "./CandidateRegistration";
import LiveChatLauncher from "./LiveChatLauncher";
import LiveChatPanel from "./LiveChatPanel";
import ResumeDownloadModal from "@/components/resume/ResumeDownloadModal";
import { useLiveChat } from "@/hooks/use-live-chat";
import { WELCOME_MESSAGE } from "@/lib/chat/constants";
import type { ChatAction, ChatMessage, PanelState } from "@/types/chat";

const WELCOME_BUBBLE: ChatMessage = {
  id: "welcome",
  conversationId: "",
  sender: "bot",
  content: WELCOME_MESSAGE,
  status: "sent",
  createdAt: new Date(0).toISOString(),
};

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
  const [attention, setAttention] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const launcherButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const seenMessageCount = useRef(0);

  const {
    connectionState,
    adminStatus,
    adminJoined,
    conversationStatus,
    pendingMessageIds,
    messages,
    typing,
    sendMessage,
    conversationId,
    hasIdentity,
    registering,
    registrationError,
    registerCandidate,
  } = useLiveChat();

  // The socket only connects once the candidate has registered, so the
  // launcher's status dot would otherwise sit on "connecting" indefinitely
  // while the registration form is showing.
  const launcherConnectionState = hasIdentity ? connectionState : "offline";

  const displayMessages = useMemo(
    () => (messages.length > 0 ? messages : [WELCOME_BUBBLE]),
    [messages]
  );

  useEffect(() => {
    if (panelState === "open") {
      seenMessageCount.current = messages.length;
      setUnreadCount(0);
      return;
    }
    if (messages.length > seenMessageCount.current) {
      const newAssistantMessages = messages
        .slice(seenMessageCount.current)
        .filter((message) => message.sender !== "visitor").length;
      if (newAssistantMessages > 0) {
        setUnreadCount((count) => count + newAssistantMessages);
        setAttention(true);
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
    setAttention(false);
  }, []);

  const handleMinimise = useCallback(() => {
    setPanelState("minimised");
    launcherButtonRef.current?.focus();
  }, []);

  const handleClose = useCallback(() => {
    // Conversation history is preserved server-side (see useLiveChat's
    // conversationId bootstrap) even though the panel is fully dismissed.
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
        connectionState={launcherConnectionState}
        unreadCount={unreadCount}
        attention={attention}
        onToggle={handleToggle}
      />

      <AnimatePresence>
        {panelState === "open" ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {hasIdentity ? (
              <LiveChatPanel
                messages={displayMessages}
                typing={typing}
                connectionState={connectionState}
                adminStatus={adminStatus}
                adminJoined={adminJoined}
                conversationStatus={conversationStatus}
                pendingMessageIds={pendingMessageIds}
                conversationId={conversationId}
                onSend={sendMessage}
                onAction={handleAction}
                onMinimise={handleMinimise}
                onClose={handleClose}
                closeButtonRef={closeButtonRef}
              />
            ) : (
              <CandidateRegistration
                onSubmit={registerCandidate}
                submitting={registering}
                submitError={registrationError}
                onMinimise={handleMinimise}
                onClose={handleClose}
                closeButtonRef={closeButtonRef}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ResumeDownloadModal open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </>
  );
}
