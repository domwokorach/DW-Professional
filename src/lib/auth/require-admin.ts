import { redirect } from "next/navigation";
import { getSessionAdmin } from "./auth";

/** Server-side guard for admin pages: redirects to /unauthorized rather than rendering. */
export async function requireAdmin() {
  const admin = await getSessionAdmin();
  if (!admin) redirect("/unauthorized");
  return admin;
}
