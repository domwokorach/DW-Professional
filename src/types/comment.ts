export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PublicComment {
  id: string;
  fullName: string;
  company: string | null;
  companyDomain: string | null;
  companyLogo: string | null;
  companyIndustry: string | null;
  companyLocation: string | null;
  body: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AdminComment extends PublicComment {
  companyId: string | null;
  status: CommentStatus;
  updatedAt: string;
  reviewedAt: string | null;
}
