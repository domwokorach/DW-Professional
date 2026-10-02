import { NextRequest } from "next/server";
import { getInfoFormUrl, renderInfoQrSvg } from "@/lib/info/qr";

export const runtime = "nodejs";

/** Scannable QR code that opens the /info form. Add ?download to save it as a file. */
export async function GET(request: NextRequest) {
  const url = getInfoFormUrl(request.nextUrl.origin);
  const svg = await renderInfoQrSvg(url);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-QR-Target": url,
      ...(request.nextUrl.searchParams.has("download")
        ? { "Content-Disposition": 'attachment; filename="dominic-wokorach-info-qr.svg"' }
        : {}),
    },
  });
}
