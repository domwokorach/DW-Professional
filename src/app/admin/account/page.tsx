import { getAdminSession } from "@/lib/auth/guard";
import { db } from "@/lib/database/db";
import AccountView from "@/components/admin/account/AccountView";

export const metadata = { title: "Account | Admin" };

export default async function AdminAccountPage() {
  const admin = await getAdminSession();
  if (!admin) return null;

  const user = await db.user.findUnique({ where: { id: admin.userId } });
  if (!user) return null;

  return (
    <AccountView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      }}
    />
  );
}
