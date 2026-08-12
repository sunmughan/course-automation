"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  UsersIcon,
  BookOpenIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  PlusIcon,
  GraduationCapIcon,
  ClockIcon,
  FileTextIcon,
  ActivityIcon,
} from "lucide-react";

interface InstructorStats {
  totalBatches: number;
  totalStudents: number;
  activeStudents: number;
  atRiskStudents: number;
  averageCompletion: number;
  interventionsActive: number;
}

interface BatchSummary {
  id: string;
  name: string;
  course?: { id: string; title: string } | null;
  _count: { students: number; assignments: number };
  isActive: boolean;
  createdAt: string;
}

export default function InstructorDashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = getAuthHeaders();

        const batchesRes = await fetch("/api/instructor/batches", { headers });
        if (!batchesRes.ok) throw new Error("Failed to fetch batches");
        const batchesData = await batchesRes.json();
        const batchList: BatchSummary[] = batchesData.batches || [];
        setBatches(batchList);

        let totalAtRisk = 0;
        for (const batch of batchList) {
          try {
            const riskRes = await fetch(
              `/api/instructor/at-risk?batchId=${batch.id}`,
              { headers }
            );
            if (riskRes.ok) {
              const riskData = await riskRes.json();
              const atRisk = riskData.atRisk || [];
              totalAtRisk += atRisk.filter(
                (s: { riskLevel: string }) => s.riskLevel !== "low"
              ).length;
            }
          } catch {
            // skip individual batch errors
          }
        }
        setAtRiskCount(totalAtRisk);

        setStats({
          totalBatches: batchList.length,
          totalStudents: batchList.reduce(
            (sum, b) => sum + b._count.students,
            0
          ),
          activeStudents: batchList.reduce(
            (sum, b) => sum + (b.isActive ? b._count.students : 0),
            0
          ),
          atRiskStudents: totalAtRisk,
          averageCompletion: 0,
          interventionsActive: 0,
        });
      } catch {
        setError("Failed to load instructor dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <InstructorSkeleton />;

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
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "Instructor"}
          </p>
        </div>
        <Button render={<Link href="/dashboard/instructor/batches" />}>
          <PlusIcon className="size-4 mr-2" />
          Manage Batches
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={UsersIcon}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          color="blue"
        />
        <StatCard
          icon={BookOpenIcon}
          label="Active Batches"
          value={stats?.totalBatches ?? 0}
          color="green"
        />
        <StatCard
          icon={AlertTriangleIcon}
          label="At-Risk Students"
          value={stats?.atRiskStudents ?? 0}
          color="orange"
        />
        <StatCard
          icon={ActivityIcon}
          label="Active Students"
          value={stats?.activeStudents ?? 0}
          color="purple"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Avg. Completion"
          value={`${stats?.averageCompletion ?? 0}%`}
          color="green"
        />
        <StatCard
          icon={FileTextIcon}
          label="Active Interventions"
          value={stats?.interventionsActive ?? 0}
          color="blue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Batches</CardTitle>
              <CardDescription>Manage your student groups</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/instructor/batches" />}
            >
              View All
              <ArrowRightIcon className="size-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <GraduationCapIcon className="size-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-medium">No batches yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first batch to start managing students
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  render={<Link href="/dashboard/instructor/batches" />}
                >
                  <PlusIcon className="size-4 mr-2" />
                  Create Batch
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {batches.slice(0, 5).map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{batch.name}</p>
                        <Badge
                          variant={batch.isActive ? "default" : "secondary"}
                        >
                          {batch.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {batch.course?.title || "No course"} &middot;{" "}
                        {batch._count.students} students &middot;{" "}
                        {batch._count.assignments} assignments
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link
                          href={`/dashboard/instructor/batches/${batch.id}`}
                        />
                      }
                    >
                      <ArrowRightIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common instructor tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard
                icon={PlusIcon}
                title="Create Batch"
                description="Start a new student group"
                href="/dashboard/instructor/batches"
              />
              <QuickActionCard
                icon={UsersIcon}
                title="View Students"
                description="Manage enrollments"
                href="/dashboard/instructor/batches"
              />
              <QuickActionCard
                icon={AlertTriangleIcon}
                title="At-Risk Report"
                description="Check struggling students"
                href="/dashboard/instructor/batches"
              />
              <QuickActionCard
                icon={FileTextIcon}
                title="Generate Report"
                description="Create teaching reports"
                href="/dashboard/instructor/batches"
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
  icon: typeof UsersIcon;
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
  icon: typeof PlusIcon;
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

function InstructorSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
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
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}