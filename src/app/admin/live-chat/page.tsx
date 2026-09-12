import AdminLiveChat from "@/components/admin/live-chat/AdminLiveChat";
import { getAdminSession } from "@/lib/admin";

export default async function AdminLiveChatPage() {
  const admin = await getAdminSession();
  return <AdminLiveChat adminName={admin?.name ?? ""} adminEmail={admin?.email ?? ""} />;
}
