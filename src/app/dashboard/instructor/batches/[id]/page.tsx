"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  UsersIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  ArrowLeftIcon,
  FileTextIcon,
  RefreshCwIcon,
  UserCheckIcon,
  ClockIcon,
  BookOpenIcon,
  TargetIcon,
  ChevronRightIcon,
} from "lucide-react";

interface BatchDetail {
  id: string;
  name: string;
  description?: string | null;
  course?: { id: string; title: string; slug: string } | null;
  isActive: boolean;
  startDate?: string | null;
  students: {
    student: { id: string; name: string; email: string };
    status: string;
    joinedAt: string;
  }[];
  assignments: {
    id: string;
    title: string;
    type: string;
    _count: { submissions: number };
  }[];
  _count: { students: number };
}

interface BatchAnalytics {
  batchId: string;
  batchName: string;
  totalStudents: number;
  activeStudents: number;
  overallCompletion: number;
  averageScore: number;
  skillDistribution: { level: string; count: number }[];
  topPerformers: { studentId: string; studentName: string; avgScore: number }[];
  needsAttention: { studentId: string; studentName: string; avgScore: number; reason: string }[];
  topicPerformance: { topicId: string; topicName: string; avgScore: number; completionRate: number }[];
}

interface AtRiskStudent {
  studentId: string;
  studentName: string;
  email: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
  lastActive: string | null;
  completionRate: number;
  weakTopics: string[];
  recommendedActions: string[];
}

interface AIIntervention {
  studentId: string;
  studentName: string;
  type: string;
  title: string;
  description: string;
  suggestedActions: string[];
  priority: "low" | "medium" | "high" | "urgent";
}

const riskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-600 ring-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 ring-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 ring-orange-500/20",
  critical: "bg-red-500/10 text-red-600 ring-red-500/20",
};

