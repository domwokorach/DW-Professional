/**
 * Server-only configuration for the Companies House bulk CSV import source.
 * This is the sole allow-listed origin for a full CompanyRecord (re)import
 * — see scripts/import-companies-house-s3.mjs (the actual streaming import)
 * and src/app/api/admin/companies/import/s3/route.ts (the admin trigger).
 *
 * Targets **native AWS S3** — not Cloudflare R2 or another S3-compatible
 * store. AWS_REGION is required (AWS S3 has no region-less "auto" the way
 * R2 does) and AWS_S3_ENDPOINT is optional, only for pointing the SDK at a
 * non-default endpoint; leave it unset for a normal AWS S3 bucket, which
 * resolves its endpoint from the region automatically.
 *
 * Nothing here is exported to the client: the bucket, key, and credentials
 * stay server-side, and the admin form never lets an operator type a
 * different source — see isAllowedCompaniesSourceUri.
 */

export interface CompaniesS3Config {
  uri: string;
  bucket: string;
  key: string;
  region: string;
  /** Only set for a non-default S3 endpoint; absent for native AWS S3. */
  endpoint?: string;
}

export class CompaniesS3ConfigError extends Error {}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new CompaniesS3ConfigError(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Reads and cross-checks the configured import source. Throws rather than
 * silently substituting a value if COMPANIES_S3_URI disagrees with
 * AWS_S3_BUCKET/AWS_S3_KEY — the bucket name must never be silently
 * "corrected", so a mismatch is a configuration error, not something to
 * paper over.
 */
export function getCompaniesS3Config(): CompaniesS3Config {
  const uri = requireEnv("COMPANIES_S3_URI");
  const bucket = requireEnv("AWS_S3_BUCKET");
  const key = requireEnv("AWS_S3_KEY");
  const region = requireEnv("AWS_REGION");
  const endpoint = process.env.AWS_S3_ENDPOINT || undefined;

  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match) {
    throw new CompaniesS3ConfigError(`COMPANIES_S3_URI is not a valid s3:// URI: ${uri}`);
  }
  const [, uriBucket, uriKey] = match;
  if (uriBucket !== bucket) {
    throw new CompaniesS3ConfigError(
      `COMPANIES_S3_URI bucket ("${uriBucket}") does not match AWS_S3_BUCKET ("${bucket}").`
    );
  }
  if (uriKey !== key) {
    throw new CompaniesS3ConfigError(
      `COMPANIES_S3_URI key ("${uriKey}") does not match AWS_S3_KEY ("${key}").`
    );
  }

  return { uri, bucket, key, endpoint, region };
}

/** "<bucket>/<key>" — the identity a CompanyImportRun.sourceKey is stored/looked up under. */
export function companiesSourceKey(config: Pick<CompaniesS3Config, "bucket" | "key">): string {
  return `${config.bucket}/${config.key}`;
}

/**
 * The only check a submitted `sourceUri` (see the admin import form) has to
 * pass: an exact match against the server-configured COMPANIES_S3_URI.
 * There is deliberately no path that accepts an operator-supplied bucket or
 * key — this is what "do not allow users to submit arbitrary S3 URLs" means
 * in practice.
 */
export function isAllowedCompaniesSourceUri(candidate: unknown): candidate is string {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  let configured: string;
  try {
    configured = getCompaniesS3Config().uri;
  } catch {
    return false;
  }
  return candidate === configured;
}

export type S3ErrorCategory =
  | "access_denied"
  | "no_such_bucket"
  | "no_such_key"
  | "region_mismatch"
  | "expired_credentials"
  | "unknown";

export interface CategorizedS3Error {
  category: S3ErrorCategory;
  awsErrorCode?: string;
  httpStatusCode?: number;
  requestId?: string;
}

/**
 * Maps an AWS SDK v3 S3 error to one of the categories an operator actually
 * needs to act on (see the admin import diagnostics and
 * scripts/import-companies-house-s3.mjs). Never inspects or logs the error's
 * credentials — only `.name`/`.$metadata`, which never carry secret values.
 */
export function categorizeS3Error(error: unknown): CategorizedS3Error {
  const err = error as { name?: string; $metadata?: { httpStatusCode?: number; requestId?: string } };
  const awsErrorCode = err?.name;
  const httpStatusCode = err?.$metadata?.httpStatusCode;
  const requestId = err?.$metadata?.requestId;

  const base = { awsErrorCode, httpStatusCode, requestId };

  switch (awsErrorCode) {
    case "NoSuchBucket":
      return { ...base, category: "no_such_bucket" };
    case "NoSuchKey":
    case "NotFound":
      return { ...base, category: "no_such_key" };
    case "AccessDenied":
    case "Forbidden":
      return { ...base, category: "access_denied" };
    case "PermanentRedirect":
    case "AuthorizationHeaderMalformed":
    case "IllegalLocationConstraintException":
      return { ...base, category: "region_mismatch" };
    case "ExpiredToken":
    case "RequestTimeTooSkewed":
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
      return { ...base, category: "expired_credentials" };
    default:
      if (httpStatusCode === 301 || httpStatusCode === 307) {
        return { ...base, category: "region_mismatch" };
      }
      if (httpStatusCode === 403) {
        return { ...base, category: "access_denied" };
      }
      if (httpStatusCode === 404) {
        return { ...base, category: "no_such_key" };
      }
      return { ...base, category: "unknown" };
  }
}

/**
 * Fields safe to log or surface to an admin operator for a failed S3
 * call — bucket, key, region, and the categorized error, but never
 * credentials or file contents.
 */
export function safeS3ErrorLogFields(
  config: Pick<CompaniesS3Config, "bucket" | "key" | "region">,
  categorized: CategorizedS3Error
) {
  return {
    bucket: config.bucket,
    key: config.key,
    region: config.region,
    errorCategory: categorized.category,
    awsErrorCode: categorized.awsErrorCode,
    httpStatusCode: categorized.httpStatusCode,
    requestId: categorized.requestId,
  };
}
