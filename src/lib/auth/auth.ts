import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminUser } from "./permissions";

export async function getSessionAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
  if (!isAdminUser(userId, role)) return null;

  const user = await currentUser();
  return {
    id: userId,
    name: user?.fullName ?? user?.username ?? "Admin",
    email: user?.primaryEmailAddress?.emailAddress,
    imageUrl: user?.imageUrl,
  };
}
