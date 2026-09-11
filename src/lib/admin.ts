import { auth, clerkClient } from "@clerk/nextjs/server";

function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Being signed in with Clerk is not enough — Clerk sign-up is open, so
 * authorization also requires the account's email to be on the explicit
 * allowlist. Every admin surface (page and API route) calls this rather than
 * trusting the client, per the "no client-side isAdmin boolean" requirement.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const allowed = allowedAdminEmails();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";

  if (!allowed.length || !allowed.includes(email)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  return { userId, email };
}
