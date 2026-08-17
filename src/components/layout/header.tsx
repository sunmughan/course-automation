"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MenuIcon,
  BellIcon,
  ChevronRightIcon,
  HomeIcon,
  XIcon,
  BookOpenIcon,
  AwardIcon,
  SparklesIcon,
} from "lucide-react";
import { type ReactNode, useState, useRef, useEffect } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
  children?: ReactNode;
}

const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    icon: BookOpenIcon,
    title: "New Course Available",
    description: "Complete Node.js Backend Mastery with 110 chapters is now live!",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    icon: AwardIcon,
    title: "Achievement Unlocked",
    description: "You completed your first lesson. Keep learning!",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    icon: SparklesIcon,
    title: "AI Tutor Ready",
    description: "Your AI tutor is available to help you learn faster.",
    time: "3 hours ago",
    read: true,
  },
];

export function Header({ onMenuToggle, children }: HeaderProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { href, label };
  });

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <div className="flex items-center gap-2.5 lg:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onMenuToggle}
          className="text-slate-300 hover:text-white cursor-pointer"
        >
          <MenuIcon className="size-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-1.5 font-bold">
          <span className="flex size-6 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-xs shadow-sm">
            ⚡
          </span>
          <span className="text-sm font-extrabold text-white font-mono tracking-tight">
            CodeCraft<span className="text-sky-400">.ai</span>
          </span>
        </Link>
      </div>

      <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <HomeIcon className="size-3.5" />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3.5" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      {children}

      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </Button>

        {showNotifications && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0",
                        !notif.read && "bg-primary/5"
                      )}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notif.id ? { ...n, read: true } : n
                          )
                        )
                      }
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={cn(
                          "rounded-full p-1.5",
                          !notif.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="size-3.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notif.read ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">{notif.time}</p>
                      </div>
                      {!notif.read && (
                        <div className="mt-1.5 shrink-0">
                          <div className="size-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}