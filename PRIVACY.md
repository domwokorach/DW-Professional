# Privacy and Data Handling

This developer-facing document records the data flows implemented in the DOMINIC portfolio. The visitor-facing notice is rendered at `/privacy` from `src/views/legal/PrivacyView.tsx`; that page must be updated whenever implementation changes affect visitors.

This document describes current code and configuration. It is not legal advice and does not claim a certification, an unverified processing location or practices controlled solely by a third-party provider.

Last reviewed: 7 October 2026.

## Information collected

### Contact enquiries

The contact form accepts full name, email address, project type and message; optional mobile number and company information; an optional attachment; and a generated submission identifier and timestamps.

The server briefly uses the request IP address for rate limiting. Contact-form IP addresses are held in process memory for up to ten minutes and are not written to the contact-message database record.

### Visitor comments and testimonials

The comments form accepts a full name, email address, optional company, comment, optional avatar and explicit moderation permission. The database also records submission timestamps, IP address, a short device/browser description, moderation state and administrator actions. Only approved public fields are returned to the public feed; email, IP address, device details and consent records remain private.

### Portfolio Access

Portfolio Access accepts full name, email address, mobile number, optional company details, optional professional links and an optional supported file. It records timestamps, source/page identifiers, IP address and device/browser information. Repeated submissions from the same normalised email update the private session and increment its submission count.

If a visitor chooses LinkedIn OpenID Connect, the site may receive the member identifier, name, profile image, email address and language that LinkedIn returns with the authorised scopes. The site does not receive the LinkedIn password and does not retain the access token after the short import session.

### Administrator activity

Private administrator records include an email address, Argon2id password hash, active sessions, relevant IP/user-agent data, sign-in throttling records and security audit events. Plaintext administrator passwords and raw session tokens are not stored.

### Browser storage

The site currently stores up to two local-storage values: `portfolio-cookie-consent`, recording the visitor's accept/reject choice, and `portfolio-theme`, set only after the visitor chooses a light or dark theme.

The application currently sets no analytics or advertising cookies and loads no analytics or tracking tools.

## Purpose and appropriate use

Information is used only for the feature through which it was supplied: responding to candidate or project enquiries; delivering and retaining enquiry records when configured; moderating and publishing approved comments; managing access to the CV; preventing repeated automated submissions and protecting administrator access; and operating optional company lookup, LinkedIn import and weather features.

The code obtains explicit permission before a visitor comment is submitted for moderation. The precise lawful basis for a production deployment is an operational/legal decision for the site owner and is not inferred by this repository document.

## Storage

- PostgreSQL stores configured contact, comment, administrator and Portfolio Access records.
- A separate PostgreSQL connection stores imported Companies House data; it is not used as the portfolio-record database.
- Private Amazon S3 storage may hold contact attachments and comment avatars. Portfolio Access files are currently stored with their database record.
- Contact attachments may instead be attached directly to notification email when S3 is not configured and the file is within the fallback size limit.
- Environment secrets are read server-side and ignored by Git. Only `.env.example` should be committed.

## Retention

The current application configuration states that contact enquiries and their attachments are retained for 12 months. This value is defined in `src/config/legal.ts` and must match operational deletion processes.

Comments and their private moderation details remain until the visitor asks for removal or an administrator deletes them. Portfolio Access sessions and their files follow the same delete-on-request or administrator-deletion model. Administrator audit records may remain after the affected comment or Portfolio Access record is deleted so that security actions remain traceable.

No broader retention period is claimed here. Third-party providers may retain service and security logs under their own contracts and policies.

## Security measures implemented

- Server-side validation repeats public form validation.
- Rate limits use trusted request information where configured.
- Submission identifiers make supported retries idempotent.
- Administrator passwords use Argon2id and sessions store only SHA-256 token hashes.
- Administrator cookies are HttpOnly and become secure host cookies in production.
- S3 objects are private and shared through short-lived signed operations.
- File types, sizes and stored-object metadata are checked before use.
- Private comment and Portfolio Access administration routes require an authenticated administrator session.

These are implementation controls, not a security certification or guarantee.

## Third-party services

Depending on configuration, data may be processed by Vercel, Resend, PostgreSQL infrastructure, Amazon Web Services S3, LinkedIn, Companies House, Cloudinary and OpenWeather. OpenWeather requests are made by the server and do not include form submissions.

Provider processing locations and retention practices depend on the owner's selected accounts, regions and contracts; this document does not assert them.

## Email communication and candidate enquiries

Contact and Portfolio Access submissions are sent to the configured owner address. Comment submissions may send a moderation notification. A successful form response indicates that the configured application workflow accepted the submission; it does not create a marketing subscription.

Do not reuse candidate details for unrelated marketing or disclose private form data through public APIs.

## Cookies and analytics

The implemented application uses local storage for consent/theme preferences but currently sets no cookies for analytics or advertising. An authenticated administrator session uses an HttpOnly session cookie because authentication requires it.

If analytics or another optional browser service is added, it must be gated through `src/lib/consent.ts`, documented on the Cookie page and reflected in this file before release.

## Individual rights and requests

Visitors may request access, correction or deletion of information they submitted using the contact address published in the portfolio. Requests must be verified appropriately before private information is disclosed or deleted. The live privacy notice also directs UK visitors to the Information Commissioner's Office.

## Deletion

Contact the portfolio owner using the published email address and identify the relevant submission. Administrators can remove comments and Portfolio Access records through protected administration tools. Deleting a Portfolio Access record also deletes its related stored files according to the implemented database relationship and route behaviour.

## Policy updates

Update this document, `src/views/legal/PrivacyView.tsx`, the Cookie page and `src/config/legal.ts` when a release changes collected fields, public output, storage providers, retention, cookies, browser storage, authentication data or third-party integrations.

Material visitor-facing changes should be dated and published before or with the feature that requires them.
