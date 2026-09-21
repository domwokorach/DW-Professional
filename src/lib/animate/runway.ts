import RunwayML from "@runwayml/sdk";

let client: RunwayML | null = null;

/** Lazily constructed so a missing API key only breaks the /api/animate route, not the whole app. */
export function getRunwayClient(): RunwayML {
  if (!client) {
    const apiKey = process.env.RUNWAY_API_KEY;
    if (!apiKey) throw new Error("RUNWAY_API_KEY is not configured.");
    client = new RunwayML({ apiKey });
  }
  return client;
}

/** Runway caps promptText at 1000 UTF-16 characters for gen4_turbo — keep this under that. */
export const PORTRAIT_ANIMATION_PROMPT =
  "Animate only the person in this portrait; keep the background completely static and unchanged. " +
  "Preserve their exact facial identity, structure, skin tone, hairstyle, and smile. Add subtle, realistic " +
  "motion: gentle blinking, eyes moving slightly up then down then relaxing, tiny eyebrow movement, subtle " +
  "micro-expressions, slight breathing, a very small head tilt, and a gentle relaxed smile. Keep motion smooth, " +
  "controlled, and minimal. Do not move, distort, blur, zoom, pan, or shift the background or its objects, " +
  "colors, or lighting. No parallax, no environmental movement, no flicker. Keep the camera locked: no zoom, " +
  "pan, tilt, shake, or reframing. Maintain the centered head-and-shoulders composition. Keep facial features " +
  "consistent frame to frame with no warping, identity drift, or eye distortion.";
