import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { verifyDownloadToken } from "@/lib/resumeAuth";

export const runtime = "nodejs";

const RESUME_PATH = path.join(process.cwd(), "private", "resume.pdf");

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!process.env.RESUME_PIN_SECRET) {
    return NextResponse.json(
      { error: "Resume verification is not configured" },
      { status: 500 }
    );
  }

  const result = verifyDownloadToken(token);

  if (!result.valid) {
    return NextResponse.json(
      { error: "This download link has expired. Please verify your email again." },
      { status: 401 }
    );
  }

  let file: Buffer;
  try {
    file = await readFile(RESUME_PATH);
  } catch {
    return NextResponse.json(
      { error: "The resume is not available right now" },
      { status: 503 }
    );
  }

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Dominic-Wokorach-Resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
