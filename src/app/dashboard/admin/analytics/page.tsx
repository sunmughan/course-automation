"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  Building2Icon,
  UsersIcon,
  GraduationCapIcon,
  BookOpenIcon,
  BrainIcon,
  ShieldCheckIcon,
  ActivityIcon,
  DollarSignIcon,
  ClockIcon,
} from "lucide-react";

interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

interface OrgOverview {
  members: number;
  instructors: number;
  students: number;
  activeUsers: number;
  completionRate: number;
  teams: number;
  departments: number;
  curriculums: number;
  aiModels: number;
  policies: number;
}

interface OrgAIAnalytics {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatency: number;
  fallbackRate: number;
  requestsByProvider: Record<string, number>;
  requestsByMode: Record<string, number>;
}

interface ActivityPoint {
  date: string;
  count: number;
}

export default function AnalyticsPage() {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<OrgOverview | null>(null);
  const [ai, setAi] = useState<OrgAIAnalytics | null>(null);
  const [timeline, setTimeline] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const headers = getAuthHeaders();
        const res = await fetch("/api/admin/organizations", { headers });
        if (!res.ok) throw new Error("Failed to fetch organizations");
        const data = await res.json();
        const list = data.organizations || [];
        setOrgs(list);
        if (list.length > 0) {
          setOrgId((currentOrgId) => currentOrgId || list[0].id);
        }
      } catch {
        setError("Failed to load organizations");
      } finally {
        setOrgsLoading(false);
      }
    }
    void fetchOrgs();
  }, []);

  useEffect(() => {
    if (!orgId) return;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const [overviewRes, aiRes, timelineRes] = await Promise.all([
          fetch(`/api/admin/analytics?organizationId=${orgId}&view=overview`, { headers }),
          fetch(`/api/admin/analytics?organizationId=${orgId}&view=ai`, { headers }),
          fetch(`/api/admin/analytics?organizationId=${orgId}&view=timeline&days=30`, { headers }),
        ]);

        if (overviewRes.ok) {
          const d = await overviewRes.json();
          setOverview(d.overview || null);
        }
        if (aiRes.ok) {
          const d = await aiRes.json();
          setAi(d.ai || null);
        }
        if (timelineRes.ok) {
          const d = await timelineRes.json();
          setTimeline(d.timeline || []);
        }
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    void fetchAnalytics();
  }, [orgId]);

  if (orgsLoading) return <AnalyticsSkeleton />;

  if (error && orgs.length === 0) {
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

  if (orgs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2Icon className="size-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium">No organizations yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an organization first to view analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Analytics</h1>
        <p className="text-muted-foreground">
          Usage and activity insights across your organizations
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium shrink-0">Organization</label>
        <Select value={orgId} onValueChange={(v) => setOrgId(v ?? "")}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orgs.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <ActivityIcon className="size-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai">
            <BrainIcon className="size-4 mr-1" />
            AI Usage
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <ClockIcon className="size-4 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : !overview ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Members"
                value={overview.members}
                icon={<UsersIcon className="size-5" />}
              />
              <StatCard
                label="Students"
                value={overview.students}
                icon={<GraduationCapIcon className="size-5" />}
              />
              <StatCard
                label="Instructors"
                value={overview.instructors}
                icon={<UsersIcon className="size-5" />}
              />
              <StatCard
                label="Active Users"
                value={overview.activeUsers}
                icon={<ActivityIcon className="size-5" />}
              />
              <StatCard
                label="Completion Rate"
                value={`${overview.completionRate}%`}
                icon={<GraduationCapIcon className="size-5" />}
              />
              <StatCard
                label="Teams"
                value={overview.teams}
                icon={<Building2Icon className="size-5" />}
              />
              <StatCard
                label="Departments"
                value={overview.departments}
                icon={<Building2Icon className="size-5" />}
              />
              <StatCard
                label="Curriculums"
                value={overview.curriculums}
                icon={<BookOpenIcon className="size-5" />}
              />
              <StatCard
                label="AI Models"
                value={overview.aiModels}
                icon={<BrainIcon className="size-5" />}
              />
              <StatCard
                label="Policies"
                value={overview.policies}
                icon={<ShieldCheckIcon className="size-5" />}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : !ai ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Total Requests"
                  value={ai.totalRequests}
                  icon={<ActivityIcon className="size-5" />}
                />
                <StatCard
                  label="Total Tokens"
                  value={formatNumber(ai.totalInputTokens + ai.totalOutputTokens)}
                  icon={<BrainIcon className="size-5" />}
                />
                <StatCard
                  label="Total Cost"
                  value={`$${ai.totalCost.toFixed(2)}`}
                  icon={<DollarSignIcon className="size-5" />}
                />
                <StatCard
                  label="Avg Latency"
                  value={`${ai.avgLatency.toFixed(0)}ms`}
                  icon={<ClockIcon className="size-5" />}
                />
                <StatCard
                  label="Fallback Rate"
                  value={`${(ai.fallbackRate * 100).toFixed(1)}%`}
                  icon={<ActivityIcon className="size-5" />}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Requests by Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DistributionList data={ai.requestsByProvider} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Requests by Mode</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DistributionList data={ai.requestsByMode} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <EmptyState />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>30-Day Activity</CardTitle>
                <CardDescription>
                  Analytics events recorded per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeline.map((point) => (
                    <div key={point.date} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs text-muted-foreground">
                        {point.date}
                      </span>
                      <div className="flex-1">
                        <div className="flex h-6 items-center rounded bg-muted/50">
                          <div
                            className="h-6 rounded bg-blue-500/70"
                            style={{
                              width: `${timelineMax(timeline) === 0 ? 0 : (point.count / timelineMax(timeline)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm font-medium">
                        {point.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DistributionList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No data</p>;
  }
  const total = entries.reduce((sum, [, v]) => sum + v, 0) || 1;
  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{key}</span>
            <span className="text-sm text-muted-foreground">
              {value} ({((value / total) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 rounded bg-muted/50">
            <div
              className="h-2 rounded bg-violet-500/70"
              style={{ width: `${(value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <ActivityIcon className="size-16 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-medium">No data available</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Analytics will appear as your organization becomes active
        </p>
      </CardContent>
    </Card>
  );
}

function timelineMax(points: ActivityPoint[]): number {
  return points.reduce((max, p) => Math.max(max, p.count), 0);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <Skeleton className="h-8 w-[260px]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
