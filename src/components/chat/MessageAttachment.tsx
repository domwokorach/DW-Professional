import { FileText, Download } from "lucide-react";
import { formatFileSize } from "@/lib/chat/attachments";
import type { MessageAttachment as MessageAttachmentType } from "@/types/message";

/** Renders an already-sent attachment: an inline preview for images, a downloadable file chip otherwise. */
export default function MessageAttachment({ attachment }: { attachment: MessageAttachmentType }) {
  const isImage = attachment.mimeType.startsWith("image/");

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl border border-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote blob-store URL, not an optimizable local asset */}
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="max-h-48 w-full max-w-[240px] object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.originalName}
      className="flex max-w-[240px] items-center gap-2 rounded-xl border border-line bg-ink/40 px-3 py-2 text-xs transition-colors duration-150 hover:bg-ink/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-paper">{attachment.originalName}</span>
        <span className="block text-muted">{formatFileSize(attachment.size)}</span>
      </span>
      <Download className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
    </a>
  );
}
