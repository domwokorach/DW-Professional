"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, CheckCheck, Clock, Minus, Paperclip, Send, X } from "lucide-react";
import type { ChatAction, ChatMessage, ConnectionState } from "@/types/chat";
import type { AdminPresenceState } from "@/types/socket";
import TypingIndicator from "@/components/chat/TypingIndicator";
import MessageAttachment from "@/components/chat/MessageAttachment";
import PendingAttachment from "@/components/chat/PendingAttachment";
import ConfirmDialog from "@/components/chat/ConfirmDialog";
import PresenceBanner from "./PresenceBanner";
import PostChatPanel from "./PostChatPanel";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { useChatAttachmentUpload } from "@/hooks/use-chat-attachment-upload";
import { getVisitorId } from "@/lib/chat/visitor-id";
import { CHAT_ATTACHMENT_ACCEPT, validateChatAttachmentMeta } from "@/lib/chat/attachments";
import { PANEL_BOTTOM_CSS, PANEL_RIGHT_CSS } from "./layout";

const STATUS_LABEL: Record<ConnectionState, string> = {
  online: "Online",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  offline: "Offline",
  unauthorized: "Connection error",
  "auth-failed": "Unable to authenticate chat",
};

const STATUS_DOT_CLASS: Record<ConnectionState, string> = {
  online: "bg-emerald-400",
  connecting: "bg-amber-400",
  reconnecting: "bg-amber-400",
  offline: "bg-red-400",
  unauthorized: "bg-red-400",
  "auth-failed": "bg-red-400",
};

