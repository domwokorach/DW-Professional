import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import {
  searchCompanies,
  CompanyProviderError,
  COMPANY_SEARCH_MIN_QUERY_LENGTH,
  COMPANY_SEARCH_MAX_QUERY_LENGTH,
  COMPANY_SEARCH_LETTER_PATTERN,
} from "@/lib/companies/search";
import type { CompanySearchResult } from "@/types/company";

export const runtime = "nodejs";

const UNAVAILABLE_MESSAGE =
  "Company search is temporarily unavailable. You can continue without selecting a company.";
const RATE_LIMITED_MESSAGE = "Too many company searches. Please try again shortly.";
const MAX_START_INDEX = 500;

function companyResponse(
  companies: CompanySearchResult[],
  extra?: { error?: string; totalResults?: number },
  status = 200
) {
  return NextResponse.json({ companies, ...extra }, { status });
}

/**
 * Searches the local CompanyRecord table (a mirror of Companies House's free
 * bulk CSV export — see scripts/import-companies-house-csv.mjs) rather than
 * calling the Companies House REST API. A query failure (DB unavailable,
 * etc.) is always reported as a soft error alongside an empty `companies`
 * array — the field is optional, so nothing here may block the surrounding
 * form from submitting.
 */
export async function GET(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  let limit;
  try {
    limit = await checkRateLimit(`company-search:ip:${ip}`, 30, 60);
  } catch (error) {
    console.error("[api/companies/search] rate limit check failed:", error);
    return companyResponse([], { error: UNAVAILABLE_MESSAGE }, 500);
  }
  if (!limit.allowed) {
    return companyResponse([], { error: RATE_LIMITED_MESSAGE }, 429);
  }

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";

  // A single A-Z letter (the A-Z browse filter) is a valid query even
  // though it's shorter than the normal typeahead minimum.
  const isLetterBrowse = COMPANY_SEARCH_LETTER_PATTERN.test(query);
  if (!isLetterBrowse && query.length < COMPANY_SEARCH_MIN_QUERY_LENGTH) {
    return companyResponse([]);
  }
  if (query.length > COMPANY_SEARCH_MAX_QUERY_LENGTH) {
    return companyResponse([], { error: "Invalid company search." }, 400);
  }

  const startIndex = Math.min(
    Math.max(0, Number(params.get("start_index")) || 0),
    MAX_START_INDEX
  );

  try {
    const { companies, totalResults } = await searchCompanies(query, startIndex);
    return companyResponse(companies, { totalResults });
  } catch (error) {
    if (error instanceof CompanyProviderError) {
      if (error.status === 400) {
        return companyResponse([], { error: "Invalid company search." }, 400);
      }
      if (error.status === 429) {
        return companyResponse([], { error: RATE_LIMITED_MESSAGE }, 429);
      }
      console.error("[api/companies/search] provider error:", error.message);
      return companyResponse([], { error: UNAVAILABLE_MESSAGE }, 502);
    }
    console.error("[api/companies/search] unexpected error:", error);
    return companyResponse([], { error: UNAVAILABLE_MESSAGE }, 500);
  }
}
