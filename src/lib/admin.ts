import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
}

function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Explicit admin role, sourced from Clerk's server-side public metadata
 * (`publicMetadata.role === "admin"`) — never from anything the client
 * sends. ADMIN_EMAILS remains a secondary allowlist so accounts configured
 * before the role existed keep working; either one is sufficient.
 */
function hasAdminRole(user: User): boolean {
  if (user.publicMetadata?.role === "admin") return true;

  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return Boolean(email && allowedAdminEmails().includes(email));
}

function toAdminSession(user: User): AdminSession {
  return {
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? "",
    name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Admin",
  };
}

/**
 * Being signed in with Clerk is not enough — Clerk sign-up is open, so
 * authorization also requires the admin role. Every admin surface (page,
 * layout, and API route) resolves through here or through requireAdminApi
 * rather than trusting the client, per the "no client-side isAdmin boolean"
 * requirement.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (!hasAdminRole(user)) return null;

  return toAdminSession(user);
}

export type AdminAuthResult =
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse };

/**
 * API-route guard that distinguishes "not signed in" (401) from "signed in
 * but not an admin" (403), so admin-only routes never rely on the frontend
 * route guard alone.
 */
export async function requireAdminApi(): Promise<AdminAuthResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (!hasAdminRole(user)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, admin: toAdminSession(user) };
}
