import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import AdminUnauthorized from "@/components/admin/AdminUnauthorized";

export const metadata = { title: "Access restricted | Dominic Wokorach" };

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get(ACCESS_COOKIE)?.value);
  return <AdminUnauthorized variant={hasToken ? "forbidden" : "signed-out"} />;
}
