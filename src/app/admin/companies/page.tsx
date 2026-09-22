import { getAdminSession } from "@/lib/auth/guard";
import { countCompanyRecords } from "@/lib/companies/search";
import CompaniesImportView from "@/components/admin/companies/CompaniesImportView";

export const metadata = { title: "Companies | Admin" };

export default async function AdminCompaniesPage() {
  const admin = await getAdminSession();
  if (!admin) return null;

  const totalRecords = await countCompanyRecords();

  return <CompaniesImportView initialTotalRecords={totalRecords} />;
}
