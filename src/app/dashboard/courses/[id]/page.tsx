"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  ChevronLeftIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  GraduationCapIcon,
  PlayIcon,
  ArrowRightIcon,
  Loader2Icon,
} from "lucide-react";

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  stream: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  isEnrolled: boolean;
  modules: {
    id: string;
    title: string;
    description: string;
    order: number;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    topics: {
      id: string;
      title: string;
      description: string;
      difficulty: number;
      order: number;
      progress: number;
      completedLessons: number;
      totalLessons: number;
      lessons: { id: string; title: string; slug: string; difficultyLevel: number }[];
      prerequisites: { id: string; title: string }[];
    }[];
  }[];
}

const difficultyLabels: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Advanced",
};

const difficultyColors: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  2: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  3: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  4: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`, { headers: getAuthHeaders() });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Course not found");
          throw new Error("Failed to fetch course");
        }
        const data = await res.json();
        setCourse(data.course);
        setEnrolled(data.course.isEnrolled);
        if (data.course?.modules?.length > 0) {
          setExpandedModules(new Set([data.course.modules[0].id]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [id]);

  const handleEnroll = useCallback(async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${id}/enroll`, { method: "POST", headers: getAuthHeaders() });
      if (res.ok) {
        setEnrolled(true);
        const data = await res.json();
        if (course) {
          const firstLesson = findFirstLesson(course);
          if (firstLesson) {
            router.push(`/dashboard/learn/${firstLesson}`);
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setEnrolling(false);
    }
  }, [id, course, router]);

  const handleStartLearning = useCallback(() => {
    if (!course) return;
    const firstLesson = findFirstIncompleteLesson(course);
    if (firstLesson) {
      router.push(`/dashboard/learn/${firstLesson}`);
    }
  }, [course, router]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (loading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive font-medium">{error || "Course not found"}</p>
        <Button variant="outline" className="mt-4" render={<Link href="/dashboard/courses" />}>
          <ChevronLeftIcon className="size-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  const allPrerequisitesCompleted = course.modules
    .flatMap((m) => m.topics)
    .flatMap((t) => t.prerequisites)
    .every((_p) => true);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard/courses" />}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <Badge variant="secondary" className="text-xs">{course.stream}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {enrolled || course.isEnrolled ? (
            <Button onClick={handleStartLearning}>
              <GraduationCapIcon className="size-4" />
              {course.progress > 0 ? "Continue Learning" : "Start Learning"}
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <GraduationCapIcon className="size-4" />
                  Enroll Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {course.completedLessons} / {course.totalLessons} lessons
            </span>
            <span className="font-medium">{course.progress}%</span>
          </div>
          <Progress value={course.progress}>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Modules</h2>
        {course.modules.map((mod) => {
          const isExpanded = expandedModules.has(mod.id);
          return (
            <Card key={mod.id}>
              <button className="w-full text-left" onClick={() => toggleModule(mod.id)}>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        <span className="text-muted-foreground text-sm font-normal mr-2">
                          Module {mod.order + 1}
                        </span>
                        {mod.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{mod.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{mod.progress}%</div>
                        <div className="text-xs text-muted-foreground">
                          {mod.completedLessons}/{mod.totalLessons}
                        </div>
                      </div>
                      <ChevronLeftIcon
                        className={`size-5 text-muted-foreground transition-transform ${isExpanded ? "-rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                  <Progress value={mod.progress} className="mt-3">
                    <ProgressTrack className="h-1">
                      <ProgressIndicator />
                    </ProgressTrack>
                  </Progress>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="border-t pt-4">
                  <div className="space-y-2">
                    {mod.topics.map((topic) => {
                      const isComplete = topic.progress === 100;
                      const firstLessonId = topic.lessons[0]?.id;

                      return (
                        <Link
                          key={topic.id}
                          href={firstLessonId ? `/dashboard/learn/${firstLessonId}` : "#"}
                          className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors ${
                            !firstLessonId ? "pointer-events-none opacity-50" : ""
                          }`}
                        >
                          <div className="shrink-0">
                            {isComplete ? (
                              <CheckCircle2Icon className="size-5 text-emerald-500" />
                            ) : (
                              <BookOpenIcon className="size-5 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{topic.title}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${difficultyColors[topic.difficulty] || ""}`}
                              >
                                {difficultyLabels[topic.difficulty] || `Level ${topic.difficulty}`}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {topic.description}
                            </p>
                            {topic.prerequisites.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Prerequisites: {topic.prerequisites.map((p) => p.title).join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xs text-muted-foreground">
                              {topic.lessons.length} lesson{topic.lessons.length !== 1 ? "s" : ""}
                            </div>
                            {topic.progress > 0 && topic.progress < 100 && (
                              <div className="text-xs font-medium text-sky-500">{topic.progress}%</div>
                            )}
                            {isComplete && (
                              <div className="text-xs font-medium text-emerald-500">Done</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function findFirstLesson(course: CourseDetail): string | null {
  for (const mod of course.modules) {
    for (const topic of mod.topics) {
      if (topic.lessons.length > 0) {
        return topic.lessons[0].id;
      }
    }
  }
  return null;
}

function findFirstIncompleteLesson(course: CourseDetail): string | null {
  for (const mod of course.modules) {
    for (const topic of mod.topics) {
      if (topic.progress < 100) {
        for (const lesson of topic.lessons) {
          return lesson.id;
        }
      }
    }
  }
  return findFirstLesson(course);
}

function CourseDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-1 h-4 w-96" />
        </div>
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-2 w-full" />
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-1 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}