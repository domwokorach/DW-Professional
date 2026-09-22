/**
 * Mirrors the categorization in src/lib/companies/s3-source.ts
 * (categorizeS3Error/safeS3ErrorLogFields) for the standalone CLI import
 * script, which runs outside the Next.js/TS build. Never inspects or logs
 * anything but `.name`/`.$metadata` — no credentials, no CSV contents.
 */

export function categorizeS3Error(error) {
  const awsErrorCode = error?.name;
  const httpStatusCode = error?.$metadata?.httpStatusCode;
  const requestId = error?.$metadata?.requestId;
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
      if (httpStatusCode === 301 || httpStatusCode === 307) return { ...base, category: "region_mismatch" };
      if (httpStatusCode === 403) return { ...base, category: "access_denied" };
      if (httpStatusCode === 404) return { ...base, category: "no_such_key" };
      return { ...base, category: "unknown" };
  }
}

export function safeS3ErrorLogFields(config, categorized) {
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