function formatTimestamp(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

const DRAFT_STORAGE_PREFIX = "live-chat-draft:";
const NEAR_BOTTOM_THRESHOLD_PX = 80;

const MESSAGE_STATUS_ICON = {
  sending: Clock,
  failed: AlertCircle,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
} as const;

export default function LiveChatPanel({
  messages,
  typing,
  connectionState,
  adminStatus,
  conversationStatus,
  pendingMessageIds,
  conversationId,
  onSend,
  onTyping,
  onAction,
  onMinimise,
  onClose,
  onEndChat,
  closeButtonRef,
}: {
  messages: ChatMessage[];
  typing: boolean;
  connectionState: ConnectionState;
  adminStatus: AdminPresenceState;
  conversationStatus: "open" | "closed";
  pendingMessageIds: Set<string>;
  conversationId: string | null;
  onSend: (text: string) => void;
  onTyping: () => void;
  onAction: (action: ChatAction) => void;
  onMinimise: () => void;
  onClose: () => void;
  onEndChat: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasNearBottomRef = useRef(true);
  const reduceMotion = useReducedMotion();
  const keyboardInset = useKeyboardInset();
  const draftKey = conversationId ? `${DRAFT_STORAGE_PREFIX}${conversationId}` : null;

  // Restore an in-progress draft (e.g. after a disconnect/reload) once the
  // conversation id is known.
  useEffect(() => {
    if (!draftKey) return;
    setInput(window.sessionStorage.getItem(draftKey) ?? "");
  }, [draftKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      wasNearBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Preserve scroll position when older/unrelated content changes; only
    // snap to the newest message if the reader was already at (or near) the
    // bottom, so scrolling up to read history is never yanked back down.
    if (wasNearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const isClosed = conversationStatus === "closed";
  const [endChatConfirmOpen, setEndChatConfirmOpen] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useChatAttachmentUpload({
    conversationId: conversationId ?? "",
    visitorId: getVisitorId(),
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationError = validateChatAttachmentMeta(file);
    if (validationError) {
      setAttachmentError(validationError);
      return;
    }
    setAttachmentError(null);
    setPendingFile(file);
  };

  const handleSend = async () => {
    if (isClosed || !conversationId) return;
    const trimmed = input.trim();

    if (pendingFile) {
      const file = pendingFile;
      setInput("");
      if (draftKey) window.sessionStorage.removeItem(draftKey);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      const result = await upload.send(file, trimmed);
      if (result) setPendingFile(null);
      else { setInput(trimmed); }
      return;
    }

    if (!trimmed) return;
    onSend(input);
    setInput("");
    if (draftKey) window.sessionStorage.removeItem(draftKey);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia("(pointer: coarse)").matches) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      id="live-chat-panel"
      role="dialog"
      aria-modal="false"
      aria-label="Live chat with Dominic's assistant"
      className="fixed z-[100] flex max-h-[min(70dvh,calc(100dvh-32px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl md:w-[380px] md:max-w-[380px]"
      style={{ bottom: `calc(${PANEL_BOTTOM_CSS} + ${keyboardInset}px)`, right: PANEL_RIGHT_CSS }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="font-mono text-sm font-semibold text-paper">Live Chat</p>
          <p
            className="mt-1 flex items-center gap-1.5 text-xs text-muted"
            role="status"
            aria-live="polite"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[connectionState]}`}
              aria-hidden="true"
            />
            {STATUS_LABEL[connectionState]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isClosed && conversationId ? (
            <button
              type="button"
              onClick={() => setEndChatConfirmOpen(true)}
              className="mr-1 rounded-full px-2 py-1 text-xs font-medium text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              End chat
            </button>
          ) : null}
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Minimise live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close live chat"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <PresenceBanner adminStatus={adminStatus} />

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => {
          const isPending = pendingMessageIds.has(message.id);
          const statusKey = message.localStatus ?? (isPending ? "sending" : message.status);
          const StatusIcon = message.sender === "visitor" ? MESSAGE_STATUS_ICON[statusKey] : null;

          return (
            <motion.div
              key={message.id}
              initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`flex flex-col gap-1 ${
                message.sender === "visitor" ? "items-end" : "items-start"
              }`}
            >
              {message.content || message.deleted ? (
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                    message.deleted
                      ? "border border-dashed border-line text-muted italic"
                      : message.sender === "visitor"
                        ? "bg-accent text-ink"
                        : "border border-line bg-ink text-paper"
                  }`}
                >
                  {message.deleted ? "Message deleted" : message.content}
                </div>
              ) : null}
              {!message.deleted && message.attachments?.length
                ? message.attachments.map((attachment) => (
                    <MessageAttachment key={attachment.id} attachment={attachment} />
                  ))
                : null}
              <span className="flex items-center gap-1 px-1 text-[11px] text-muted">
                {formatTimestamp(message.createdAt)}
                {statusKey === "sending" ? <span>Sending…</span> : null}
                {message.localStatus === "failed" ? (
                  <span role="alert" className="text-red-400">
                    Failed — Retry in the notification
                  </span>
                ) : null}
                {StatusIcon ? (
                  <StatusIcon
                    className={`h-3 w-3 ${statusKey === "read" ? "text-accent" : ""} ${statusKey === "failed" ? "text-red-400" : ""}`}
                    aria-label={statusKey}
                  />
                ) : null}
              </span>
              {message.actions?.length ? (
                <div className="flex flex-wrap gap-2">
                  {message.actions.map((action) => (
                    <button
                      key={action.href + action.label}
                      type="button"
                      onClick={() => onAction(action)}
                      className="rounded-full border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </motion.div>
          );
        })}

        {typing ? <TypingIndicator label="Dominic is typing…" /> : null}
      </div>

      {isClosed && conversationId ? (
        <PostChatPanel conversationId={conversationId} visitorId={getVisitorId()} />
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 border-t border-line px-3 py-3">
        {isClosed ? (
          <p className="px-1 text-xs text-muted" role="status" aria-live="polite">
            This conversation has been closed.
          </p>
        ) : connectionState !== "online" ? (
          <p className="px-1 text-xs text-amber-400" role="status" aria-live="polite">
            Reconnecting… your messages will send once you&rsquo;re back online.
          </p>
        ) : null}
        {pendingFile ? (
          <PendingAttachment
            file={pendingFile}
            uploading={upload.uploading}
            progress={upload.progress}
            onRemove={() => setPendingFile(null)}
          />
        ) : null}
        {(attachmentError || upload.error) ? (
          <p className="px-1 text-xs text-red-400" role="alert">
            {attachmentError || upload.error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <label htmlFor="live-chat-input" className="sr-only">
            Type a message
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={CHAT_ATTACHMENT_ACCEPT}
            onChange={handleFileSelect}
            className="sr-only"
            aria-label="Attach a file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isClosed || Boolean(pendingFile)}
            aria-label="Attach a file"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
          </button>
          <textarea
            ref={textareaRef}
            id="live-chat-input"
            value={input}
            disabled={isClosed}
            onChange={(event) => {
              setInput(event.target.value);
              onTyping();
              if (draftKey) window.sessionStorage.setItem(draftKey, event.target.value);
              const el = event.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={isClosed ? "This conversation has ended." : "Type a message…"}
            rows={1}
            maxLength={2000}
            className="min-h-11 max-h-24 w-full min-w-0 flex-1 resize-none rounded-2xl border border-line bg-ink px-4 py-2.5 text-sm leading-normal text-paper placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !pendingFile) || isClosed || upload.uploading}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink transition-opacity duration-150 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
      )}

      <ConfirmDialog
        open={endChatConfirmOpen}
        onOpenChange={setEndChatConfirmOpen}
        title="End this conversation?"
        description="Your conversation will be saved. You can still download a transcript afterwards."
        confirmLabel="End chat"
        onConfirm={() => {
          setEndChatConfirmOpen(false);
          onEndChat();
        }}
      />
    </div>
  );
}
