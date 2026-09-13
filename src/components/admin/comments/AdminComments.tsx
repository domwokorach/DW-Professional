"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Button from "@/components/ui/Button";
import type { AdminComment, CommentStatus } from "@/types/comment";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const STATUS_BADGE: Record<CommentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "secondary" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminComments() {
  const [filter, setFilter] = useState<CommentStatus | "ALL">("PENDING");
  const [comments, setComments] = useState<AdminComment[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: CommentStatus | "ALL") => {
    setComments(null);
    try {
      const query = status === "ALL" ? "" : `?status=${status}`;
      const res = await fetch(`/api/admin/comments${query}`);
      const data = await res.json();
      setComments(res.ok ? data.comments : []);
    } catch {
      setComments([]);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  async function moderate(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error("Couldn't update that comment.");
        return;
      }
      toast.success(status === "APPROVED" ? "Comment approved." : "Comment rejected.");
      setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete that comment.");
        return;
      }
      toast.success("Comment deleted.");
      setComments((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold text-white">Comments</h1>
      <p className="mt-1 text-sm text-muted">Review, approve, reject, or delete submitted testimonials.</p>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as CommentStatus | "ALL")} className="mt-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-3">
        {comments === null ? (
          <>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted">No comments here.</CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0 border border-line">
                    <AvatarImage src={comment.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="bg-ink text-white">{initials(comment.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{comment.fullName}</p>
                      <Badge variant={STATUS_BADGE[comment.status].variant}>
                        {STATUS_BADGE[comment.status].label}
                      </Badge>
                    </div>
                    {comment.company ? <p className="mt-0.5 text-sm text-muted">{comment.company}</p> : null}
                    <p className="mt-2 text-sm leading-relaxed text-white">{comment.body}</p>
                    <p className="mt-2 text-xs text-muted">Submitted {formatDate(comment.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {comment.status !== "APPROVED" ? (
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={busyId === comment.id}
                      onClick={() => void moderate(comment.id, "APPROVED")}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  ) : null}
                  {comment.status !== "REJECTED" ? (
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={busyId === comment.id}
                      onClick={() => void moderate(comment.id, "REJECTED")}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  ) : null}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300"
                        disabled={busyId === comment.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes {comment.fullName}&rsquo;s comment and its avatar image. This
                          can&rsquo;t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void remove(comment.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
