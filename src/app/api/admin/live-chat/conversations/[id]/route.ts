import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getConversationWithMessages,
  markConversationRead,
  setConversationStatus,
} from "@/lib/liveChat/conversations";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    throw response;
  }

  const { id } = await params;
  const conversation = await getConversationWithMessages(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markConversationRead(id, "admin");

  return NextResponse.json({ conversation });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    throw response;
  }

  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.status !== "open" && body.status !== "closed") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const conversation = await setConversationStatus(id, body.status);
  return NextResponse.json({ conversation });
}
