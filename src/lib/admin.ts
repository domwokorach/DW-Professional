import { auth, clerkClient } from "@clerk/nextjs/server";

export interface AdminSession {
  userId: string;
  email: string;
}

function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function resolveClerkSession(): Promise<{ userId: string | null; email: string | null }> {
  const { userId } = await auth();
  if (!userId) return { userId: null, email: null };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  return { userId, email };
}

/**
 * Being signed in with Clerk is not enough — Clerk sign-up is open, so
 * authorization also requires the account's email to be on the explicit
 * allowlist. Every admin surface (page and API route) resolves through this
 * rather than trusting the client, per the "no client-side isAdmin boolean"
 * requirement.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { userId, email } = await resolveClerkSession();
  if (!userId || !email) return null;
  if (!allowedAdminEmails().includes(email)) return null;
  return { userId, email };
}
