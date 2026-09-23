import { CHAT_ATTACHMENT_BLOB_PREFIX } from "./attachments";

/** Only this Blob store and this conversation; never fetch arbitrary client URLs. */
export function isConversationAttachmentUrl(raw: string, conversationId: string): boolean {
  const storeId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([^_]+)_/)?.[1];
  if (!storeId || !/^[a-zA-Z0-9-]+$/.test(conversationId)) return false;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.search && !url.hash &&
      url.hostname === `${storeId.toLowerCase()}.public.blob.vercel-storage.com` &&
      new RegExp(`^/${CHAT_ATTACHMENT_BLOB_PREFIX}${conversationId}/[a-f0-9-]{36}\\.(pdf|doc|docx|png|jpg|jpeg|txt)$`).test(url.pathname);
  } catch { return false; }
}
