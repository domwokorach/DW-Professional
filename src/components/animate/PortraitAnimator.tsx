"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Paperclip, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PORTRAIT_ACCEPT, validatePortraitMeta } from "@/lib/animate/image";

type Status = "idle" | "uploading" | "polling" | "done" | "error";

const POLL_INTERVAL_MS = 4000;
const TERMINAL_STATUSES = new Set(["SUCCEEDED", "FAILED"]);

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortraitAnimator() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const inputId = useId();
  const helperId = useId();
  const errorId = useId();

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  function applyFile(next: File | null) {
    setFile(next);
    setStatus("idle");
    setVideoUrl(null);
    setErrorMessage("");

    if (!next) {
      setFileError(null);
      return;
    }
    const validationError = validatePortraitMeta(next);
    if (validationError) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setFileError(validationError);
      return;
    }
    setFileError(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    applyFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const next = event.dataTransfer.files?.[0];
    if (!next) return;
    applyFile(next);
  }

  function handleRemove() {
    if (inputRef.current) inputRef.current.value = "";
    applyFile(null);
  }

  async function pollStatus(taskId: string) {
    try {
      const response = await fetch(`/api/animate/status/${taskId}`);
      const body = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(body?.error?.message ?? "Couldn't check the animation status.");
        return;
      }

      if (body.status === "SUCCEEDED") {
        setVideoUrl(body.videoUrl);
        setStatus("done");
        return;
      }

      if (body.status === "FAILED") {
        setStatus("error");
        setErrorMessage(body.error ?? "The animation failed to generate.");
        return;
      }

      if (!TERMINAL_STATUSES.has(body.status)) {
        pollTimeoutRef.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL_MS);
      }
    } catch {
      setStatus("error");
      setErrorMessage("Lost connection while checking the animation status.");
    }
  }

  async function handleSubmit() {
    if (!file) {
      setFileError("Please attach a photo.");
      return;
    }

    setStatus("uploading");
    setErrorMessage("");
    setVideoUrl(null);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/animate", { method: "POST", body: formData });
      const body = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(body?.error?.message ?? "Couldn't start the animation.");
        return;
      }

      setStatus("polling");
      pollTimeoutRef.current = setTimeout(() => pollStatus(body.taskId), POLL_INTERVAL_MS);
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong while uploading your photo.");
    }
  }

  const isBusy = status === "uploading" || status === "polling";
  const describedBy = [helperId, fileError ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <label htmlFor={inputId} className="mb-2 block text-sm text-muted">
          Upload a portrait photo
        </label>

        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 text-center transition-colors",
            "hover:border-accent/60 focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
            isDragActive && "border-accent bg-accent/5",
            fileError && "border-red-400/60"
          )}
        >
          <UploadCloud className="h-5 w-5 text-muted" aria-hidden="true" />
          <span className="text-sm text-muted">
            <span className="font-medium text-white">Click to upload</span> or drag and drop
          </span>
          <span className="text-xs text-muted/70">PNG, JPG or JPEG — up to 5 MB</span>
          <input
            ref={inputRef}
            id={inputId}
            name="photo"
            type="file"
            accept={PORTRAIT_ACCEPT}
            onChange={handleInputChange}
            aria-describedby={describedBy}
            aria-invalid={Boolean(fileError)}
            className="sr-only"
          />
        </label>

        {file && (
          <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-line bg-white/[0.02] px-3.5 py-2.5">
            <Paperclip className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${file.name}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {fileError && (
          <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
            {fileError}
          </p>
        )}
      </div>

      <p id={helperId} className="text-sm text-muted">
        Only the person will move — the background stays static.
      </p>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isBusy || !file}
        className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-accent-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "uploading" && "Uploading…"}
        {status === "polling" && "Animating… this can take a minute or two"}
        {(status === "idle" || status === "done" || status === "error") && "Animate portrait"}
      </button>

      {status === "error" && (
        <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      {status === "done" && videoUrl && (
        <div className="space-y-3">
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-lg border border-line"
          />
          <a href={videoUrl} download className="inline-block text-sm text-accent underline underline-offset-4">
            Download video
          </a>
        </div>
      )}
    </div>
  );
}
