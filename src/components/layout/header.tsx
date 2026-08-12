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
} from "lucide-react";
import { type ReactNode } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
  children?: ReactNode;
}

export function Header({ onMenuToggle, children }: HeaderProps) {
  const pathname = usePathname();

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
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuToggle}
      >
        <MenuIcon className="size-4" />
      </Button>

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

      <Button variant="ghost" size="icon-sm" className="relative">
        <BellIcon className="size-4" />
        <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
      </Button>
    </header>
  );
}