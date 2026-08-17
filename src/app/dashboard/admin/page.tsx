"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  Building2Icon,
  ShieldCheckIcon,
  ScrollTextIcon,
  UsersIcon,
  PlusIcon,
  ArrowRightIcon,
  ActivityIcon,
  SlidersHorizontalIcon,
  BarChart3Icon,
  BrainIcon,
} from "lucide-react";

interface AdminStats {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  students: number;
  instructors: number;
  activeSubscriptions: number;
  recentAuditCount: number;
}

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  members?: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = getAuthHeaders();

        const [orgsRes, metricsRes] = await Promise.all([
          fetch("/api/admin/organizations", { headers }),
          fetch("/api/admin/metrics", { headers }),
        ]);

        if (!orgsRes.ok || !metricsRes.ok) throw new Error("Failed to fetch data");

        const orgsData = await orgsRes.json();
        const metricsData = await metricsRes.json();
        const orgList: OrgSummary[] = orgsData.organizations || [];
        setOrgs(orgList);
        setStats(metricsData.metrics);
      } catch {
        setError("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <AdminSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Platform administration and enterprise management
          </p>
        </div>
        <Button render={<Link href="/dashboard/admin/organizations" />}>
          <PlusIcon className="size-4 mr-2" />
          Manage Organizations
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2Icon}
          label="Organizations"
          value={stats?.totalOrganizations ?? 0}
          color="blue"
        />
        <StatCard
          icon={UsersIcon}
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          color="green"
        />
        <StatCard
          icon={UsersIcon}
          label="Active Users"
          value={stats?.activeUsers ?? 0}
          color="purple"
        />
        <StatCard
          icon={UsersIcon}
          label="Students"
          value={stats?.students ?? 0}
          color="green"
        />
        <StatCard
          icon={UsersIcon}
          label="Instructors"
          value={stats?.instructors ?? 0}
          color="blue"
        />
        <StatCard
          icon={ActivityIcon}
          label="Audit Events"
          value={stats?.recentAuditCount ?? 0}
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Manage multi-tenant organizations</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href="/dashboard/admin/organizations">
                  View All
                  <ArrowRightIcon className="size-4 ml-1" />
                </Link>
              }
            />
          </CardHeader>
          <CardContent>
            {orgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2Icon className="size-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-medium">No organizations yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first organization to get started
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  render={
                    <Link href="/dashboard/admin/organizations">
                      <PlusIcon className="size-4 mr-2" />
                      Create Organization
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {orgs.slice(0, 5).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.slug} • {org.members?.length ?? 0} members
                      </p>
                    </div>
                    <Badge variant={org.isActive ? "default" : "secondary"}>
                      {org.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard
                icon={BrainIcon}
                title="AI Configuration"
                description="API keys, routing & 95+ models"
                href="/dashboard/admin/ai-config"
              />
              <QuickActionCard
                icon={Building2Icon}
                title="Organizations"
                description="Create and manage orgs"
                href="/dashboard/admin/organizations"
              />
              <QuickActionCard
                icon={SlidersHorizontalIcon}
                title="Customization"
                description="Curriculum & policies"
                href="/dashboard/admin/customization"
              />
              <QuickActionCard
                icon={ScrollTextIcon}
                title="Audit Logs"
                description="View activity history"
                href="/dashboard/admin/audit"
              />
              <QuickActionCard
                icon={BarChart3Icon}
                title="Analytics"
                description="Platform performance & usage"
                href="/dashboard/admin/analytics"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Building2Icon;
  label: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-500 ring-blue-500/20",
    green: "bg-green-500/10 text-green-500 ring-green-500/20",
    purple: "bg-purple-500/10 text-purple-500 ring-purple-500/20",
    orange: "bg-orange-500/10 text-orange-500 ring-orange-500/20",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-lg ring-1 ${colorMap[color]}`}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: typeof Building2Icon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 shrink-0">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div>
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-3 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}