import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/auth/apiError";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import {
  searchCompanies,
  CompanyProviderError,
  COMPANY_SEARCH_MIN_QUERY_LENGTH,
  COMPANY_SEARCH_MAX_QUERY_LENGTH,
} from "@/lib/companies/search";

export const runtime = "nodejs";

/**
 * Proxies company lookups to the Companies House API so the provider's API
 * key never reaches the browser. Mirrors the defensive error handling in
 * /api/comments: every fallible step is caught individually and turned into
 * a JSON error response rather than an uncaught 500.
 */
export async function GET(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  let limit;
  try {
    limit = await checkRateLimit(`company-search:ip:${ip}`, 30, 60);
  } catch (error) {
    console.error("[api/companies/search] rate limit check failed:", error);
    return apiError("internal_error", "Unable to search companies. You can still enter the company manually.", 500);
  }
  if (!limit.allowed) {
    return apiError("rate_limited", "Too many searches. Please slow down.", 429);
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < COMPANY_SEARCH_MIN_QUERY_LENGTH) {
    return apiError(
      "invalid_request",
      `Search query must be at least ${COMPANY_SEARCH_MIN_QUERY_LENGTH} characters.`,
      400
    );
  }
  if (query.length > COMPANY_SEARCH_MAX_QUERY_LENGTH) {
    return apiError("invalid_request", "Search query is too long.", 400);
  }

  try {
    const companies = await searchCompanies(query);
    return NextResponse.json({ companies });
  } catch (error) {
    if (error instanceof CompanyProviderError) {
      if (error.status === 429) {
        return apiError("rate_limited", "Unable to search companies. You can still enter the company manually.", 429);
      }
      console.error("[api/companies/search] provider error:", error.message);
      return apiError(
        "provider_error",
        "Unable to search companies. You can still enter the company manually.",
        502
      );
    }
    console.error("[api/companies/search] unexpected error:", error);
    return apiError(
      "internal_error",
      "Unable to search companies. You can still enter the company manually.",
      500
    );
  }
}
