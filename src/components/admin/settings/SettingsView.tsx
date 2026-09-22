"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettingsTab from "./GeneralSettingsTab";
import ChatSettingsTab from "./ChatSettingsTab";
import SecuritySettingsTab from "./SecuritySettingsTab";

export interface Preferences {
  theme: "light" | "dark" | "system";
  language: string;
  timeZone: string;
  notifications: { newMessage: boolean; sound: boolean; browserPush: boolean };
}

export default function SettingsView({
  name,
  email,
  availability,
  preferences,
}: {
  name: string;
  email: string;
  availability: "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
  preferences: Preferences;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold text-paper">Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage your workspace preferences and account security.</p>

      <Tabs defaultValue="general" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsTab initialName={name} initialPreferences={preferences} />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <ChatSettingsTab initialAvailability={availability} initialPreferences={preferences} />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettingsTab email={email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
