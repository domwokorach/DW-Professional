export const ADMIN_ROLE = "admin";

function parseAdminIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return new Set(raw.split(",").map((id) => id.trim()).filter(Boolean));
}

const ADMIN_IDS = parseAdminIds();

/** An admin is anyone whose Clerk publicMetadata.role is "admin", or whose id is in ADMIN_USER_IDS as a bootstrap allowlist. */
export function isAdminUser(userId: string | null | undefined, role: unknown): boolean {
  if (!userId) return false;
  if (role === ADMIN_ROLE) return true;
  return ADMIN_IDS.has(userId);
}
