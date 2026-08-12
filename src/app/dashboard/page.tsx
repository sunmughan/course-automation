"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/providers/auth-provider";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FlameIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  Code2Icon,
  ServerIcon,
  BrainIcon,
  BarChart3Icon,
  SmartphoneIcon,
} from "lucide-react";

interface DashboardStats {
  coursesEnrolled: number;
  topicsCompleted: number;
  codingHours: number;
  streak: number;
}

interface CourseProgress {
  id: string;
  title: string;
  stream: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  isEnrolled: boolean;
}

interface SkillData {
  name: string;
  icon: typeof Code2Icon;
  score: number;
  status: string;
}

interface RecentActivity {
  id: string;
  lessonTitle: string;
  topicTitle: string;
  status: string;
  updatedAt: string;
}

const skillIcons: Record<string, typeof Code2Icon> = {
  frontend: Code2Icon,
  backend: ServerIcon,
  ai: BrainIcon,
  "data-science": BarChart3Icon,
  mobile: SmartphoneIcon,
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const headers = getAuthHeaders();

        const [coursesRes, progressRes] = await Promise.all([
          fetch("/api/courses", { headers }),
          fetch("/api/progress", { headers }),
        ]);

        if (!coursesRes.ok || !progressRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const coursesData = await coursesRes.json();
        const progressData = await progressRes.json();

        const enrolledCourses = coursesData.courses.filter(
          (c: CourseProgress) => c.isEnrolled
        );

        setCourses(
          enrolledCourses.map((c: CourseProgress) => ({
            id: c.id,
            title: c.title,
            stream: c.stream,
            progress: c.progress,
            completedLessons: c.completedLessons,
            totalLessons: c.totalLessons,
          }))
        );

        setRecentActivity(
          (progressData.progress || []).slice(0, 5).map((p: Record<string, unknown>) => ({
            id: p.id,
            lessonTitle: p.lessonTitle,
            topicTitle: p.topicTitle,
            status: p.status,
            updatedAt: p.updatedAt,
          }))
        );

        setStats({
          coursesEnrolled: enrolledCourses.length,
          topicsCompleted: progressData.stats?.completed || 0,
          codingHours: Math.round((progressData.stats?.totalTimeSpent || 0) / 3600),
          streak: calculateStreak(progressData.progress || []),
        });

        setSkills([
          { name: "Frontend", icon: Code2Icon, score: 0, status: "beginner" },
          { name: "Backend", icon: ServerIcon, score: 0, status: "beginner" },
          { name: "AI / ML", icon: BrainIcon, score: 0, status: "beginner" },
          { name: "Data Science", icon: BarChart3Icon, score: 0, status: "beginner" },
          { name: "Mobile", icon: SmartphoneIcon, score: 0, status: "beginner" },
        ]);

        try {
          const skillRes = await fetch("/api/adaptive/skills", { headers });
          if (skillRes.ok) {
            const skillData = await skillRes.json();
            const nodes = skillData.graph?.nodes || [];
            const streamMap: Record<string, { name: string; icon: typeof Code2Icon }> = {
              frontend: { name: "Frontend", icon: Code2Icon },
              backend: { name: "Backend", icon: ServerIcon },
              ai: { name: "AI / ML", icon: BrainIcon },
              "data-science": { name: "Data Science", icon: BarChart3Icon },
              mobile: { name: "Mobile", icon: SmartphoneIcon },
              devops: { name: "DevOps", icon: ServerIcon },
            };
            const streamScores: Record<string, { total: number; count: number }> = {};
            nodes.forEach((n: { topicName: string; score: number; level: string }) => {
              Object.entries(streamMap).forEach(([stream, info]) => {
                if (n.topicName?.toLowerCase().includes(stream) || n.topicName?.toLowerCase().includes(info.name.toLowerCase())) {
                  if (!streamScores[stream]) streamScores[stream] = { total: 0, count: 0 };
                  streamScores[stream].total += n.score;
                  streamScores[stream].count++;
                }
              });
            });
            const updatedSkills = [
              { name: "Frontend", icon: Code2Icon, score: 0, status: "beginner" },
              { name: "Backend", icon: ServerIcon, score: 0, status: "beginner" },
              { name: "AI / ML", icon: BrainIcon, score: 0, status: "beginner" },
              { name: "Data Science", icon: BarChart3Icon, score: 0, status: "beginner" },
              { name: "Mobile", icon: SmartphoneIcon, score: 0, status: "beginner" },
              { name: "DevOps", icon: ServerIcon, score: 0, status: "beginner" },
            ];
            updatedSkills.forEach((skill) => {
              const stream = Object.entries(streamMap).find(([, info]) => info.name === skill.name)?.[0];
              if (stream && streamScores[stream]) {
                skill.score = Math.round(streamScores[stream].total / streamScores[stream].count);
                if (skill.score >= 80) skill.status = "mastered";
                else if (skill.score >= 60) skill.status = "strong";
                else if (skill.score >= 40) skill.status = "competent";
                else if (skill.score >= 20) skill.status = "developing";
              }
            });
            setSkills(updatedSkills);
          }
        } catch {
          // Keep default skills if adaptive API fails
        }
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "Learner"}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your learning overview for today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpenIcon}
          label="Courses Enrolled"
          value={stats?.coursesEnrolled ?? 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Topics Completed"
          value={stats?.topicsCompleted ?? 0}
          color="green"
        />
        <StatCard
          icon={ClockIcon}
          label="Coding Hours"
          value={stats?.codingHours ?? 0}
          color="purple"
        />
        <StatCard
          icon={FlameIcon}
          label="Day Streak"
          value={stats?.streak ?? 0}
          color="orange"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <EmptyState
                  title="No courses yet"
                  description="Browse available courses to start learning"
                  actionLabel="Explore Courses"
                  actionHref="/dashboard/courses"
                />
              ) : (
                <div className="space-y-4">
                  {courses.slice(0, 3).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 rounded-lg border p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.completedLessons} / {course.totalLessons} lessons
                        </p>
                        <div className="mt-2">
                          <Progress value={course.progress}>
                            <ProgressLabel />
                            <ProgressTrack>
                              <ProgressIndicator />
                            </ProgressTrack>
                            <ProgressValue />
                          </Progress>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/dashboard/courses/${course.id}`} />}
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
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Start a lesson to see your progress here"
                  actionLabel="Browse Courses"
                  actionHref="/dashboard/courses"
                />
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`size-2 rounded-full ${
                          activity.status === "completed"
                            ? "bg-green-500"
                            : activity.status === "in_progress"
                              ? "bg-blue-500"
                              : "bg-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.lessonTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.topicTitle}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {activity.status === "completed"
                          ? "Completed"
                          : activity.status === "in_progress"
                            ? "In Progress"
                            : "Started"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skill Matrix</CardTitle>
              <CardDescription>Your proficiency across domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <skill.icon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{skill.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {skill.status}
                      </Badge>
                    </div>
                    <Progress value={skill.score}>
                      <ProgressTrack>
                        <ProgressIndicator />
                      </ProgressTrack>
                      <ProgressValue />
                    </Progress>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
  icon: typeof BookOpenIcon;
  label: string;
  value: number;
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

function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <TrendingUpIcon className="size-12 text-muted-foreground/50" />
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        render={<Link href={actionHref} />}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function calculateStreak(progress: { updatedAt: string }[]): number {
  if (progress.length === 0) return 0;
  const dates = progress.map((p) => new Date(p.updatedAt).toDateString());
  const uniqueDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toDateString();
    if (uniqueDates[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}