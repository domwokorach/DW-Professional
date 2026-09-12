import { auth } from "@clerk/nextjs/server";
import AdminUnauthorized from "@/components/admin/AdminUnauthorized";

export const metadata = { title: "Access restricted | Dominic Wokorach" };

export default async function UnauthorizedPage() {
  const { userId } = await auth();
  return <AdminUnauthorized variant={userId ? "forbidden" : "signed-out"} />;
}
