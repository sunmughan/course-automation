"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  BookOpenIcon,
  ArrowRightIcon,
  PlayIcon,
  SearchIcon,
  Code2Icon,
  ServerIcon,
  BrainIcon,
  BarChart3Icon,
  SmartphoneIcon,
  CloudIcon,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  stream: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  isEnrolled: boolean;
  modules: {
    id: string;
    title: string;
    slug: string;
    order: number;
    topicCount: number;
  }[];
}

const streams = [
  { label: "All", value: "", icon: BookOpenIcon },
  { label: "Frontend", value: "frontend", icon: Code2Icon },
  { label: "Backend", value: "backend", icon: ServerIcon },
  { label: "AI", value: "ai", icon: BrainIcon },
  { label: "Data Science", value: "data-science", icon: BarChart3Icon },
  { label: "Mobile", value: "mobile", icon: SmartphoneIcon },
  { label: "DevOps", value: "devops", icon: CloudIcon },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data.courses);
      } catch {
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const filteredCourses = activeStream
    ? courses.filter((c) => c.stream === activeStream)
    : courses;

  if (loading) {
    return <CoursesSkeleton />;
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
        <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Explore our curriculum and start learning
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {streams.map((stream) => {
          const isActive = activeStream === stream.value;
          return (
            <Button
              key={stream.value}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveStream(stream.value)}
            >
              <stream.icon className="size-4" />
              <span className="ml-1.5">{stream.label}</span>
            </Button>
          );
        })}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="size-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No courses found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeStream
              ? `No courses available in the ${activeStream} stream yet`
              : "No courses available yet"}
          </p>
          {activeStream && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setActiveStream("")}
            >
              Show all courses
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {course.stream}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {course.modules.length} modules
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {course.isEnrolled && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="mt-1">
                      <ProgressTrack>
                        <ProgressIndicator />
                      </ProgressTrack>
                    </Progress>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {course.completedLessons} / {course.totalLessons} lessons completed
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  {course.modules.slice(0, 3).map((mod) => (
                    <div
                      key={mod.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <PlayIcon className="size-3 shrink-0" />
                      <span className="truncate">{mod.title}</span>
                      <span className="ml-auto shrink-0 text-xs">
                        {mod.topicCount} topics
                      </span>
                    </div>
                  ))}
                  {course.modules.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-5">
                      +{course.modules.length - 3} more modules
                    </p>
                  )}
                </div>
              </CardContent>
              <div className="px-(--card-spacing) pb-(--card-spacing)">
                {course.isEnrolled ? (
                  <Button
                    className="w-full"
                    render={
                      <Link href={`/dashboard/courses/${course.id}`} />
                    }
                  >
                    Continue
                    <ArrowRightIcon className="ml-1 size-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    render={
                      <Link href={`/dashboard/courses/${course.id}`} />
                    }
                  >
                    View Course
                    <ArrowRightIcon className="ml-1 size-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-lg" />
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-2 w-full" />
            </CardContent>
            <div className="px-(--card-spacing) pb-(--card-spacing)">
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}