"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "@/components/ui/Button";
import { useLocale } from "@/i18n/LocaleProvider";

interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPPORT" | "SUPER_ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function roleLabel(role: AccountUser["role"]): string {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "SUPPORT") return "Support";
  return "Admin";
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function AccountView({ user: initialUser }: { user: AccountUser }) {
  const [user, setUser] = useState(initialUser);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialUser.name);
  const [avatarUrl, setAvatarUrl] = useState(initialUser.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const { localiseHref } = useLocale();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl: avatarUrl.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Couldn't update your profile.");
        return;
      }
      setUser((prev) => ({ ...prev, name: data.user.name, avatarUrl: data.user.avatarUrl }));
      toast.success("Profile updated.");
      setOpen(false);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold text-white">Account</h1>
      <p className="mt-1 text-sm text-muted">Manage your profile and view your account details.</p>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="px-4 py-2 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Update your display name and profile image.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-url">Avatar image URL</Label>
                  <Input
                    id="avatar-url"
                    type="url"
                    placeholder="https://…"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || !name.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-white">{user.name}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{roleLabel(user.role)}</Badge>
              <Badge variant={user.status === "ACTIVE" ? "default" : "destructive"}>{user.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Account created</dt>
              <dd className="mt-1 text-sm text-white">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Last sign-in</dt>
              <dd className="mt-1 text-sm text-white">{formatDate(user.lastLoginAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            {user.emailVerifiedAt ? (
              <>
                <ShieldCheck className="h-4 w-4 text-accent" /> Email verified
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-yellow-400" /> Email not yet verified
              </>
            )}
          </div>
          <Separator />
          <p className="text-sm text-muted">
            Manage your password, email address, and active devices from{" "}
            <Link href={localiseHref("/admin/settings")} className="font-medium text-accent hover:underline">
              Settings → Security
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
