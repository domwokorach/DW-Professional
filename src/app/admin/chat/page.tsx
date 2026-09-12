import AdminChat from "@/components/chat/AdminChat";
import { getAdminSession } from "@/lib/admin";

export default async function AdminChatPage() {
  const admin = await getAdminSession();
  return <AdminChat adminName={admin?.name ?? ""} adminEmail={admin?.email ?? ""} />;
}
