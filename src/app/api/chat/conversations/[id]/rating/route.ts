import { NextRequest, NextResponse } from "next/server";
import { canAccessConversation } from "@/lib/chat/permissions";
import { rateConversation } from "@/lib/chat/rate-conversation";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { ratingSchema, safeParse } from "@/lib/chat/validation";

export const runtime = "nodejs";

/** Candidate-only: 1–5 stars + optional feedback, submitted once after ending a chat. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = extractClientIp(request.headers) ?? "unknown";
  const limit = await checkRateLimit(`chat-rating:ip:${ip}`, 10, 60 * 60);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const input = safeParse(ratingSchema, body);
  if (!input) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const conversation = await canAccessConversation(id, { visitorId: input.visitorId });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const applied = await rateConversation(id, input.rating, input.feedback);
  if (!applied) {
    return NextResponse.json({ error: "This conversation has already been rated." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
