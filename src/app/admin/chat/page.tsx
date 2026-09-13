import AdminChat from "@/components/chat/AdminChat";
import { getAdminSession } from "@/lib/auth/guard";

export default async function AdminChatPage() {
  const admin = await getAdminSession();
  return <AdminChat adminId={admin?.userId ?? ""} adminName={admin?.name ?? ""} adminEmail={admin?.email ?? ""} />;
}
