"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/components/providers/auth-provider";
import { UnifiedInteractiveClassroom } from "@/components/learn/unified-interactive-classroom";
import { ArrowLeftIcon } from "lucide-react";

interface LessonContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  explanation: string;
  order: number;
  difficultyLevel: number;
  topic: { id: string; title: string; difficulty: number };
  course: { id: string; title: string; slug: string };
  module: { id: string; title: string };
  concepts: { id: string; title: string; description: string }[];
  examples: { id: string; title: string; description: string; starterCode: string; solutionCode: string }[];
  exercises: { id: string; title: string; description: string; starterCode: string; testCases: string }[];
  visualizations: { id: string; type: string; title: string; config: string }[];
  prerequisites: { id: string; title: string; completed: boolean }[];
}

interface LessonNavigation {
  prevLessonId: string | null;
  nextLessonId: string | null;
  currentIndex: number;
  totalLessons: number;
}

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const router = useRouter();
  const { user } = useAuthContext();
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [navigation, setNavigation] = useState<LessonNavigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`, { headers: getAuthHeaders() });
        if (!res.ok) {
          if (res.status === 404) throw new Error("Lesson not found");
          throw new Error("Failed to load lesson");
        }
        const data = await res.json();
        setLesson(data.lesson);
        setNavigation(data.navigation);
        if (data.progress?.status === "completed") {
          setCompleted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        setCompleted(true);
      }
    } catch {
      // silently fail
    } finally {
      setCompleting(false);
    }
  }, [lessonId]);

  if (loading) return <LessonSkeleton />;

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive font-medium">{error || "Lesson not found"}</p>
        <Button variant="outline" render={<Link href="/dashboard/courses" />}>
          <ArrowLeftIcon className="size-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
      <UnifiedInteractiveClassroom
        lessonTitle={lesson.title}
        topicTitle={lesson.topic.title}
        courseTitle={lesson.course.title}
        moduleTitle={lesson.module.title}
        lessonContent={lesson.content}
        lessonExplanation={lesson.explanation}
        concepts={lesson.concepts}
        examples={lesson.examples}
        isCompleted={completed}
        onCompleteLesson={handleComplete}
        hasNextLesson={Boolean(navigation?.nextLessonId)}
        hasPrevLesson={Boolean(navigation?.prevLessonId)}
        onNextLesson={() => {
          if (navigation?.nextLessonId) {
            router.push(`/dashboard/learn/${navigation.nextLessonId}`);
          }
        }}
        onPrevLesson={() => {
          if (navigation?.prevLessonId) {
            router.push(`/dashboard/learn/${navigation.prevLessonId}`);
          }
        }}
      />
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-7 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    </div>
  );
}