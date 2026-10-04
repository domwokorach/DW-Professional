# Contact attachments in Amazon S3

The contact form uploads attachments straight to a **private** S3 bucket:

```
Browser ──POST /api/upload {filename,size}──▶ server validates, returns a presigned PUT URL (5 min)
Browser ──PUT file──────────────────────────▶ S3  (uploads/contact/<uuid>.<ext>)
Browser ──POST /api/contact {…, fileKey}────▶ server re-checks the object (key pattern, size,
                                               leading bytes), emails a 7-day download link
```

AWS credentials never reach the browser; the SDK lives in `src/lib/s3.server.ts` and the two
API routes. If `AWS_S3_BUCKET_NAME` or `AWS_REGION` is missing, the form falls back to sending
files (≤ 4 MB) through the server as email attachments.

## 1. Bucket

- Create a bucket in your region (e.g. `eu-west-2`).
- Keep **Block all public access** on. Nothing here needs public objects.
- Default encryption (SSE-S3) is fine.

## 2. CORS (needed for the browser's direct PUT)

Bucket → Permissions → CORS. Only your origins, only `PUT`:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3000
  }
]
```

## 3. IAM (least privilege)

Give the app's IAM user/role only this, scoped to the upload prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/uploads/contact/*"
    }
  ]
}
```

(`HeadObject` is covered by `s3:GetObject`.) Don't use administrator keys.

## 4. Lifecycle rule (recommended)

Uploads that are never followed by a sent enquiry stay in the bucket. Add a lifecycle rule on
prefix `uploads/contact/` to **expire objects after 30 days**. Download links in emails last
7 days, so 30 days leaves time to save anything you need.

## 5. Environment

```env
AWS_REGION=eu-west-2
AWS_S3_BUCKET_NAME=your-bucket
AWS_ACCESS_KEY_ID=…        # local only; in production prefer an IAM role / OIDC
AWS_SECRET_ACCESS_KEY=…
```

Restart `npm run dev` after changing `.env`.