const skillLevelColors: Record<string, string> = {
  mastered: "bg-green-500",
  strong: "bg-blue-500",
  competent: "bg-yellow-500",
  developing: "bg-orange-500",
  beginner: "bg-red-500",
};

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: batchId } = use(params);
  const { user } = useAuthContext();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [analytics, setAnalytics] = useState<BatchAnalytics | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [interventions, setInterventions] = useState<AIIntervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [generatingInterventions, setGeneratingInterventions] = useState(false);

  async function fetchData() {
    try {
      const headers = getAuthHeaders();

      const [batchRes, analyticsRes, atRiskRes] = await Promise.all([
        fetch(`/api/instructor/batches/${batchId}`, { headers }),
        fetch(`/api/instructor/analytics?batchId=${batchId}`, { headers }),
        fetch(`/api/instructor/at-risk?batchId=${batchId}`, { headers }),
      ]);

      if (!batchRes.ok) {
        if (batchRes.status === 404) throw new Error("Batch not found");
        throw new Error("Failed to fetch batch");
      }

      const batchData = await batchRes.json();
      setBatch(batchData.batch);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }

      if (atRiskRes.ok) {
        const atRiskData = await atRiskRes.json();
        setAtRisk(atRiskData.atRisk || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [batchId]);

  async function handleGenerateInterventions() {
    setGeneratingInterventions(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(
        `/api/instructor/interventions?batchId=${batchId}&generate=true`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setInterventions(data.interventions || []);
      }
    } catch {
      // ignore
    } finally {
      setGeneratingInterventions(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          render={<Link href="/dashboard/instructor/batches" />}
        >
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Batches
        </Button>
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
      </div>
    );
  }

  if (!batch) return null;

  const criticalCount = atRisk.filter((s) => s.riskLevel === "critical").length;
  const highCount = atRisk.filter((s) => s.riskLevel === "high").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/dashboard/instructor/batches" />}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{batch.name}</h1>
            <p className="text-muted-foreground">
              {batch.course?.title || "No course"} &middot;{" "}
              {batch.students.length} students
            </p>
          </div>
        </div>
        <Badge variant={batch.isActive ? "default" : "secondary"}>
          {batch.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <UsersIcon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {analytics?.totalStudents ?? batch.students.length}
                </p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500 ring-1 ring-green-500/20">
                <TrendingUpIcon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {analytics?.averageScore ?? 0}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
                <TargetIcon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {analytics?.overallCompletion ?? 0}%
                </p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ring-1 ${
                  criticalCount > 0
                    ? "bg-red-500/10 text-red-500 ring-red-500/20"
                    : "bg-orange-500/10 text-orange-500 ring-orange-500/20"
                }`}
              >
                <AlertTriangleIcon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {criticalCount + highCount}
                </p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="at-risk">
            At-Risk
            {(criticalCount + highCount) > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {criticalCount + highCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {analytics && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Distribution</CardTitle>
                    <CardDescription>
                      Student proficiency across topics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.skillDistribution.map((item) => (
                        <div key={item.level} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">
                              {item.level}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {item.count} students
                            </span>
                          </div>
                          <Progress
                            value={
                              analytics.totalStudents > 0
                                ? (item.count / analytics.totalStudents) * 100
                                : 0
                            }
                          >
                            <ProgressTrack>
                              <ProgressIndicator
                                className={skillLevelColors[item.level] || ""}
                              />
                            </ProgressTrack>
                          </Progress>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Topic Performance</CardTitle>
                    <CardDescription>
                      Average scores by topic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.topicPerformance.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No topic data available yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topicPerformance.slice(0, 5).map((tp) => (
                          <div key={tp.topicId} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate max-w-[200px]">
                                {tp.topicName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {tp.avgScore}%
                              </span>
                            </div>
                            <Progress value={tp.avgScore}>
                              <ProgressTrack>
                                <ProgressIndicator />
                              </ProgressTrack>
                            </Progress>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>
                      Students with highest scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.topPerformers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No data available yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topPerformers.map((tp, idx) => (
                          <div
                            key={tp.studentId}
                            className="flex items-center gap-3"
                          >
                            <div className="flex size-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {tp.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Avg score: {tp.avgScore}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Needs Attention</CardTitle>
                    <CardDescription>
                      Students who need extra support
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.needsAttention.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All students are doing well
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.needsAttention.map((na) => (
                          <div
                            key={na.studentId}
                            className="flex items-start gap-3 rounded-lg border p-3"
                          >
                            <AlertTriangleIcon className="size-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">
                                {na.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Score: {na.avgScore}% &middot; {na.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="at-risk" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">At-Risk Students</h2>
              <p className="text-sm text-muted-foreground">
                Students who may need intervention
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
            >
              <RefreshCwIcon className="size-4 mr-2" />
              Refresh
            </Button>
          </div>

          {atRisk.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheckIcon className="size-12 text-muted-foreground/30" />
                <p className="mt-4 font-medium">No at-risk students</p>
                <p className="text-sm text-muted-foreground">
                  All students are on track
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {atRisk
                .filter((s) => s.riskLevel !== "low")
                .map((student) => (
                  <Card key={student.studentId}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {student.studentName}
                            </h3>
                            <Badge
                              className={riskColors[student.riskLevel]}
                            >
                              {student.riskLevel}
                            </Badge>
                            <Badge variant="outline">
                              Score: {student.riskScore}/100
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {student.email} &middot; Completion:{" "}
                            {student.completionRate}%
                          </p>
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Risk Factors:
                            </p>
                            <ul className="space-y-1">
                              {student.factors.map((f, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <AlertTriangleIcon className="size-3 text-orange-500 shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {student.weakTopics.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Weak Topics:
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {student.weakTopics.map((t, i) => (
                                  <Badge key={i} variant="secondary">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {student.recommendedActions.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Recommended Actions:
                              </p>
                              <ul className="space-y-1 mt-1">
                                {student.recommendedActions.map((a, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    <ChevronRightIcon className="size-3 text-blue-500 shrink-0" />
                                    {a}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Interventions</h2>
              <p className="text-sm text-muted-foreground">
                AI-generated intervention suggestions
              </p>
            </div>
            <Button
              onClick={handleGenerateInterventions}
              disabled={generatingInterventions}
            >
              <RefreshCwIcon
                className={`size-4 mr-2 ${generatingInterventions ? "animate-spin" : ""}`}
              />
              {generatingInterventions
                ? "Generating..."
                : "Generate Interventions"}
            </Button>
          </div>

          {interventions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileTextIcon className="size-12 text-muted-foreground/30" />
                <p className="mt-4 font-medium">No interventions yet</p>
                <p className="text-sm text-muted-foreground">
                  Click &quot;Generate Interventions&quot; to get AI suggestions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {interventions.map((intervention, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangleIcon
                        className={`size-5 shrink-0 mt-0.5 ${
                          intervention.priority === "urgent"
                            ? "text-red-500"
                            : intervention.priority === "high"
                              ? "text-orange-500"
                              : "text-yellow-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {intervention.title}
                          </h3>
                          <Badge
                            variant={
                              intervention.priority === "urgent"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {intervention.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {intervention.studentName}
                        </p>
                        <p className="text-sm mt-2 whitespace-pre-wrap">
                          {intervention.description}
                        </p>
                        {intervention.suggestedActions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              Suggested Actions:
                            </p>
                            <ul className="space-y-1 mt-1">
                              {intervention.suggestedActions.map((a, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex items-center gap-2"
                                >
                                  <ChevronRightIcon className="size-3 text-blue-500 shrink-0" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                {batch.students.length} students in this batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batch.students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students enrolled yet
                </p>
              ) : (
                <div className="space-y-2">
                  {batch.students.map((s) => (
                    <div
                      key={s.student.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 text-sm font-bold">
                        {(s.student.name || "S")[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {s.student.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.student.email}
                        </p>
                      </div>
                      <Badge variant="outline">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-9" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
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
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}