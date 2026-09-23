"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  CHAT_ATTACHMENT_MAX_BYTES,
  validateChatAttachmentMeta,
} from "@/lib/chat/attachments";
import type { ChatMessage } from "@/types/message";

interface UploadTarget {
  conversationId: string;
  /** Present for candidate sends, omitted for admin (authenticated by session cookie instead). */
  visitorId?: string;
}

/**
 * Drives a single attachment through: client-side validation → direct
 * client upload to Blob storage (real byte-level progress, never proxied
 * through this server — see src/app/api/chat/attachments/route.ts) →
 * server-side re-verification + message creation (see .../complete/route.ts).
 * The resulting message reaches this sender's own UI via the normal
 * Socket.IO broadcast, same as everyone else in the room — this hook only
 * owns the upload's lifecycle, not the message list.
 */
export function useChatAttachmentUpload(target: UploadTarget) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (file: File, caption: string): Promise<ChatMessage | null> => {
      const validationError = validateChatAttachmentMeta(file);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const blob = await upload(`chat-uploads/${crypto.randomUUID()}-${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/chat/attachments",
          clientPayload: JSON.stringify(target),
          onUploadProgress: ({ percentage }) => setProgress(percentage),
        });

        const res = await fetch("/api/chat/attachments/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...target,
            url: blob.url,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            content: caption,
          }),
        });

        if (!res.ok) {
          const { error: message } = (await res.json().catch(() => ({}))) as { error?: string };
          setError(message || "Upload failed.");
          return null;
        }

        const { message } = (await res.json()) as { message: ChatMessage };
        return message;
      } catch {
        setError("Upload failed.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [target]
  );

  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
  }, []);

  return { send, uploading, progress, error, reset, maxBytes: CHAT_ATTACHMENT_MAX_BYTES };
}
