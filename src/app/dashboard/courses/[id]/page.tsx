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
  ChevronDownIcon,
  ChevronUpIcon,
  LayersIcon,
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
  1: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  2: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  3: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  4: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Course not found");
        throw new Error("Failed to load course");
      }
      const data = await res.json();
      setCourse(data.course);
      setEnrolled(data.course.isEnrolled);

      // Expand first module by default
      if (data.course?.modules?.length > 0) {
        setExpandedModules(new Set([data.course.modules[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${id}/enroll`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enroll");
      }
      setEnrolled(true);
      if (course) {
        setCourse({ ...course, isEnrolled: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const findFirstIncompleteLesson = (c: CourseDetail): string | null => {
    for (const mod of c.modules) {
      for (const topic of mod.topics) {
        for (const lesson of topic.lessons) {
          return lesson.id;
        }
      }
    }
    return null;
  };

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
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <p className="text-rose-400 font-semibold">{error || "Course not found"}</p>
        <Button variant="outline" className="mt-4" render={<Link href="/dashboard/courses" />}>
          <ChevronLeftIcon className="size-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Back Navigation Link */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <ChevronLeftIcon className="size-4" />
          <span>Back to All Courses</span>
        </Link>
      </div>

      {/* Course Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-bold">
            {course.stream || "Engineering Track"}
          </Badge>
          <span className="text-xs text-slate-500 font-mono">
            {course.totalLessons} Lessons Total
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug break-words">
            {course.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-3xl">
            {course.description}
          </p>
        </div>

        {/* Action Button & Stats Banner */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
            <div className="flex items-center gap-1.5">
              <BookOpenIcon className="size-4 text-sky-400" />
              <span>{course.completedLessons} / {course.totalLessons} Completed</span>
            </div>
            <span>•</span>
            <span className="font-bold text-emerald-400">{course.progress}% Mastery</span>
          </div>

          <div className="flex items-center gap-2">
            {enrolled || course.isEnrolled ? (
              <Button
                onClick={handleStartLearning}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCapIcon className="size-4" />
                <span>{course.progress > 0 ? "Continue Learning ▶" : "Start Learning ▶"}</span>
              </Button>
            ) : (
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <GraduationCapIcon className="size-4" />
                    <span>Enroll Now (Free)</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Course Curriculum & Modules */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
              <LayersIcon className="size-4 text-sky-400" />
              <span>Course Curriculum ({course.modules.length} Learning Phases)</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Jump straight to React, JavaScript, CSS, HTML or any specific phase
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Phases", badge: "All" },
              { id: "html", label: "HTML5", badge: "🟠 HTML5" },
              { id: "css", label: "CSS3", badge: "🔵 CSS3" },
              { id: "js", label: "JavaScript", badge: "🟡 JavaScript" },
              { id: "react", label: "React.js", badge: "⚛️ React.js" },
              { id: "ts", label: "TypeScript / Tooling", badge: "🔷 TypeScript" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  if (filter.id === "all") {
                    // expand first
                    if (course.modules.length > 0) setExpandedModules(new Set([course.modules[0].id]));
                  } else {
                    // find matching module and expand it
                    const target = course.modules.find(m => m.title.toLowerCase().includes(filter.id));
                    if (target) {
                      setExpandedModules(new Set([target.id]));
                      const el = document.getElementById(`module-${target.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-xs"
              >
                {filter.badge}
              </button>
            ))}
          </div>
        </div>

        {course.modules.map((mod, idx) => {
          const isExpanded = expandedModules.has(mod.id);
          const getTechBadge = (title: string) => {
            const lower = title.toLowerCase();
            if (lower.includes("html") || lower.includes("web standards")) return { label: "HTML5 Core", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" };
            if (lower.includes("css") || lower.includes("responsive")) return { label: "CSS3 & Design", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
            if (lower.includes("react") || lower.includes("framework")) return { label: "React.js & Ecosystem", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" };
            if (lower.includes("javascript") || lower.includes("js") || lower.includes("dom")) return { label: "JavaScript Engine", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
            if (lower.includes("architecture") || lower.includes("bundler") || lower.includes("tooling")) return { label: "Architecture & Tooling", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" };
            if (lower.includes("typescript")) return { label: "TypeScript Pro", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
            if (lower.includes("next")) return { label: "Next.js Fullstack", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
            return { label: `Phase ${idx + 1}`, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
          };

          const badge = getTechBadge(mod.title);

          return (
            <div
              key={mod.id}
              id={`module-${mod.id}`}
              className={`bg-slate-900/80 border rounded-2xl overflow-hidden transition-all shadow-md ${
                isExpanded ? "border-sky-500/40 ring-1 ring-sky-500/20" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <button
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-850/60 cursor-pointer transition-colors"
                onClick={() => toggleModule(mod.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800/80">
                      Phase {idx + 1}
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {mod.topics.length} Topics
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight break-words">
                    {mod.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-bold text-sky-400 hidden sm:inline">
                    {isExpanded ? "Collapse ▲" : "View Topics ▼"}
                  </span>
                  {isExpanded ? (
                    <ChevronUpIcon className="size-4 text-sky-400" />
                  ) : (
                    <ChevronDownIcon className="size-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800/80 p-3 sm:p-4 bg-slate-950/40 space-y-2">
                  {mod.topics.map((topic, tIdx) => {
                    const firstLesson = topic.lessons[0];
                    return (
                      <div
                        key={topic.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-mono text-slate-400 font-bold">
                              Topic {tIdx + 1}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${difficultyColors[topic.difficulty] || "text-slate-400"}`}>
                              {difficultyLabels[topic.difficulty] || "Beginner"}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {topic.title}
                          </h4>
                          {topic.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {topic.description}
                            </p>
                          )}
                        </div>

                        {firstLesson && (
                          <Button
                            size="sm"
                            className="text-xs font-mono font-bold bg-sky-600 hover:bg-sky-500 text-white shrink-0 self-start sm:self-auto cursor-pointer shadow-md flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                            onClick={() => router.push(`/dashboard/learn/${firstLesson.id}`)}
                          >
                            <PlayIcon className="size-3 text-white fill-current" />
                            <span>Start Lesson ▶</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-40 bg-slate-900 rounded-lg" />
      <Skeleton className="h-48 w-full bg-slate-900 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-16 w-full bg-slate-900 rounded-xl" />
        <Skeleton className="h-16 w-full bg-slate-900 rounded-xl" />
        <Skeleton className="h-16 w-full bg-slate-900 rounded-xl" />
      </div>
    </div>
  );
}
