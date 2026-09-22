import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { apiError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { ATTACHMENT_BLOB_PREFIX, ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME_TYPES } from "@/lib/contact/attachments";

export const runtime = "nodejs";

/**
 * Token endpoint for the contact form's client-side attachment upload
 * (`upload()` from `@vercel/blob/client` in FileUploadField). The file's
 * bytes never pass through this server — only a short-lived, scope-limited
 * token does — which is what lets the browser report real byte-level
 * progress instead of a simulated one.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return apiError("invalid_request", "Couldn't read the upload request.", 400);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(ATTACHMENT_BLOB_PREFIX)) {
          throw new Error("Invalid upload path.");
        }
        const limit = await checkRateLimit(`contact-upload:ip:${ip}`, 20, 60 * 60);
        if (!limit.allowed) throw new Error("Too many uploads. Please try again later.");

        return {
          allowedContentTypes: ATTACHMENT_MIME_TYPES,
          maximumSizeInBytes: ATTACHMENT_MAX_BYTES,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Only fires when this deployment is publicly reachable by Vercel's
        // Blob service (not on localhost) — logged for visibility, nothing
        // else depends on it since the upload() promise already resolves
        // once the bytes land in the store.
        console.log(`[api/contact/upload] upload completed: ${blob.pathname}`);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("[api/contact/upload] token generation failed:", error);
    return apiError(
      "upload_token_failed",
      error instanceof Error ? error.message : "Couldn't start the upload.",
      400
    );
  }
}

/**
 * Deletes a temporary attachment blob — called when the user cancels,
 * removes, or replaces a selected file, and best-effort on page unload.
 * Anything left behind (e.g. the tab was closed mid-upload) is swept up by
 * /api/contact/upload/cleanup.
 */
export async function DELETE(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const limit = await checkRateLimit(`contact-upload-delete:ip:${ip}`, 30, 60 * 60);
  if (!limit.allowed) return apiError("rate_limited", "Too many requests. Please try again later.", 429);

  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url;
  if (!url || typeof url !== "string" || !url.includes(ATTACHMENT_BLOB_PREFIX)) {
    return apiError("invalid_request", "Missing or invalid attachment URL.", 400);
  }

  try {
    await del(url);
  } catch (error) {
    // Not fatal — the file is either already gone or will be swept up by
    // the cleanup cron. Don't block the user's UI on it.
    console.error("[api/contact/upload] delete failed:", error);
  }

  return NextResponse.json({ success: true });
}
