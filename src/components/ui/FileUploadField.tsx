"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { upload } from "@vercel/blob/client";
import { AlertCircle, CheckCircle2, FileText, RotateCcw, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_ACCEPT,
  buildAttachmentPathname,
  formatFileSize,
  resolveAttachmentContentType,
  validateAttachmentMeta,
} from "@/lib/contact/attachments";
import { Progress, ProgressIndicator, ProgressTrack, ProgressValue } from "@/components/ui/motion/progress";

export interface UploadedAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

export type AttachmentUploadStatus = "idle" | "uploading" | "success" | "error";

export interface FileUploadFieldProps {
  id: string;
  label: string;
  status: AttachmentUploadStatus;
  onStatusChange: (status: AttachmentUploadStatus) => void;
  attachment: UploadedAttachment | null;
  onAttachmentChange: (attachment: UploadedAttachment | null) => void;
  /** Server-side validation error surfaced after a failed submit (e.g. a stale/expired blob reference). */
  serverError?: string;
  helperId?: string;
}

/** Shown when the browser-to-Blob upload fails. The file is optional, so the visitor is told they can still send the form without it. */
export const UPLOAD_FAILED_MESSAGE = "We couldn't upload your file. Please try again, or remove it and send the form without it.";

const UPLOAD_OFFLINE_MESSAGE = "You appear to be offline. Check your connection and try again, or remove the file and send the form without it.";
const UPLOAD_START_FAILED_MESSAGE = "We couldn't start the upload. Please wait a moment and try again, or remove the file and send the form without it.";

/**
 * Maps an upload() rejection to a message that's safe to show a visitor —
 * the raw error (which may mention tokens or store internals) only goes to
 * the console.
 */
function describeUploadError(err: unknown): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return UPLOAD_OFFLINE_MESSAGE;
  // Thrown by @vercel/blob/client when /api/contact/upload refuses to issue
  // a token (rate limit, invalid path, server misconfiguration).
  if (err instanceof Error && /retrieve the client token/i.test(err.message)) return UPLOAD_START_FAILED_MESSAGE;
  return UPLOAD_FAILED_MESSAGE;
}

