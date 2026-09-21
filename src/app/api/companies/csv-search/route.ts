import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rateLimit";
import { extractClientIp } from "@/lib/auth/device";
import { searchCsvCompanies } from "@/lib/companies/csv";
import type { CsvCompany } from "@/lib/companies/csv";

export const runtime = "nodejs";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 160;
const UNAVAILABLE_MESSAGE = "Unable to load companies. Please try again.";

function companyResponse(companies: CsvCompany[], extra?: { error?: string }, status = 200) {
  return NextResponse.json({ companies, ...extra }, { status });
}

/**
 * Company suggestions for the "Have a project in mind?" enquiry form,
 * sourced from the bundled CSV dataset (src/data/companies.csv) rather than
 * the live Companies House API — this field is a lightweight, optional
 * "which company are you with" hint, not a verified company lookup.
 */
export async function GET(request: NextRequest) {
  const ip = extractClientIp(request.headers) ?? "unknown";

  let limit;
  try {
    limit = await checkRateLimit(`csv-company-search:ip:${ip}`, 30, 60);
  } catch (error) {
    console.error("[api/companies/csv-search] rate limit check failed:", error);
    return companyResponse([], { error: UNAVAILABLE_MESSAGE }, 500);
  }
  if (!limit.allowed) {
    return companyResponse([], { error: "Too many company searches. Please try again shortly." }, 429);
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH) return companyResponse([]);
  if (query.length > MAX_QUERY_LENGTH) {
    return companyResponse([], { error: "Invalid company search." }, 400);
  }

  try {
    const companies = searchCsvCompanies(query);
    return companyResponse(companies);
  } catch (error) {
    console.error("[api/companies/csv-search] search failed:", error);
    return companyResponse([], { error: UNAVAILABLE_MESSAGE }, 500);
  }
}
