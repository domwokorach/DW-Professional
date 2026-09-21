import type {
  CheckSmsVerificationResult,
  SendSmsVerificationResult,
  SmsVerificationProvider,
} from "./types";

if (typeof window !== "undefined") {
  throw new Error("twilio.provider must only be imported on the server");
}

const VERIFY_BASE_URL = "https://verify.twilio.com/v2";

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
}

/**
 * Verify Service-backed SmsVerificationProvider — sends and checks one-time
 * codes via Twilio's Verify API (https://verify.twilio.com/v2/Services/{sid}),
 * not the plain Messages API. Verify owns code generation, expiry and
 * per-number throttling itself, so nothing is persisted locally beyond which
 * comment-verification request the SMS attempt belongs to.
 */
export class TwilioVerifyProvider implements SmsVerificationProvider {
  private getCredentials(): TwilioCredentials | null {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!accountSid || !authToken || !verifyServiceSid) return null;
    return { accountSid, authToken, verifyServiceSid };
  }

  private authHeader(creds: TwilioCredentials): string {
    return `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`;
  }

  async send(to: string): Promise<SendSmsVerificationResult> {
    const creds = this.getCredentials();
    if (!creds) {
      console.warn("[sms] Twilio Verify not configured — skipping SMS verification send");
      return { ok: false, error: "not_configured" };
    }

    const res = await fetch(`${VERIFY_BASE_URL}/Services/${creds.verifyServiceSid}/Verifications`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(creds),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Channel: "sms" }),
    });

    const data: { status?: string; message?: string } | null = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("[sms] Twilio Verify send failed", { status: res.status, message: data?.message });
      return { ok: false, error: data?.message ?? `Twilio request failed with status ${res.status}` };
    }

    return { ok: true, status: data?.status };
  }

  async check(to: string, code: string): Promise<CheckSmsVerificationResult> {
    const creds = this.getCredentials();
    if (!creds) {
      console.warn("[sms] Twilio Verify not configured — skipping SMS verification check");
      return { ok: false, error: "not_configured" };
    }

    const res = await fetch(`${VERIFY_BASE_URL}/Services/${creds.verifyServiceSid}/VerificationCheck`, {
      method: "POST",
      headers: {
        Authorization: this.authHeader(creds),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, Code: code }),
    });

    const data: { status?: string; message?: string } | null = await res.json().catch(() => null);
    if (!res.ok) {
      // A 404 here means Twilio has no pending verification for this number
      // (expired, already approved, or max check attempts reached) — that's
      // a normal "this code no longer works" outcome, not a hard failure.
      if (res.status === 404) return { ok: true, approved: false };
      console.error("[sms] Twilio Verify check failed", { status: res.status, message: data?.message });
      return { ok: false, error: data?.message ?? `Twilio request failed with status ${res.status}` };
    }

    return { ok: true, approved: data?.status === "approved" };
  }
}

export const twilioVerifyProvider = new TwilioVerifyProvider();
