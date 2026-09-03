import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const RECIPIENT_EMAIL = "dominic.wokorach-o@outlook.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email and message are required" },
      { status: 400 }
    );
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service is not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact Form <onboarding@resend.dev>",
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Project enquiry: ${projectType || "General"}`,
      html: `
        <h2>New enquiry from portfolio contact form</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
        ${budget ? `<p><strong>Budget:</strong> ${escapeHtml(budget)}</p>` : ""}
        ${projectType ? `<p><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
