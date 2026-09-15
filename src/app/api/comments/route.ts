import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { toPublicComment } from "@/lib/comments/toPublicComment";

export const runtime = "nodejs";

/** Public: only approved comments, newest first — feeds the homepage marquee. */
export async function GET() {
  const comments = await db.comment.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({ comments: comments.map(toPublicComment) });
}

// Public submission now happens in two steps — see
// /api/comments/send-pin (validates + emails a PIN) and
// /api/comments/verify-pin (confirms the PIN and creates the Comment).
