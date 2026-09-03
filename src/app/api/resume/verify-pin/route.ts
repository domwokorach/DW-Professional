import { NextRequest, NextResponse } from "next/server";
import { createDownloadToken, verifyPinChallenge } from "@/lib/resumeAuth";
import { clearVerifyAttempts, registerVerifyAttempt } from "@/lib/resumeRateLimit";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";
  const challenge = typeof body.challenge === "string" ? body.challenge : "";

  if (!email || !/^\d{6}$/.test(pin) || !challenge) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!process.env.RESUME_PIN_SECRET) {
    return NextResponse.json(
      { error: "Resume verification is not configured" },
      { status: 500 }
    );
  }

  if (!registerVerifyAttempt(challenge)) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429 }
    );
  }

  const result = verifyPinChallenge(challenge, email, pin);

  if (!result.valid) {
    return NextResponse.json({ error: result.reason ?? "Incorrect code" }, { status: 401 });
  }

  clearVerifyAttempts(challenge);

  const downloadToken = createDownloadToken(email);

  return NextResponse.json({ downloadToken });
}
