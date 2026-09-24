import { NextRequest, NextResponse } from "next/server";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { requireAdminApi } from "@/lib/auth/guard";
import { apiError } from "@/lib/auth/apiError";
import { companyDb as db } from "@/lib/database/company-db";
import {
  getCompaniesS3Config,
  companiesSourceKey,
  isAllowedCompaniesSourceUri,
  categorizeS3Error,
  safeS3ErrorLogFields,
  CompaniesS3ConfigError,
  type CompaniesS3Config,
} from "@/lib/companies/s3-source";

export const runtime = "nodejs";

interface SourceCheck {
  ok: boolean;
  category?: string;
  message: string;
}

/**
 * Cheap reachability check (HeadObject only — never downloads the 3 GB
 * file) so the admin panel can surface a real AWS diagnosis — bucket/object
 * missing, access denied, wrong region, expired credentials — before an
 * operator kicks off the actual out-of-band import. Logs only safe fields
 * (bucket, key, region, error code, request id); never credentials.
 */
async function checkSource(config: CompaniesS3Config): Promise<SourceCheck> {
  const client = new S3Client({
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
  });
  try {
    await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: config.key }));
    return { ok: true, message: "Bucket and object are reachable." };
  } catch (error) {
    const categorized = categorizeS3Error(error);
    console.error("[api/admin/companies/import/s3] source check failed:", safeS3ErrorLogFields(config, categorized));
    const messages: Record<string, string> = {
      no_such_bucket: "The configured AWS S3 bucket does not exist in this region.",
      no_such_key: "The configured object was not found in the bucket.",
      access_denied: "Access denied — check the IAM policy grants s3:GetObject/s3:HeadObject on this object.",
      region_mismatch: "The bucket exists in a different AWS region than AWS_REGION is set to.",
      expired_credentials: "AWS credentials are invalid or expired.",
      unknown: "Could not reach the configured AWS S3 object.",
    };
    return { ok: false, category: categorized.category, message: messages[categorized.category] };
  }
}

function serializeRun(run: {
  id: string;
  status: string;
  rowCount: number;
  rejectedRows: number;
  byteOffset: bigint;
  totalBytes: bigint | null;
  errorDetails: unknown;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    id: run.id,
    status: run.status,
    rowCount: run.rowCount,
    rejectedRows: run.rejectedRows,
    byteOffset: run.byteOffset.toString(),
    totalBytes: run.totalBytes?.toString() ?? null,
    errorDetails: run.errorDetails ?? [],
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() ?? null,
    updatedAt: run.updatedAt.toISOString(),
  };
}

/**
 * Status of the last (or in-progress) import from the configured AWS S3
 * source, for the admin "Import from configured source" panel — see
 * CompaniesImportView. The transfer itself always runs out-of-band via
 * scripts/import-companies-house-s3.mjs; this route never streams the file.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let config;
  try {
    config = getCompaniesS3Config();
  } catch (error) {
    if (error instanceof CompaniesS3ConfigError) {
      return apiError("not_configured", error.message, 500);
    }
    throw error;
  }

  const sourceKey = companiesSourceKey(config);
  const [run, sourceCheck] = await Promise.all([
    db.companyImportRun.findFirst({
      where: { sourceKey },
      orderBy: { startedAt: "desc" },
    }),
    checkSource(config),
  ]);

  return NextResponse.json({
    sourceKey,
    run: run ? serializeRun(run) : null,
    sourceCheck,
  });
}

/**
 * Validates a requested import source against the server-configured
 * COMPANIES_S3_URI (the only source ever accepted — see
 * src/lib/companies/s3-source.ts) and, once validated, reports whether a
 * transfer is already running or needs to be started.
 *
 * This route deliberately does not perform the 3 GB transfer itself: it
 * would exceed any request timeout, and per the import design it must
 * never run inside a normal page/API request. Starting (or resuming) the
 * actual import means running `npm run import:companies:s3` (scheduled or
 * manual, outside the Next.js server) — that script creates/continues the
 * same CompanyImportRun row this endpoint reports on.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
    return apiError("invalid_request", "Expected a form submission.", 400);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return apiError("invalid_request", "Couldn't read the submitted form.", 400);

  const sourceUri = form.get("sourceUri");
  if (!isAllowedCompaniesSourceUri(sourceUri)) {
    return apiError(
      "unsupported_source",
      "Unsupported import source. Only the configured Companies House dataset can be imported.",
      400
    );
  }

  let config;
  try {
    config = getCompaniesS3Config();
  } catch (error) {
    if (error instanceof CompaniesS3ConfigError) {
      return apiError("not_configured", error.message, 500);
    }
    throw error;
  }

  const sourceKey = companiesSourceKey(config);
  const running = await db.companyImportRun.findFirst({
    where: { sourceKey, status: "running" },
    orderBy: { startedAt: "desc" },
  });

  if (running) {
    return NextResponse.json(
      {
        queued: false,
        message: "An import is already running for this source.",
        run: serializeRun(running),
      },
      { status: 202 }
    );
  }

  return NextResponse.json({
    queued: true,
    message:
      "Source validated. Run `npm run import:companies:s3` (scheduled or by an operator) to start the transfer.",
    sourceKey,
  });
}
