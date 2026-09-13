export type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PublicComment {
  id: string;
  fullName: string;
  company: string | null;
  body: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AdminComment extends PublicComment {
  status: CommentStatus;
  updatedAt: string;
  reviewedAt: string | null;
}