/** Fire-and-forget delete of a temp blob — used for cancel/remove/replace, never blocks the UI on its result. */
function deleteBlob(url: string) {
  fetch("/api/contact/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Optional single-file picker for the contact form's project brief upload.
 * Unlike a plain `<input type="file">` bundled into the form submission,
 * the file is uploaded straight to Blob storage from the browser the
 * moment it's selected (see /api/contact/upload), with real byte-level
 * progress reported by the underlying XHR — nothing here is simulated with
 * a timer. Once the upload is confirmed by the server, the resulting blob
 * reference is exposed via hidden inputs so a normal form submit (or `new
 * FormData(form)`) picks it up without re-uploading the bytes.
 */
export default function FileUploadField({
  id,
  label,
  status,
  onStatusChange,
  attachment,
  onAttachmentChange,
  serverError,
  helperId,
}: FileUploadFieldProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const liveRegionRef = useRef<HTMLParagraphElement>(null);
  const attachmentRef = useRef(attachment);
  attachmentRef.current = attachment;
  const errorId = `${id}-error`;
  const error = localError || serverError;
  const describedBy = [helperId, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  // Best-effort cleanup for an in-flight or unclaimed upload if the field
  // unmounts (e.g. the whole form is torn down) before the user submits or
  // removes it — anything this misses is swept up by the daily cleanup cron.
  // Reads attachmentRef (kept current above) rather than the `attachment`
  // prop directly, since this effect only runs once and its closure would
  // otherwise see the value from mount time.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (attachmentRef.current) deleteBlob(attachmentRef.current.url);
    };
  }, []);

  function announce(text: string) {
    if (liveRegionRef.current) liveRegionRef.current.textContent = text;
  }

  async function startUpload(file: File, previousAttachment: UploadedAttachment | null) {
    abortRef.current?.abort(); // supersede any upload still in flight
    if (previousAttachment) deleteBlob(previousAttachment.url);

    const controller = new AbortController();
    abortRef.current = controller;

    setSelectedFile(file);
    setProgress(0);
    setLocalError(null);
    onAttachmentChange(null);
    onStatusChange("uploading");
    announce(`Uploading ${file.name}.`);

    // Browsers can report an empty or non-canonical type; the Blob token only
    // allows the canonical MIME types, so derive it from the extension.
    const contentType = resolveAttachmentContentType(file);

    try {
      const pathname = buildAttachmentPathname(file.name);
      const blob = await upload(pathname, file, {
        access: "public",
        contentType,
        handleUploadUrl: "/api/contact/upload",
        abortSignal: controller.signal,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      if (abortRef.current !== controller) return; // superseded by a newer upload

      setProgress(100);
      onStatusChange("success");
      onAttachmentChange({ url: blob.url, name: file.name, size: file.size, type: contentType });
      announce("Upload complete.");
    } catch (err) {
      if (abortRef.current !== controller) return; // superseded, ignore this failure
      // A cancel can surface as a DOMException (during the token request) or
      // as @vercel/blob's BlobRequestAbortedError (during the byte upload),
      // so check our own signal rather than the error's shape.
      if (controller.signal.aborted) {
        setSelectedFile(null);
        setProgress(0);
        onStatusChange("idle");
        return;
      }
      // Logged so a server-side cause (e.g. a rejected Blob token) is visible in the console.
      console.error("[FileUploadField] upload failed:", err);
      const message = describeUploadError(err);
      setLocalError(message);
      onStatusChange("error");
      announce(message);
    }
  }

  function applyFile(next: File | null) {
    if (!next) return;
    const validationError = validateAttachmentMeta(next);
    if (validationError) {
      if (inputRef.current) inputRef.current.value = "";
      setLocalError(validationError);
      // Only downgrade the field's status if there's nothing good to lose —
      // a rejected replacement shouldn't erase an already-successful upload.
      if (!attachment) onStatusChange("error");
      return;
    }
    setLocalError(null);
    void startUpload(next, attachment);
  }

  function handleInputChange() {
    const input = inputRef.current;
    const next = input?.files?.[0] ?? null;
    // The input carries no form name — the confirmed blob reference is what
    // gets submitted — so clear it to let the same file be picked again
    // (e.g. after a failed upload) and still fire a change event.
    if (input) input.value = "";
    applyFile(next);
  }

  function handleRetry() {
    if (selectedFile) void startUpload(selectedFile, null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (status === "uploading") return;
    const next = event.dataTransfer.files?.[0];
    if (!next) return;
    applyFile(next);
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  function handleRemove() {
    if (inputRef.current) inputRef.current.value = "";
    if (attachment) deleteBlob(attachment.url);
    setSelectedFile(null);
    setProgress(0);
    setLocalError(null);
    onAttachmentChange(null);
    onStatusChange("idle");
  }

  const progressClassName =
    status === "success" ? "bg-emerald-500" : status === "error" ? "bg-red-400" : "bg-accent";
  const trackClassName = status === "error" ? "bg-red-400/10" : "bg-ink";

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label} <span className="text-xs">(optional)</span>
      </label>

      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          if (status !== "uploading") setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 text-center transition-colors",
          "hover:border-accent/60 focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          isDragActive && "border-accent bg-accent/5",
          error && "border-red-400/60"
        )}
      >
        <UploadCloud className="h-5 w-5 text-muted" aria-hidden="true" />
        <span className="text-sm text-muted">
          <span className="font-medium text-paper">Click to upload</span> or drag and drop
        </span>
        <span className="text-xs text-muted/70">PDF, DOCX, PNG, JPG or JPEG — up to 5 MB</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          onChange={handleInputChange}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className="sr-only"
        />
      </label>

      {/* The main submission form reads the confirmed blob reference from
          these — nothing is uploaded through the form submit itself. */}
      {attachment && status === "success" && (
        <>
          <input type="hidden" name="attachmentUrl" value={attachment.url} />
          <input type="hidden" name="attachmentName" value={attachment.name} />
          <input type="hidden" name="attachmentType" value={attachment.type} />
          <input type="hidden" name="attachmentSize" value={String(attachment.size)} />
        </>
      )}

      {selectedFile && (status === "uploading" || status === "success" || status === "error") && (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-line bg-paper/[0.02] px-3.5 py-2.5">
          {status === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          ) : status === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-paper">{selectedFile.name}</p>
            <p className="text-xs text-muted">
              {selectedFile.type || "Unknown type"} &middot; {formatFileSize(selectedFile.size)}
            </p>

            {status === "uploading" && (
              <Progress value={progress} className="mt-2 flex-nowrap gap-2">
                <ProgressTrack className={trackClassName}>
                  <ProgressIndicator className={progressClassName} transition={{ duration: 0.15 }} />
                </ProgressTrack>
                <ProgressValue>{() => `${progress}%`}</ProgressValue>
              </Progress>
            )}

            {status === "success" && (
              <p className="mt-1.5 text-xs font-medium text-emerald-500">Upload complete</p>
            )}

            {status === "error" && (
              <>
                <p id={errorId} className="mt-1.5 text-xs font-medium text-red-400">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-paper transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retry upload
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={status === "uploading" ? handleCancel : handleRemove}
            aria-label={status === "uploading" ? `Cancel upload of ${selectedFile.name}` : `Remove ${selectedFile.name}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <p ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      {/* The upload-failure case already shows its message inside the file
          card above — only surface this one when there's no card to carry it. */}
      {error && !(selectedFile && status === "error") && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
