"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, MessageCircleHeart, Building2, User, Settings, Laptop2, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/animate-ui/components/radix/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/i18n/LocaleProvider";
import { useSignOut } from "@/hooks/use-sign-out";
import { AdminChatProvider, useAdminChatContext } from "@/hooks/use-admin-chat-context";
import AdminChatNotifications from "./AdminChatNotifications";
import type { AdminSession } from "@/lib/auth/guard";

const NAV_ITEMS = [
  { id: "chat", label: "Chat", href: "/admin/chat", icon: MessageSquare },
  { id: "comments", label: "Comments", href: "/admin/comments", icon: MessageCircleHeart },
  { id: "companies", label: "Companies", href: "/admin/companies", icon: Building2 },
  { id: "account", label: "Account", href: "/admin/account", icon: User },
  { id: "settings", label: "Settings", href: "/admin/settings", icon: Settings },
  { id: "devices", label: "Devices", href: "/admin/devices", icon: Laptop2 },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function roleLabel(role: AdminSession["role"]): string {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "SUPPORT") return "Support";
  return "Admin";
}

/** Closes the off-canvas mobile sidebar once a destination is picked, so it never lingers over the newly-navigated page. */
function NavLink({ href, active, tooltip, children }: { href: string; active: boolean; tooltip: string; children: React.ReactNode }) {
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <SidebarMenuButton asChild isActive={active} tooltip={tooltip}>
      <Link href={href} onClick={() => isMobile && setOpenMobile(false)}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}

export default function AdminShell({
  admin,
  sidebarDefaultOpen = true,
  children,
}: {
  admin: AdminSession;
  sidebarDefaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminChatProvider>
      <AdminChatNotifications />
      <AdminShellInner admin={admin} sidebarDefaultOpen={sidebarDefaultOpen}>
        {children}
      </AdminShellInner>
    </AdminChatProvider>
  );
}

function AdminShellInner({
  admin,
  sidebarDefaultOpen = true,
  children,
}: {
  admin: AdminSession;
  sidebarDefaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { conversations } = useAdminChatContext();
  const chatUnreadCount = conversations.reduce((sum, c) => sum + c.unreadByAdmin, 0);
  const pathname = usePathname();
  const { localiseHref } = useLocale();
  const { signOut, signingOut } = useSignOut();

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-3">
          <Link href={localiseHref("/admin/chat")} className="flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta text-sm font-bold text-cta-fg">
              DW
            </span>
            <span className="font-mono text-sm font-semibold text-paper group-data-[collapsible=icon]:hidden">
              Admin Chat
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const href = localiseHref(item.href);
                  const active = pathname === href || pathname?.startsWith(`${href}/`);
                  const Icon = item.icon;
                  const badgeCount = item.id === "chat" ? chatUnreadCount : 0;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <NavLink
                        href={href}
                        active={active}
                        tooltip={badgeCount > 0 ? `${item.label} (${badgeCount} unread)` : item.label}
                      >
                        <Icon />
                        <span className="flex flex-1 items-center justify-between gap-2">
                          {item.label}
                          {badgeCount > 0 ? (
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px] group-data-[collapsible=icon]:hidden"
                            >
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </Badge>
                          ) : null}
                        </span>
                      </NavLink>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-paper/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={admin.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback>{initials(admin.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block truncate text-sm font-medium text-paper">{admin.name}</span>
                  <span className="block truncate text-xs text-muted">{roleLabel(admin.role)}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="truncate text-sm font-medium">{admin.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">{admin.email}</span>
                <Badge variant="secondary" className="w-fit text-[10px]">
                  {roleLabel(admin.role)}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={localiseHref("/admin/account")}>
                  <User /> Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={localiseHref("/admin/settings")}>
                  <Settings /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={localiseHref("/admin/devices")}>
                  <Laptop2 /> Devices
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                disabled={signingOut}
                onSelect={() => void signOut()}
              >
                <LogOut /> {signingOut ? "Signing out…" : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-dvh">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 md:hidden">
          <SidebarTrigger />
          <span className="font-mono text-sm font-semibold text-paper">Admin Chat</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
