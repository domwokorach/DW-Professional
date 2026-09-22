import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import { apiError, validationError } from "@/lib/auth/apiError";
import { moderateCommentSchema } from "@/lib/comments/validation";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = moderateCommentSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const existing = await db.comment.findUnique({ where: { id } });
  if (!existing) return apiError("not_found", "Comment not found.", 404);

  const comment = await db.comment.update({
    where: { id },
    data: { status: parsed.data.status, reviewedAt: new Date(), reviewedBy: result.admin.userId },
  });

  // The homepage testimonials section is statically rendered from
  // APPROVED comments (see src/components/sections/Testimonials.tsx), so a
  // moderation decision here would otherwise never reach visitors until the
  // next deploy — revalidate it on every status change (approve, reject,
  // or moving a comment back to pending).
  if (existing.status === "APPROVED" || comment.status === "APPROVED") {
    revalidatePath("/");
  }

  return NextResponse.json({ ok: true, status: comment.status });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdminApi(request);
  if (!result.ok) return result.response;

  const { id } = await params;
  const existing = await db.comment.findUnique({ where: { id } });
  if (!existing) return apiError("not_found", "Comment not found.", 404);

  await db.comment.delete({ where: { id } });

  if (existing.avatarUrl) {
    await del(existing.avatarUrl).catch(() => {
      // The DB row is already gone; a stray blob left behind isn't worth
      // failing the request over.
    });
  }

  if (existing.status === "APPROVED") {
    revalidatePath("/");
  }

  return NextResponse.json({ ok: true });
}
