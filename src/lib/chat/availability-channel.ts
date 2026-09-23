/**
 * Redis pub/sub channel name shared between the Next.js app (which writes
 * `User.availability` from Settings, in its own Vercel process) and the
 * standalone Socket.IO server (which owns the live broadcast to Live Chat
 * and Admin Chat, in its own Render process). Publishing here is how a
 * manual availability change crosses that process boundary without a page
 * refresh.
 */
export const ADMIN_AVAILABILITY_CHANGED_CHANNEL = "admin:availability:changed";
