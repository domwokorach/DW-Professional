"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Laptop, Smartphone, Tablet, Monitor, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

interface DeviceSession {
  id: string;
  deviceName: string;
  deviceType: string;
  operatingSystem: string;
  browser: string;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

function deviceIcon(deviceType: string) {
  const type = deviceType.toLowerCase();
  if (type === "mobile") return Smartphone;
  if (type === "tablet") return Tablet;
  if (type === "desktop") return Monitor;
  return Laptop;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DevicesView() {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      setSessions(res.ok ? data.sessions : []);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't sign out that device.");
        return;
      }
      toast.success("Device signed out.");
      setSessions((prev) => prev?.filter((s) => s.id !== sessionId) ?? null);
      const wasCurrent = sessions?.find((s) => s.id === sessionId)?.isCurrent;
      if (wasCurrent) window.location.reload();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeOthers() {
    setRevokingOthers(true);
    try {
      const res = await fetch("/api/auth/sessions/revoke-others", { method: "POST" });
      if (!res.ok) {
        toast.error("Couldn't sign out other devices.");
        return;
      }
      toast.success("Every other device has been signed out.");
      await load();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRevokingOthers(false);
    }
  }

  const otherSessionsCount = sessions?.filter((s) => !s.isCurrent).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Devices</h1>
          <p className="mt-1 text-sm text-muted">Manage every device currently signed in to your account.</p>
        </div>

        {otherSessionsCount > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="px-4 py-2 text-xs" disabled={revokingOthers}>
                Sign out all other devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out {otherSessionsCount} other device{otherSessionsCount === 1 ? "" : "s"}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every device except this one will be signed out immediately.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevokeOthers}>Sign out other devices</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {sessions === null ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted">No active devices found.</CardContent>
          </Card>
        ) : (
          sessions.map((session) => {
            const Icon = deviceIcon(session.deviceType);
            return (
              <Card key={session.id}>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{session.deviceName}</p>
                        {session.isCurrent ? <Badge variant="secondary">This device</Badge> : null}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {session.operatingSystem} · {session.browser}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Last active: {relativeTime(session.lastActiveAt)}
                        {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    className="shrink-0 px-3 py-2 text-xs text-red-400 hover:text-red-300"
                    disabled={revokingId === session.id}
                    onClick={() => void handleRevoke(session.id)}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {session.isCurrent ? "Sign out" : "Sign out device"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
