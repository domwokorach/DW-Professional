# Production Socket.IO deployment

The portfolio stays on Vercel. Import the repository root `render.yaml` as a Render Blueprint to create the Frankfurt free Web Service, `dw-professional`.

During Blueprint setup, supply `SOCKET_SECRET`, `DATABASE_URL`, and `REDIS_URL`. Use exactly the same server-only `SOCKET_SECRET` as Vercel. Never use `NEXT_PUBLIC_SOCKET_SECRET`. The Blueprint intentionally contains no credentials. Email notifications are optional; the socket server runs without Resend or Clerk keys.

After Render is reachable, set Vercel production `NEXT_PUBLIC_SOCKET_URL=https://dw-professional.onrender.com` and redeploy Vercel, since this public value is bundled at build time. Do not append `/socket.io/`. Local development may override the URL with `http://localhost:4001`.

## Deployment acceptance checks

- Confirm Render runs `npm ci` and `npm run socket:start`, and logs binding to `0.0.0.0` on its injected `PORT`.
- GET `https://dw-professional.onrender.com/`: expect HTTP 200 and `Live chat socket server is running.`
- GET `https://dw-professional.onrender.com/health`: expect HTTP 200 and `{"ok":true,"service":"socket"}`.
- GET `/socket.io/?EIO=4&transport=polling` with origin `https://www.dominicwokorach.me`: expect HTTP 200 and an Engine.IO handshake.
- Open `https://www.dominicwokorach.me/en-gb` as a candidate and `https://www.dominicwokorach.me/en-gb/admin/chat` as an authorized admin in separate browser sessions.
- Confirm both connect to Render, then send messages in both directions and verify delivery and persistence after refresh.
- Interrupt and restore each browser connection. Confirm automatic reconnection and successful messaging afterward.
- Confirm production browser network requests contain no localhost socket URLs.

A Live service status and passing health endpoint do not establish that the database, Redis, shared token secret, or complete chat flow work.

## Deployment verification — 12 September 2026

The live Render service was incorrectly building and starting Next.js and only had PORT configured. It now runs `npm ci` and `npm run socket:start`, with `/health`, production CORS, the verified shared socket secret, the verified production database, and a free private Render Key Value instance for Redis presence.

Production Vercel project: `dw-professional` (the local `.vercel` link targets the separate test project). Its production `NEXT_PUBLIC_SOCKET_URL` now points to `https://dw-professional.onrender.com`, and Vercel has rebuilt the portfolio.

Deployed commits:

- `84b1917`: standalone Render socket configuration, standard Socket.IO transport, runtime tsx dependency, and Blueprint.
- `434516f`: refresh Redis presence every 20 seconds while connected, preventing connected admins from expiring after the 60-second presence TTL.

Verified against production: root and health HTTP 200, Engine.IO handshake, allowed www/apex CORS and rejected localhost, Vercel-issued candidate token accepted by Render, signed admin protocol connection, messages delivered in both directions, database persistence, automatic reconnection followed by successful messages, and sustained presence beyond the 60-second Redis TTL without spurious bot replies. The actual candidate browser widget shows Online, sends a message to an admin protocol test client, and displays its reply. Its socket network requests use the Render hostname.

The isolated deployment checkout passed clean npm installation, socket startup, and TypeScript checking. Unrelated local UI edits were excluded from the deployed commits.

### Remaining acceptance items

- The admin browser currently requires the owner to sign in. Signed admin protocol tests do not replace verification of the authenticated admin dashboard and its Vercel token endpoint.
- The existing live Render service remains in Oregon. Render cannot change an existing service's region. The Blueprint specifies Frankfurt for a replacement service; migrating regions requires a separate service and URL cutover. No existing service was deleted.

Test conversations created by this verification were removed after completion.
