import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getConversations } from "@/lib/chat/get-conversations";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    throw response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? undefined;

  const conversations = await getConversations({
    status: status === "open" || status === "pending" || status === "closed" ? status : undefined,
    search,
  });

  return NextResponse.json({ conversations });
}
