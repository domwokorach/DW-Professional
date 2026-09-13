import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/database/db";
import { apiError, validationError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import {
  submitCommentSchema,
  ALLOWED_AVATAR_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/comments/validation";
import type { PublicComment } from "@/types/comment";

export const runtime = "nodejs";

function toPublicComment(row: {
  id: string;
  fullName: string;
  company: string | null;
  body: string;
  avatarUrl: string | null;
  createdAt: Date;
}): PublicComment {
  return {
    id: row.id,
    fullName: row.fullName,
    company: row.company,
    body: row.body,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Public: only approved comments, newest first — feeds the homepage marquee. */
export async function GET() {
  const comments = await db.comment.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({ comments: comments.map(toPublicComment) });
}

/**
 * Public submission. Every comment starts PENDING and is invisible on the
 * site until an admin approves it (see /api/admin/comments/[id]) — this
 * route never sets status itself.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const limit = await checkRateLimit(`comment-submit:ip:${ip}`, 5, 60 * 60);
  if (!limit.allowed) {
    return apiError("rate_limited", "Too many submissions. Please try again later.", 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError("invalid_request", "Expected a multipart form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const parsed = submitCommentSchema.safeParse({
    fullName: form.get("fullName"),
    company: form.get("company"),
    body: form.get("body"),
  });
  if (!parsed.success) return validationError(parsed.error);

  let avatarUrl: string | null = null;
  const avatar = form.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatar.type)) {
      return apiError("invalid_avatar", "Avatar must be a JPEG, PNG, WebP, or GIF image.", 400, {
        avatar: "Unsupported image type.",
      });
    }
    if (avatar.size > AVATAR_MAX_BYTES) {
      return apiError("invalid_avatar", "Avatar must be smaller than 5 MB.", 400, {
        avatar: "File is too large.",
      });
    }

    const extension = avatar.type.split("/")[1] ?? "jpg";
    const blob = await put(`comment-avatars/${crypto.randomUUID()}.${extension}`, avatar, {
      access: "public",
      contentType: avatar.type,
    });
    avatarUrl = blob.url;
  }

  const comment = await db.comment.create({
    data: {
      fullName: parsed.data.fullName,
      company: parsed.data.company ?? null,
      body: parsed.data.body,
      avatarUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json(
    { ok: true, comment: toPublicComment(comment), message: "Thanks! Your comment is awaiting review." },
    { status: 201 }
  );
}
