"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Laptop2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { useLocale } from "@/i18n/LocaleProvider";
import { useSignOut } from "@/hooks/use-sign-out";

interface SecurityEvent {
  id: string;
  type: string;
  ipAddress: string | null;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  SIGN_IN: "Signed in",
  SIGN_OUT: "Signed out",
  FAILED_SIGN_IN: "Failed sign-in attempt",
  PASSWORD_CHANGED: "Password changed",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET_COMPLETED: "Password reset completed",
  EMAIL_CHANGE_REQUESTED: "Email change requested",
  EMAIL_CHANGED: "Email address changed",
  SESSION_REVOKED: "Session revoked",
  ACCOUNT_LOCKED: "Account locked",
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-white"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Couldn't change your password.");
        return;
      }
      toast.success("Password changed. Other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Changing your password signs out every other active session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New password (min. 10 characters, mixed case, number, symbol)"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <Button type="submit" disabled={submitting || !currentPassword || newPassword.length < 10}>
            {submitting ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangeEmailCard({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Couldn't request an email change.");
        return;
      }
      toast.success(data.message ?? "Verification link sent.");
      setPending(newEmail);
      setCurrentPassword("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change email</CardTitle>
        <CardDescription>Current address: {email}</CardDescription>
      </CardHeader>
      <CardContent>
        {pending ? (
          <p className="text-sm text-muted">
            A verification link was sent to <span className="text-white">{pending}</span>. Your email won&rsquo;t
            change until you confirm it there.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordField
              id="email-current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <div className="space-y-2">
              <Label htmlFor="new-email">New email address</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting || !currentPassword || !newEmail}>
              {submitting ? "Sending…" : "Send verification link"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveDevicesCard() {
  const { localiseHref } = useLocale();
  const { signOut } = useSignOut();
  const [revoking, setRevoking] = useState(false);

  async function handleRevokeOthers() {
    setRevoking(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-others", { method: "POST" });
      if (!res.ok) {
        toast.error("Couldn't sign out other devices.");
        return;
      }
      toast.success("Every other device has been signed out.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active devices</CardTitle>
        <CardDescription>Review every device signed in to your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={localiseHref("/admin/devices")}
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          <Laptop2 className="h-4 w-4" /> View all devices
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" className="px-4 py-2 text-xs" disabled={revoking}>
              Sign out other devices
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out every other device?</AlertDialogTitle>
              <AlertDialogDescription>
                This immediately revokes every session except the one you&rsquo;re using right now. Anyone using
                another signed-in device will need to sign in again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevokeOthers}>Sign out other devices</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      <CardContent className="pt-0">
        <Separator className="mb-4" />
        <Button variant="ghost" className="px-0 text-xs text-red-400 hover:text-red-300" onClick={() => void signOut()}>
          Sign out this device
        </Button>
      </CardContent>
    </Card>
  );
}

function RecentActivityCard() {
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/security-events")
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => {
        if (!cancelled) setEvents(data.events ?? []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent security activity</CardTitle>
        <CardDescription>The last 20 security-relevant events on your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {events === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-white">{EVENT_LABELS[event.type] ?? event.type}</span>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(event.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  {event.ipAddress ? ` · ${event.ipAddress}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function SecuritySettingsTab({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      <ChangePasswordCard />
      <ChangeEmailCard email={email} />
      <ActiveDevicesCard />
      <RecentActivityCard />
    </div>
  );
}
