import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createPinChallenge, generatePin } from "@/lib/resumeAuth";
import { isRequestOnCooldown, markRequested } from "@/lib/resumeRateLimit";

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

  if (!resendApiKey || !pinSecret) {
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
      from: "Dominic Wokorach <onboarding@resend.dev>",
      to: email,
      subject: "Your resume verification code",
      html: `
        <p>Here is your verification code to download the resume:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${pin}</p>
        <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to send verification code" }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }

  markRequested(email);

  return NextResponse.json({ challenge });
}
