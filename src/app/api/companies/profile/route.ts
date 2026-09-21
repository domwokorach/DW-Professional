import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { fetchCompanyProfile, CompanyProviderError } from "@/lib/companies/search";
import { mapSicCodesToIndustry } from "@/lib/companies/sic";

export const runtime = "nodejs";

/**
 * Looks up a single company via the Companies House REST API, used only
 * after the candidate has selected a company from search — it enriches the
 * selection with status + an industry derived from SIC codes.
 */
export async function GET(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  let limit;
  try {
    limit = await checkRateLimit(`company-profile:ip:${ip}`, 30, 60);
  } catch (error) {
    console.error("[api/companies/profile] rate limit check failed:", error);
    return apiError("internal_error", "Unable to load company details.", 500);
  }
  if (!limit.allowed) {
    return apiError("rate_limited", "Too many requests. Please slow down.", 429);
  }

  const companyNumber = new URL(request.url).searchParams.get("number")?.trim() ?? "";
  if (!companyNumber) {
    return apiError("invalid_request", "A company number is required.", 400);
  }

  try {
    const profile = await fetchCompanyProfile(companyNumber);
    return NextResponse.json({
      status: profile.status,
      industry: mapSicCodesToIndustry(profile.sicCodes),
      sicCodes: profile.sicCodes ?? [],
    });
  } catch (error) {
    if (error instanceof CompanyProviderError) {
      console.error("[api/companies/profile] provider error:", error.message);
      return apiError("provider_error", "Unable to load company details.", error.status === 400 ? 400 : 502);
    }
    console.error("[api/companies/profile] unexpected error:", error);
    return apiError("internal_error", "Unable to load company details.", 500);
  }
}
