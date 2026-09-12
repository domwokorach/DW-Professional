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

## Local verification performed

A clean temporary repository copy passed `npm ci` and `npm run socket:start` in production mode with a disposable test secret. Verified injected PORT precedence, public binding, root and health responses, polling handshake, production CORS, authenticated candidate/admin WebSocket connections, automatic reconnection, and invalid-token rejection. Database and Redis were not exercised in this smoke check. The production health request timed out; deployment, production secrets, Vercel configuration, and bidirectional persisted messaging remain unverified.
