import { getAdminSession } from "@/lib/auth/guard";
import { db } from "@/lib/database/db";
import SettingsView from "@/components/admin/settings/SettingsView";

export const metadata = { title: "Settings | Admin" };

const DEFAULT_PREFERENCES = {
  theme: "system" as const,
  language: "en-GB",
  timeZone: "Europe/London",
  notifications: { newMessage: true, sound: true, browserPush: false },
};

export default async function AdminSettingsPage() {
  const admin = await getAdminSession();
  if (!admin) return null;

  const user = await db.user.findUnique({ where: { id: admin.userId } });
  if (!user) return null;

  const preferences = { ...DEFAULT_PREFERENCES, ...(user.preferences as object) };

  return (
    <SettingsView
      name={user.name}
      email={user.email}
      availability={user.availability}
      preferences={preferences}
    />
  );
}
