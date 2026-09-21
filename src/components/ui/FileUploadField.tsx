"use client";

import { useRef, useState, type DragEvent } from "react";
import { Paperclip, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_ACCEPT,
  formatFileSize,
  validateAttachmentMeta,
} from "@/lib/contact/attachments";

export interface FileUploadFieldProps {
  id: string;
  name: string;
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  onError: (message: string | null) => void;
  helperId?: string;
}

/**
 * Optional single-file picker for the contact form's project brief upload —
 * a real `<input type="file">` stays the source of truth (kept visually
 * hidden but focusable) so a native form submission or `new FormData(form)`
 * picks it up automatically, including files dropped via drag-and-drop
 * (synced onto the input through the DataTransfer trick below).
 */
export default function FileUploadField({
  id,
  name,
  label,
  file,
  onFileChange,
  error,
  onError,
  helperId,
}: FileUploadFieldProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;
  const describedBy = [helperId, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  function applyFile(next: File | null) {
    if (!next) {
      onFileChange(null);
      onError(null);
      return;
    }
    const validationError = validateAttachmentMeta(next);
    if (validationError) {
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
      onError(validationError);
      return;
    }
    onError(null);
    onFileChange(next);
  }

  function syncInputFiles(next: File) {
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    transfer.items.add(next);
    input.files = transfer.files;
  }

  function handleInputChange() {
    const next = inputRef.current?.files?.[0] ?? null;
    applyFile(next);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const next = event.dataTransfer.files?.[0];
    if (!next) return;
    syncInputFiles(next);
    applyFile(next);
  }

  function handleRemove() {
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
    onError(null);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label} <span className="text-xs">(optional)</span>
      </label>

      <label
        htmlFor={id}
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
          error && "border-red-400/60"
        )}
      >
        <UploadCloud className="h-5 w-5 text-muted" aria-hidden="true" />
        <span className="text-sm text-muted">
          <span className="font-medium text-white">Click to upload</span> or drag and drop
        </span>
        <span className="text-xs text-muted/70">PDF, DOCX, PNG, JPG or JPEG — up to 5 MB</span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          onChange={handleInputChange}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
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

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
