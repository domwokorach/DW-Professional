import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { validatePortraitMeta, verifyAndEncodePortrait } from "@/lib/animate/image";
import { getRunwayClient, PORTRAIT_ANIMATION_PROMPT } from "@/lib/animate/runway";

export const runtime = "nodejs";

/**
 * Starts a Runway image-to-video task animating an uploaded portrait while
 * keeping the background static. Returns the Runway task id immediately —
 * the client polls GET /api/animate/status/[id] for progress and the final
 * video URL, since generation takes tens of seconds to a few minutes.
 */
export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  const rateLimit = await checkRateLimit(`animate:${ip}`, 5, 60 * 60);
  if (!rateLimit.allowed) {
    return apiError("rate_limited", "Too many animation requests. Please try again later.", 429);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError("invalid_request", "Expected a multipart form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return apiError("validation_error", "Please attach a photo.", 422, { photo: "Please attach a photo." });
  }

  const metaError = validatePortraitMeta(file);
  if (metaError) {
    return apiError("validation_error", metaError, 422, { photo: metaError });
  }

  const dataUri = await verifyAndEncodePortrait(file);
  if (!dataUri) {
    return apiError("validation_error", "That file doesn't look like a valid photo.", 422, {
      photo: "That file doesn't look like a valid photo.",
    });
  }

  try {
    const runway = getRunwayClient();
    const task = await runway.imageToVideo.create({
      model: "gen4_turbo",
      promptImage: dataUri,
      promptText: PORTRAIT_ANIMATION_PROMPT,
      ratio: "960:960",
      duration: 5,
    });
    return NextResponse.json({ taskId: task.id });
  } catch (error) {
    console.error("[api/animate] Runway task creation failed", error);
    return apiError("animation_failed", "Couldn't start the animation. Please try again.", 502);
  }
}
