import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function adminRecipients(): string[] {
  if (process.env.ADMIN_NOTIFICATION_EMAIL) return [process.env.ADMIN_NOTIFICATION_EMAIL];

  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const budget = typeof body.budget === "string" ? body.budget.trim() : "";
  const projectType = typeof body.projectType === "string" ? body.projectType.trim() : "";

  if (!name || !message) {
    return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const recipients = adminRecipients();

  if (!resendApiKey || !fromEmail || recipients.length === 0) {
    return NextResponse.json({ error: "Contact form is not configured" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  const detailLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    company && `Company: ${company}`,
    budget && `Budget: ${budget}`,
    projectType && `Project Type: ${projectType}`,
    "",
    message,
  ].filter((line): line is string => Boolean(line) || line === "");

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      replyTo: email,
      subject: `New enquiry from ${name}`,
      text: detailLines.join("\n"),
    });

    if (error) {
      console.error("Resend email error:", error);
      return NextResponse.json({ error: "Failed to send your message" }, { status: 502 });
    }
  } catch (err) {
    console.error("Resend email error:", err);
    return NextResponse.json({ error: "Failed to send your message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
