"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Preferences } from "./SettingsView";

type Availability = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";

const AVAILABILITY_OPTIONS: { value: Availability; label: string; dot: string }[] = [
  { value: "ONLINE", label: "Online", dot: "bg-emerald-400" },
  { value: "AWAY", label: "Away", dot: "bg-yellow-400" },
  { value: "BUSY", label: "Busy", dot: "bg-red-400" },
  { value: "OFFLINE", label: "Offline", dot: "bg-paper/30" },
];

export default function ChatSettingsTab({
  initialAvailability,
  initialPreferences,
}: {
  initialAvailability: Availability;
  initialPreferences: Preferences;
}) {
  const [availability, setAvailability] = useState<Availability>(initialAvailability);
  const [notifications, setNotifications] = useState(initialPreferences.notifications);
  const [saving, setSaving] = useState(false);

  async function persist(next: { availability?: Availability; notifications?: typeof notifications }) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) toast.error("Couldn't save your preference.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(key: keyof typeof notifications, value: boolean) {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    void persist({ notifications: next });
  }

  function changeAvailability(value: Availability) {
    setAvailability(value);
    void persist({ availability: value });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>Shown to you across the admin dashboard while you triage conversations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={availability} onValueChange={(v) => changeAvailability(v as Availability)} disabled={saving}>
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} /> {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you&rsquo;re notified about live chat activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-new-message">New message notifications</Label>
              <p className="text-xs text-muted">Get notified when a visitor sends a new message.</p>
            </div>
            <Switch
              id="notif-new-message"
              checked={notifications.newMessage}
              onCheckedChange={(v) => toggleNotification("newMessage", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-sound">Sound notifications</Label>
              <p className="text-xs text-muted">Play a sound for new conversations and messages.</p>
            </div>
            <Switch
              id="notif-sound"
              checked={notifications.sound}
              onCheckedChange={(v) => toggleNotification("sound", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-browser">Browser notifications</Label>
              <p className="text-xs text-muted">Show a system notification when this tab isn&rsquo;t focused.</p>
            </div>
            <Switch
              id="notif-browser"
              checked={notifications.browserPush}
              onCheckedChange={(v) => toggleNotification("browserPush", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
