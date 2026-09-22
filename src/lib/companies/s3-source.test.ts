import {
  getCompaniesS3Config,
  companiesSourceKey,
  isAllowedCompaniesSourceUri,
  categorizeS3Error,
  CompaniesS3ConfigError,
} from "@/lib/companies/s3-source";

const VALID_ENV = {
  COMPANIES_S3_URI: "s3://dw-portfoilo/BasicCompanyDataAsOneFile-2026.csv",
  AWS_S3_BUCKET: "dw-portfoilo",
  AWS_S3_KEY: "BasicCompanyDataAsOneFile-2026.csv",
  AWS_REGION: "eu-west-2",
};

describe("getCompaniesS3Config", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reads a consistent configuration for native AWS S3 (no endpoint required)", () => {
    process.env = { ...process.env, ...VALID_ENV };
    delete process.env.AWS_S3_ENDPOINT;
    const config = getCompaniesS3Config();
    expect(config).toEqual({
      uri: VALID_ENV.COMPANIES_S3_URI,
      bucket: "dw-portfoilo",
      key: "BasicCompanyDataAsOneFile-2026.csv",
      endpoint: undefined,
      region: "eu-west-2",
    });
  });

  it("passes through an explicit endpoint for a non-AWS S3-compatible store", () => {
    process.env = { ...process.env, ...VALID_ENV, AWS_S3_ENDPOINT: "https://example.eu.r2.cloudflarestorage.com" };
    expect(getCompaniesS3Config().endpoint).toBe("https://example.eu.r2.cloudflarestorage.com");
  });

  it("requires AWS_REGION rather than defaulting to R2's \"auto\"", () => {
    process.env = { ...process.env, ...VALID_ENV, AWS_REGION: "" };
    expect(() => getCompaniesS3Config()).toThrow(CompaniesS3ConfigError);
  });

  it("throws when a required variable is missing", () => {
    process.env = { ...process.env, ...VALID_ENV, AWS_S3_BUCKET: "" };
    expect(() => getCompaniesS3Config()).toThrow(CompaniesS3ConfigError);
  });

  it("throws rather than silently correcting a bucket mismatch between COMPANIES_S3_URI and AWS_S3_BUCKET", () => {
    process.env = { ...process.env, ...VALID_ENV, AWS_S3_BUCKET: "some-other-bucket" };
    expect(() => getCompaniesS3Config()).toThrow(CompaniesS3ConfigError);
  });

  it("throws on a key mismatch", () => {
    process.env = { ...process.env, ...VALID_ENV, AWS_S3_KEY: "wrong-file.csv" };
    expect(() => getCompaniesS3Config()).toThrow(CompaniesS3ConfigError);
  });

  it("throws when COMPANIES_S3_URI isn't a valid s3:// URI", () => {
    process.env = { ...process.env, ...VALID_ENV, COMPANIES_S3_URI: "https://example.com/file.csv" };
    expect(() => getCompaniesS3Config()).toThrow(CompaniesS3ConfigError);
  });
});

describe("companiesSourceKey", () => {
  it("joins bucket and key", () => {
    expect(companiesSourceKey({ bucket: "dw-portfoilo", key: "BasicCompanyDataAsOneFile-2026.csv" })).toBe(
      "dw-portfoilo/BasicCompanyDataAsOneFile-2026.csv"
    );
  });
});

describe("isAllowedCompaniesSourceUri", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts only an exact match of the configured source", () => {
    process.env = { ...process.env, ...VALID_ENV };
    expect(isAllowedCompaniesSourceUri(VALID_ENV.COMPANIES_S3_URI)).toBe(true);
  });

  it("rejects an arbitrary S3 URL supplied by a client", () => {
    process.env = { ...process.env, ...VALID_ENV };
    expect(isAllowedCompaniesSourceUri("s3://attacker-bucket/whatever.csv")).toBe(false);
  });

  it("rejects a non-string value", () => {
    process.env = { ...process.env, ...VALID_ENV };
    expect(isAllowedCompaniesSourceUri(null)).toBe(false);
    expect(isAllowedCompaniesSourceUri(undefined)).toBe(false);
    expect(isAllowedCompaniesSourceUri(123)).toBe(false);
  });

  it("rejects everything when the server isn't configured", () => {
    process.env = { ...process.env, AWS_S3_BUCKET: "" };
    expect(isAllowedCompaniesSourceUri(VALID_ENV.COMPANIES_S3_URI)).toBe(false);
  });
});

describe("categorizeS3Error", () => {
  function awsError(name: string, httpStatusCode?: number, requestId = "req-123") {
    return { name, $metadata: { httpStatusCode, requestId } };
  }

  it("categorizes NoSuchBucket", () => {
    expect(categorizeS3Error(awsError("NoSuchBucket", 404)).category).toBe("no_such_bucket");
  });

  it("categorizes NoSuchKey", () => {
    expect(categorizeS3Error(awsError("NoSuchKey", 404)).category).toBe("no_such_key");
  });

  it("categorizes AccessDenied", () => {
    expect(categorizeS3Error(awsError("AccessDenied", 403)).category).toBe("access_denied");
  });

  it("categorizes a region redirect as region_mismatch", () => {
    expect(categorizeS3Error(awsError("PermanentRedirect", 301)).category).toBe("region_mismatch");
    expect(categorizeS3Error({ $metadata: { httpStatusCode: 307 } }).category).toBe("region_mismatch");
  });

  it("categorizes expired/invalid credentials", () => {
    expect(categorizeS3Error(awsError("ExpiredToken", 403)).category).toBe("expired_credentials");
    expect(categorizeS3Error(awsError("InvalidAccessKeyId", 403)).category).toBe("expired_credentials");
  });

  it("carries through the request id and status code for logging", () => {
    const categorized = categorizeS3Error(awsError("AccessDenied", 403, "req-abc"));
    expect(categorized.requestId).toBe("req-abc");
    expect(categorized.httpStatusCode).toBe(403);
    expect(categorized.awsErrorCode).toBe("AccessDenied");
  });

  it("falls back to unknown for an unrecognized error", () => {
    expect(categorizeS3Error(new Error("boom")).category).toBe("unknown");
  });
});
