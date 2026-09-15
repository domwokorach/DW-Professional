import type { PublicComment } from "@/types/comment";

export function toPublicComment(row: {
  id: string;
  fullName: string;
  company: string | null;
  companyDomain: string | null;
  companyLogo: string | null;
  companyIndustry: string | null;
  companyLocation: string | null;
  body: string;
  avatarUrl: string | null;
  createdAt: Date;
}): PublicComment {
  return {
    id: row.id,
    fullName: row.fullName,
    company: row.company,
    companyDomain: row.companyDomain,
    companyLogo: row.companyLogo,
    companyIndustry: row.companyIndustry,
    companyLocation: row.companyLocation,
    body: row.body,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}
