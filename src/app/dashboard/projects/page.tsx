"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  Clock,
  Star,
  Layers,
  ArrowRight,
  Package,
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  submissions: Array<{
    id: string;
    status: string;
    score: number | null;
    createdAt: string;
  }>;
  _count?: {
    submissions: number;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/courses?type=projects", {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProjects(data);
          } else if (Array.isArray(data?.projects)) {
            setProjects(data.projects);
          } else if (Array.isArray(data?.courses)) {
            setProjects(
              data.courses.map((c: any) => ({
                id: c.id,
                title: c.title,
                description: c.description,
                difficulty: c.difficulty || 2,
                course: {
                  id: c.id,
                  title: c.title,
                  slug: c.slug,
                },
                submissions: c.submissions || [],
              }))
            );
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const getDifficultyBadge = (level: number) => {
    switch (level) {
      case 1:
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Beginner
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Easy
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Intermediate
          </Badge>
        );
      case 4:
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Advanced
          </Badge>
        );
      case 5:
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Expert
          </Badge>
        );
      default:
        return <Badge variant="outline">Level {level}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-gray-400 mt-1">
          Build real-world projects to apply your skills
        </p>
      </div>

      {!Array.isArray(projects) || projects.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-12 text-center">
            <FolderGit2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No projects available yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Enroll in a course to access projects
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/dashboard/courses")}
            >
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(projects) ? projects : []).map((project) => {
              const lastSubmission = project.submissions?.[0];
              const hasSubmission = lastSubmission != null;
              const isCompleted =
                lastSubmission?.status === "completed" ||
                lastSubmission?.status === "passed";

              return (
                <Card
                  key={project.id}
                  className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {project.title}
                          {isCompleted && (
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      {getDifficultyBadge(project.difficulty)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {project.course?.title || "Course"}
                        </span>
                        {hasSubmission && (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(lastSubmission.createdAt).toLocaleDateString()}
                            </span>
                            {lastSubmission.score != null && (
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                {lastSubmission.score}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 group-hover:border-blue-500/50 transition-colors"
                        onClick={() =>
                          router.push(
                            `/dashboard/playground?project=${project.id}`
                          )
                        }
                      >
                        {hasSubmission ? "Continue" : "Start"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    {hasSubmission && !isCompleted && (
                      <Progress
                        value={lastSubmission.score ?? 0}
                        className="mt-3 h-1"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-400" />
                    Project Learning Path
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Start with simple utilities and progress to production-grade applications
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                  {["Simple Utility", "CRUD App", "API Integration", "Auth System", "Production App", "Capstone"].map(
                    (step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {step}
                        </Badge>
                        {i < 5 && <ArrowRight className="h-3 w-3" />}
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}