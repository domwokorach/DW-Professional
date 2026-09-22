#!/usr/bin/env node
/**
 * One-time/occasional operational script: uploads a local Companies House
 * bulk CSV export to the R2 object that scripts/import-companies-house-s3.mjs
 * reads from. Creates the configured bucket first if it doesn't exist yet.
 *
 * Always uploads to the exact bucket/key from COMPANIES_S3_URI /
 * AWS_S3_BUCKET / AWS_S3_KEY — refuses to run if the local file's basename
 * doesn't match AWS_S3_KEY, so this can't silently overwrite the configured
 * object with a differently-named file.
 *
 * Usage:
 *   node scripts/upload-companies-csv-to-r2.mjs <path-to-local-csv>
 */
import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { S3Client, CreateBucketCommand, HeadBucketCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function resolveS3Config() {
  const uri = requiredEnv("COMPANIES_S3_URI");
  const bucket = requiredEnv("AWS_S3_BUCKET");
  const key = requiredEnv("AWS_S3_KEY");
  const endpoint = requiredEnv("AWS_S3_ENDPOINT");
  const region = process.env.AWS_REGION || "auto";

  const match = /^s3:\/\/([^/]+)\/(.+)$/.exec(uri);
  if (!match) throw new Error(`COMPANIES_S3_URI is not a valid s3:// URI: ${uri}`);
  const [, uriBucket, uriKey] = match;
  if (uriBucket !== bucket) throw new Error(`COMPANIES_S3_URI bucket ("${uriBucket}") does not match AWS_S3_BUCKET ("${bucket}").`);
  if (uriKey !== key) throw new Error(`COMPANIES_S3_URI key ("${uriKey}") does not match AWS_S3_KEY ("${key}").`);

  return { uri, bucket, key, endpoint, region };
}

async function main() {
  const localPath = process.argv[2];
  if (!localPath) {
    console.error("Usage: node scripts/upload-companies-csv-to-r2.mjs <path-to-local-csv>");
    process.exit(1);
  }

  const stat = statSync(localPath);
  const config = resolveS3Config();

  if (path.basename(localPath) !== config.key) {
    console.error(
      `Refusing to upload: local file "${path.basename(localPath)}" does not match the configured AWS_S3_KEY "${config.key}". Rename the file or update AWS_S3_KEY/COMPANIES_S3_URI — not silently guessing which is right.`
    );
    process.exit(1);
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    console.log(`Bucket "${config.bucket}" already exists.`);
  } catch (error) {
    if (error.name !== "NotFound" && error.$metadata?.httpStatusCode !== 404) throw error;
    console.log(`Bucket "${config.bucket}" does not exist — creating it.`);
    await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
    console.log(`Bucket "${config.bucket}" created.`);
  }

  console.log(`Uploading ${localPath} (${(stat.size / 1024 ** 3).toFixed(2)} GB) to s3://${config.bucket}/${config.key} ...`);

  const upload = new Upload({
    client,
    params: {
      Bucket: config.bucket,
      Key: config.key,
      Body: createReadStream(localPath),
      ContentType: "text/csv",
    },
    // Multipart upload so a 2-3 GB file never has to be buffered whole.
    queueSize: 4,
    partSize: 32 * 1024 * 1024,
  });

  upload.on("httpUploadProgress", (progress) => {
    if (!progress.total) return;
    const pct = ((progress.loaded / progress.total) * 100).toFixed(1);
    process.stdout.write(`\rUploaded ${(progress.loaded / 1024 ** 3).toFixed(2)} GB / ${(progress.total / 1024 ** 3).toFixed(2)} GB (${pct}%)`);
  });

  await upload.done();
  process.stdout.write("\n");

  const head = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: config.key }));
  console.log(`Upload complete. Object size on R2: ${(head.ContentLength / 1024 ** 3).toFixed(2)} GB.`);
}

main().catch((error) => {
  console.error("Upload failed:", error.message);
  process.exit(1);
});
