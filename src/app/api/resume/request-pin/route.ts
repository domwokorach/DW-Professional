import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createPinChallenge, generatePin } from "@/lib/resumeAuth";
import { isRequestOnCooldown, markRequested } from "@/lib/resumeRateLimit";
import VerificationEmail from "@emails/VerificationEmail";
import { RESUME_PIN_TTL_MINUTES } from "@/lib/resumeConstants";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (isRequestOnCooldown(email)) {
    return NextResponse.json(
      { error: "Please wait before requesting another code" },
      { status: 429 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const pinSecret = process.env.RESUME_PIN_SECRET;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !pinSecret || !fromEmail) {
    return NextResponse.json(
      { error: "Resume verification is not configured" },
      { status: 500 }
    );
  }

  const pin = generatePin();
  const challenge = createPinChallenge(email, pin);

  const resend = new Resend(resendApiKey);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Verify your email",
      react: VerificationEmail({ pin, expiresInMinutes: RESUME_PIN_TTL_MINUTES }),
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 502 });
    }
  } catch (err) {
    console.error("Resend email error:", err);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }

  markRequested(email);

  return NextResponse.json({ challenge });
}
