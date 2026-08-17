"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/components/providers/auth-provider";
import {
  SparklesIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  PlayIcon,
  FolderKanbanIcon,
  TrendingUpIcon,
  ClipboardCheckIcon,
  BrainIcon,
  LogOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  UsersIcon,
  Building2Icon,
  ShieldCheckIcon,
  ScrollTextIcon,
  CreditCardIcon,
  KeyIcon,
  SlidersHorizontalIcon,
  BarChart3Icon,
  AwardIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/dashboard/profile", label: "My Profile & Career", icon: UserIcon },
  { href: "/dashboard/playground", label: "Playground", icon: PlayIcon },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/dashboard/progress", label: "Progress", icon: TrendingUpIcon },
  { href: "/dashboard/assessments", label: "Assessments", icon: ClipboardCheckIcon },
  { href: "/dashboard/adaptive", label: "Adaptive", icon: BrainIcon },
];

const instructorNavItems = [
  { href: "/dashboard/instructor", label: "Instructor", icon: GraduationCapIcon },
  { href: "/dashboard/instructor/batches", label: "Batches", icon: UsersIcon },
];

const adminNavItems = [
  { href: "/dashboard/admin", label: "Admin", icon: ShieldCheckIcon },
  { href: "/dashboard/admin/certificates", label: "Certificates", icon: AwardIcon },
  { href: "/dashboard/admin/ai-config", label: "AI Configuration", icon: BrainIcon },
  { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2Icon },
  { href: "/dashboard/admin/customization", label: "Customization", icon: SlidersHorizontalIcon },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/admin/audit", label: "Audit Logs", icon: ScrollTextIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor" || isAdmin;
  const navItems = isAdmin ? adminNavItems : isInstructor ? instructorNavItems : studentNavItems;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <SparklesIcon className="size-5 text-blue-500 shrink-0" />
            <span className="truncate text-sm">CodeCraft</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <SparklesIcon className="size-5 text-blue-500" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("shrink-0", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRightIcon className="size-4" />
          ) : (
            <ChevronLeftIcon className="size-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "justify-start",
                  collapsed && "justify-center px-0"
                )}
                render={<Link href={item.href} />}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="ml-2">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-border p-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg p-2",
            collapsed && "justify-center"
          )}
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || ""}
              </p>
              {isInstructor && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {user?.role === "admin" ? "Admin" : "Instructor"}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOutIcon className="size-4 shrink-0" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}