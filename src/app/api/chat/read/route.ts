import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { markAsRead } from "@/lib/chat/mark-as-read";
import { conversationIdSchema, safeParse, visitorIdSchema } from "@/lib/chat/validation";
import { z } from "zod";

export const runtime = "nodejs";

const readBodySchema = z.object({
  conversationId: conversationIdSchema,
  reader: z.enum(["visitor", "admin"]),
  visitorId: visitorIdSchema.optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = safeParse(readBodySchema, body);
  if (!input) {
    return NextResponse.json({ error: "conversationId and reader are required" }, { status: 400 });
  }

  if (input.reader === "admin") {
    const check = await requireAdminApi();
    if (!check.ok) return check.response;
  } else if (!input.visitorId) {
    return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
  }

  await markAsRead(input.conversationId, input.reader);
  return NextResponse.json({ ok: true });
}
