"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { formatFileSize } from "@/lib/chat/attachments";

/** Filename + size + remove/progress, shown in the composer before the message is actually sent. */
export default function PendingAttachment({
  file,
  uploading,
  progress,
  onRemove,
}: {
  file: File;
  uploading: boolean;
  progress: number;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-ink/40 px-3 py-2 text-xs">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- transient local object URL, not an optimizable asset
        <img src={previewUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" aria-hidden="true" />
      ) : (
        <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-paper">{file.name}</span>
        <span className="block text-muted">
          {uploading ? `Uploading… ${progress}%` : formatFileSize(file.size)}
        </span>
      </span>
      {!uploading ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
