import QRCode from "qrcode";
import { getAppUrl } from "@/lib/auth/env";

const PRODUCTION_ORIGIN = "https://www.dominicwokorach.me";

/**
 * The URL the QR code encodes. In production it's always the deployed
 * site's /info page (APP_URL, falling back to the live domain). In
 * development it uses the request's own origin, so a dev QR opens the
 * local server instead of the live site.
 */
export function getInfoFormUrl(requestOrigin: string): string {
  const origin = process.env.NODE_ENV === "production" ? getAppUrl() || PRODUCTION_ORIGIN : requestOrigin;
  return `${origin.replace(/\/$/, "")}/info`;
}

const QR_OPTIONS = { errorCorrectionLevel: "M", margin: 2, color: { dark: "#000000", light: "#ffffff" } } as const;

export function renderInfoQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

export function renderInfoQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: 1024 });
}
