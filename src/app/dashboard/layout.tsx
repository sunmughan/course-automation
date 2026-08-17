"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-60 p-0 border-0 bg-slate-950 shadow-2xl h-full min-h-screen overflow-hidden"
        >
          <Sidebar isMobile onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
