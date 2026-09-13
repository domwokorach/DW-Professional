import { UAParser } from "ua-parser-js";
import { randomBytes } from "crypto";

export interface DeviceInfo {
  deviceType: string;
  operatingSystem: string;
  browser: string;
  deviceName: string;
}

/**
 * Device metadata is always derived server-side from the User-Agent header —
 * a client-supplied device name is never trusted as authoritative security
 * information.
 */
export function parseDeviceInfo(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return { deviceType: "Unknown", operatingSystem: "Unknown", browser: "Unknown", deviceName: "Unknown device" };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const osName = result.os.name ?? "Unknown OS";
  const osVersion = result.os.version ? ` ${result.os.version}` : "";
  const browserName = result.browser.name ?? "Unknown browser";
  const deviceVendor = result.device.vendor;
  const deviceModel = result.device.model;

  let deviceType = "Desktop";
  if (result.device.type === "mobile") deviceType = "Mobile";
  else if (result.device.type === "tablet") deviceType = "Tablet";
  else if (result.device.type) deviceType = result.device.type;
  else if (/iphone|android|mobile/i.test(osName)) deviceType = "Mobile";

  const deviceName = deviceVendor && deviceModel
    ? `${deviceVendor} ${deviceModel}`
    : deviceModel ?? `${osName}${osVersion} device`;

  return {
    deviceType,
    operatingSystem: `${osName}${osVersion}`.trim() || "Unknown OS",
    browser: browserName,
    deviceName,
  };
}

export function generateDeviceId(): string {
  return randomBytes(16).toString("hex");
}

export function extractClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}
