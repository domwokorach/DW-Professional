import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database/db";
import { requireAdminApi } from "@/lib/auth/guard";
import type { CommentStatus } from "@prisma/client";
import type { AdminComment } from "@/types/comment";

export const runtime = "nodejs";

const STATUSES: CommentStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function toAdminComment(row: {
  id: string;
  fullName: string;
  company: string | null;
  companyId: string | null;
  companyDomain: string | null;
  companyLogo: string | null;
  companyIndustry: string | null;
  companyLocation: string | null;
  body: string;
  avatarUrl: string | null;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
}): AdminComment {
  return {
    id: row.id,
    fullName: row.fullName,
    company: row.company,
    companyId: row.companyId,
    companyDomain: row.companyDomain,
    companyLogo: row.companyLogo,
    companyIndustry: row.companyIndustry,
    companyLocation: row.companyLocation,
    body: row.body,
    avatarUrl: row.avatarUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  const result = await requireAdminApi();
  if (!result.ok) return result.response;

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = STATUSES.includes(statusParam as CommentStatus) ? (statusParam as CommentStatus) : undefined;

  const comments = await db.comment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ comments: comments.map(toAdminComment) });
}
