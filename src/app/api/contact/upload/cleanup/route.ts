import { NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { ATTACHMENT_BLOB_PREFIX } from "@/lib/contact/attachments";

export const runtime = "nodejs";

const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Deletes contact-form attachment uploads that were never attached to a
 * submission — a visitor closed the tab mid-upload, or right after it
 * finished but before pressing send. Triggered daily by the Vercel Cron
 * job declared in vercel.json (which sends `Authorization: Bearer
 * $CRON_SECRET` automatically when that env var is set).
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const cutoff = Date.now() - STALE_AFTER_MS;
  let deleted = 0;
  let cursor: string | undefined;

  try {
    do {
      const page = await list({ prefix: ATTACHMENT_BLOB_PREFIX, cursor, limit: 100 });
      const stale = page.blobs.filter((blob) => new Date(blob.uploadedAt).getTime() < cutoff);
      if (stale.length > 0) {
        await del(stale.map((blob) => blob.url));
        deleted += stale.length;
      }
      cursor = page.cursor;
    } while (cursor);
  } catch (error) {
    console.error("[api/contact/upload/cleanup] sweep failed:", error);
    return NextResponse.json({ success: false, deleted }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted });
}
