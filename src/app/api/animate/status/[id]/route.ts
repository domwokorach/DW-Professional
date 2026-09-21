import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/auth/apiError";
import { getRunwayClient } from "@/lib/animate/runway";

export const runtime = "nodejs";

/** Polled by the client every few seconds while a Runway task is in progress. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return apiError("invalid_request", "Missing task id.", 400);

  try {
    const runway = getRunwayClient();
    const task = await runway.tasks.retrieve(id);

    if (task.status === "SUCCEEDED") {
      return NextResponse.json({ status: task.status, videoUrl: task.output[0] ?? null });
    }

    if (task.status === "FAILED") {
      return NextResponse.json({ status: task.status, error: task.failure });
    }

    return NextResponse.json({ status: task.status });
  } catch (error) {
    console.error("[api/animate/status] Runway task lookup failed", error);
    return apiError("animation_failed", "Couldn't check the animation status. Please try again.", 502);
  }
}
