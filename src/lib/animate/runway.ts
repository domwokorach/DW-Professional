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

export const PORTRAIT_ANIMATION_PROMPT =
  "Animate only the person in this portrait; keep the background completely static and unchanged. " +
  "Preserve their exact facial identity, facial structure, skin tone, hairstyle, hairline, smile, and " +
  "recognizable features. Add subtle, realistic motion: gentle blinking, eyes moving slightly upward then " +
  "downward then returning to a relaxed position, tiny natural eyebrow movement, subtle facial micro-expressions, " +
  "slight natural breathing, a very small head tilt, and a gentle relaxed smile. Keep all motion smooth, " +
  "controlled, realistic, and minimal. Do not animate, move, distort, blur, zoom, pan, or shift the background " +
  "or any background objects, colors, lighting, or gradients. No parallax effect, no environmental movement, " +
  "no background flicker. Keep the camera locked and stable: no zoom, no pan, no tilt, no shake, no reframing. " +
  "Maintain the original centered head-and-shoulders composition. Keep facial features consistent frame to " +
  "frame with no face warping, identity drift, eye distortion, or flickering.";
