"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentProfileOnboardingModal } from "@/components/onboarding/student-profile-onboarding-modal";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && (user.role === "instructor" || user.role === "admin")) {
      if (pathname === "/dashboard") {
        if (user.role === "admin") {
          router.replace("/dashboard/admin");
        } else {
          router.replace("/dashboard/instructor");
        }
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="space-y-4">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <StudentProfileOnboardingModal />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Native, 100% Single Dark Container, Zero Secondary Layers) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Single Sidebar Container */}
          <div className="relative w-64 h-full bg-slate-950 border-r border-slate-800 z-10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <Sidebar isMobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
