import { NextRequest } from "next/server";
import { getInfoFormUrl, renderInfoQrPng } from "@/lib/info/qr";

export const runtime = "nodejs";

/** 1024px PNG version of /info-qr.svg, for print or sharing. Add ?download to save it as a file. */
export async function GET(request: NextRequest) {
  const url = getInfoFormUrl(request.nextUrl.origin);
  const png = await renderInfoQrPng(url);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-QR-Target": url,
      ...(request.nextUrl.searchParams.has("download")
        ? { "Content-Disposition": 'attachment; filename="dominic-wokorach-info-qr.png"' }
        : {}),
    },
  });
}
