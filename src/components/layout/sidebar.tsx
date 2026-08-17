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
  X,
  UserIcon,
} from "lucide-react";
import { useState } from "react";

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpenIcon },
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

export function Sidebar({ onClose, isMobile }: { onClose?: () => void; isMobile?: boolean }) {
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
        "flex flex-col border-r border-slate-800 bg-slate-950 h-full min-h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-3 bg-slate-950 shrink-0">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center">
            <span className="text-base font-extrabold text-white font-mono tracking-tight">CodeCraft</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto text-sky-400 font-extrabold font-mono text-sm">
            CC
          </Link>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-white cursor-pointer"
            title="Close Menu"
          >
            <X className="size-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("shrink-0 text-slate-400 hover:text-white cursor-pointer", collapsed && "mx-auto")}
          >
            {collapsed ? (
              <ChevronRightIcon className="size-4" />
            ) : (
              <ChevronLeftIcon className="size-4" />
            )}
          </Button>
        )}
      </div>

      {/* Main Nav ScrollArea */}
      <ScrollArea className="flex-1 bg-slate-950">
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
                  "justify-start text-xs font-medium cursor-pointer",
                  isActive ? "bg-sky-600/20 text-sky-300 font-bold border border-sky-500/30" : "text-slate-400 hover:text-white hover:bg-slate-900",
                  collapsed && "justify-center px-0"
                )}
                render={<Link href={item.href} onClick={() => { if (isMobile && onClose) onClose(); }} />}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="ml-2">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section: Normal My Profile + Normal User Info (No Pills, No Boxes) */}
      <div className="border-t border-slate-800 p-2 bg-slate-950 space-y-1 shrink-0">
        {/* Normal My Profile Item */}
        <Button
          variant={pathname === "/dashboard/profile" ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-xs font-medium cursor-pointer",
            pathname === "/dashboard/profile" ? "bg-sky-600/20 text-sky-300 font-bold" : "text-slate-400 hover:text-white hover:bg-slate-900",
            collapsed && "justify-center px-0"
          )}
          render={<Link href="/dashboard/profile" onClick={() => { if (isMobile && onClose) onClose(); }} />}
        >
          <UserIcon className="size-4 shrink-0 text-sky-400" />
          {!collapsed && <span className="ml-2">My Profile</span>}
        </Button>

        {/* Normal Demo Student User Display */}
        <div
          className={cn(
            "flex items-center gap-2 p-1.5",
            collapsed && "justify-center"
          )}
        >
          <Avatar size="sm" className="border border-slate-750 shrink-0">
            <AvatarFallback className="bg-sky-950 text-sky-300 font-bold text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 truncate min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {user?.name || "Demo Student"}
              </p>
              <p className="truncate text-[10px] text-slate-400 font-mono">
                {user?.email || "student@example.com"}
              </p>
            </div>
          )}
        </div>

        {/* Normal Logout Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer h-8",
            collapsed && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOutIcon className="size-3.5 shrink-0" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
