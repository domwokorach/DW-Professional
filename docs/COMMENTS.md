# Comments ("What people are saying") and admin moderation

Two completely separate sides:

| | Candidate (public) | Admin (private) |
|---|---|---|
| Where | The "What people are saying" section on the home page | `/admin/login` → `/admin/comments` |
| Can do | Submit a comment; read approved comments | Approve, reject, delete; see private details |
| APIs | `GET/POST /api/comments`, `POST /api/comments/avatar-upload`, `GET /api/comments/[id]/avatar` | `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/comments`, `PATCH /api/admin/comments/[id]/approve` and `/reject`, `DELETE /api/admin/comments/[id]` |
| Auth | None | Server-side session on every page and API |

Nothing on the public side links to, renders or returns admin controls, admin endpoints, emails, IP addresses,
device details, consent records, statuses or session data.

## Turning it on (one-off)

1. Apply the migrations (they are **not** run by the build or a deploy), from a machine whose `.env` points at the
   real database:

   ```bash
   npm run db:deploy
   ```

2. Create your admin account (you'll be asked for a password, at least 12 characters, at a hidden prompt):

   ```bash
   npm run admin -- create you@example.com
   ```

3. Check email: notifications go through Resend (`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`) to
   `COMMENTS_NOTIFY_EMAIL` (default `dominic.wokorach-o@outlook.com`). With Resend's test sender
   (`onboarding@resend.dev`) Resend only delivers to the address that owns the Resend account, so use a verified
   domain sender for the real address.

Avatars need the S3 settings used for contact attachments (`AWS_REGION`, `AWS_S3_BUCKET_NAME`). Without them the
avatar field is simply not shown.

## Candidate flow

1. The form collects avatar (optional), full name, email, company (optional) and comment, plus an unticked
   permission checkbox ("I give permission for my submitted information to be used to review and moderate my
   comment."). The form tells the visitor which metadata is recorded.
2. `POST /api/comments` re-validates and cleans everything (plain text only: no markup, no links; name 2-60,
   company ≤ 80, comment 10-600 characters, valid email), checks the avatar in S3 (≤ 5 MB, JPG/PNG/WebP, magic
   bytes), records device/platform, IP address, time and consent, and saves the comment as `PENDING`. The visitor
   can't set the status.
3. A moderation email (all the details, status "Pending", and an **Open Admin Moderation** link to
   `/admin/comments`) is sent. If it fails the comment is still saved and the dashboard shows "Email alert: Not
   delivered".
4. The visitor sees "Thank you! Your comment has been submitted for approval."
5. The public feed (`GET /api/comments`) returns approved comments only, newest first, with public fields only.
   It's cached for about 30 seconds, so an approval shows up within a minute.

Duplicate protection: one id per submission attempt (a double click or retry never creates two comments), and the
same email posting the same text within a day counts as a repeat. Rate limits: a per-instance burst limit plus 5
comments per IP per hour across all instances, and a honeypot field.

## Admin flow and security

- **Accounts** live in `AdminUser` (separate from comments). Passwords are hashed with Argon2id
  (`@node-rs/argon2`, m=19 MiB, t=2, p=1); hashes never leave the server. There is no sign-up page.
- **Sign-in** (`/admin/login`): email + password are checked on the server; the account must exist, be active and
  have the `ADMIN` role. Every failure says "Invalid email or password." and unknown emails still run a hash
  check, so neither the message nor the timing reveals which emails exist.
- **Throttling**: failures are counted per IP (10 free) and per account (5 free) over 15 minutes; after that each
  failure doubles the wait (30 s up to 15 min). Nothing locks permanently.
- **Sessions** (`AdminSession`): a random 256-bit token in an `HttpOnly`, `SameSite=Lax` cookie (`Secure` and the
  `__Host-` prefix in production); the database stores only its SHA-256. Sessions end 8 hours after sign-in
  (absolute) or after 30 minutes without an authenticated request (idle). Only valid requests extend the idle
  timer; an old cookie never creates a session. Signing in revokes any session the browser already held
  (fixation).
- **Every** admin page (`requireAdminPage`) and API (`requireAdminSession`) re-validates the session against the
  database: exists, not expired, not idle, not revoked, admin exists, is active, has the role. No session → 401
  (APIs) or a redirect to `/admin/login?next=…` (pages); wrong role → 403. The middleware only adds a cheap
  "no cookie → login" redirect and no-cache / no-index / no-framing headers; it is not the access check.
- **Expiry**: a protected page or request with an expired session goes back to `/admin/login`, which shows "Your
  admin session has expired. Please sign in again." and returns you to the page you wanted after sign-in.
- **CSRF**: approve, reject, delete and logout need a same-origin `Origin` header **and** an `x-csrf-token` header
  matching an HMAC of the session token (handed to the dashboard by the server, never stored in the browser).
  Sign-in requires a same-origin `Origin`.
- **Logout** revokes the session in the database and clears the cookie; the old cookie no longer works.
- **Audit log** (`AdminAuditLog`): `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_THROTTLED`, `LOGOUT`,
  `SESSION_REVOKED`, `PASSWORD_CHANGED`, `COMMENT_APPROVED`, `COMMENT_REJECTED`, `COMMENT_DELETED`, with IP and
  user agent. Never passwords or tokens.
- **Moderation**: approve works on pending or rejected comments; reject on pending or approved ones (it unpublishes).
  Delete is permanent (row and avatar), after the confirmation "Are you sure you want to permanently delete this
  comment?". The audit log keeps the comment id.
- **Avatars** are in the private bucket and only reachable through `/api/comments/[id]/avatar`: public once the
  comment is approved, otherwise only for a signed-in admin.
- All user content is rendered as text by React, never as HTML; the email escapes every value.

## Managing admins

```bash
npm run admin -- list
npm run admin -- create <email>
npm run admin -- reset-password <email>    # also signs that admin out everywhere
npm run admin -- deactivate <email>        # blocks sign-in, signs out everywhere
npm run admin -- activate <email>
npm run admin -- revoke-sessions <email>
```

## Not built yet (structured for later)

- **MFA**: `POST /api/admin/login` verifies the password, then calls `createAdminSession`. A second factor slots in
  between: return a short-lived challenge instead of a session, verify the code, then create the session.
- **Self-service password reset** (`/admin/forgot-password`): not implemented; use `npm run admin -- reset-password`.
  If added, reset tokens must be random, hashed in the database, single-use and short-lived, and a successful reset
  must call `revokeAllSessions`.
