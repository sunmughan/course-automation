"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AITutor } from "@/components/tutor/ai-tutor";
import { IDEPanel } from "@/components/editor/ide-panel";
import { useAuthContext } from "@/components/providers/auth-provider";
import { AnimatedFlowExplainer, generateFlowSteps, type AnimatedFlowConfig } from "@/components/visualization/animated-flow-explainer";
import { CallStack } from "@/components/visualization/call-stack";
import { MemoryView } from "@/components/visualization/memory-view";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  BookOpenIcon,
  LightbulbIcon,
  Code2Icon,
  ListChecksIcon,
  ArrowLeftIcon,
  ClockIcon,
  TrophyIcon,
  MessageCircleIcon,
} from "lucide-react";

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

const difficultyLabels: Record<number, string> = { 1: "Beginner", 2: "Easy", 3: "Intermediate", 4: "Advanced" };

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params);
  const { user } = useAuthContext();
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [navigation, setNavigation] = useState<LessonNavigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [courseProgress, setCourseProgress] = useState<{ completed: number; total: number; percentage: number } | null>(null);
  const [activeTab, setActiveTab] = useState("content");

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
        setCourseProgress(data.courseProgress);
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
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive font-medium">{error || "Lesson not found"}</p>
        <Button variant="outline" className="mt-4" render={<Link href="/dashboard/courses" />}>
          <ArrowLeftIcon className="size-4" />
          Back to Courses
        </Button>
      </div>
    );
  }

  const progressPercent = navigation ? Math.round(((navigation.currentIndex + 1) / navigation.totalLessons) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 border-b px-6 py-3 shrink-0">
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/courses/${lesson.course.id}`} />}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate">
                {lesson.course.title} &rsaquo; {lesson.module.title}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {lesson.topic.title}
              </Badge>
            </div>
            <h1 className="text-sm font-semibold truncate">{lesson.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {difficultyLabels[lesson.difficultyLevel] || `Level ${lesson.difficultyLevel}`}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Lesson {navigation ? navigation.currentIndex + 1 : lesson.order + 1} of {navigation?.totalLessons || "?"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-6 shrink-0">
              <TabsList className="h-9">
                <TabsTrigger value="content" className="text-xs gap-1.5">
                  <BookOpenIcon className="size-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="examples" className="text-xs gap-1.5">
                  <Code2Icon className="size-3.5" />
                  Examples
                  {lesson.examples.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {lesson.examples.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="playground" className="text-xs gap-1.5">
                  <Code2Icon className="size-3.5" />
                  Playground
                </TabsTrigger>
                <TabsTrigger value="visualize" className="text-xs gap-1.5">
                  <Code2Icon className="size-3.5" />
                  Visualize
                  {lesson.visualizations.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {lesson.visualizations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tutor" className="text-xs gap-1.5">
                  <MessageCircleIcon className="size-3.5" />
                  AI Tutor
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {lesson.content}
                    </div>
                  </div>

                  {lesson.explanation && (
                    <Card className="border-sky-500/20 bg-sky-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <LightbulbIcon className="size-4 text-sky-500" />
                          Explanation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {lesson.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {lesson.concepts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <ListChecksIcon className="size-4" />
                        Key Concepts
                      </h3>
                      <div className="grid gap-2">
                        {lesson.concepts.map((concept) => (
                          <Card key={concept.id} className="border-muted">
                            <CardHeader className="pb-1 pt-3 px-4">
                              <CardTitle className="text-sm">{concept.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                              <p className="text-xs text-muted-foreground">{concept.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {lesson.prerequisites.length > 0 && (
                    <Card className="border-amber-500/20 bg-amber-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Prerequisites</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {lesson.prerequisites.map((prereq) => (
                            <div key={prereq.id} className="flex items-center gap-2 text-sm">
                              {prereq.completed ? (
                                <CheckCircle2Icon className="size-4 text-emerald-500" />
                              ) : (
                                <ClockIcon className="size-4 text-amber-500" />
                              )}
                              <span className={prereq.completed ? "text-muted-foreground line-through" : ""}>
                                {prereq.title}
                              </span>
                              {!prereq.completed && (
                                <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/20">
                                  Required
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="examples" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                  {lesson.examples.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Code2Icon className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No examples for this lesson</p>
                    </div>
                  ) : (
                    lesson.examples.map((example) => (
                      <Card key={example.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{example.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{example.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {example.starterCode && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Starter Code</p>
                              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                                <code>{example.starterCode}</code>
                              </pre>
                            </div>
                          )}
                          {example.solutionCode && (
                            <div>
                              <p className="text-xs font-medium text-emerald-500 mb-1">Solution</p>
                              <pre className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4 text-xs overflow-x-auto">
                                <code>{example.solutionCode}</code>
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="playground" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
              <IDEPanel
                initialCode={lesson.examples[0]?.starterCode || "// Write your code here\n"}
              />
            </TabsContent>

            <TabsContent value="visualize" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                  {lesson.visualizations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Code2Icon className="size-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No visualizations for this lesson</p>
                    </div>
                  ) : (
                    lesson.visualizations.map((viz) => {
                      let parsedConfig: Record<string, unknown> = {};
                      try { parsedConfig = JSON.parse(viz.config); } catch { /* use empty */ }

                      if (viz.type === "flowchart" || viz.type === "flow-animation") {
                        const rawNodes = (parsedConfig.nodes as Array<{ id: string; label: string; x?: number; y?: number }>) || [];
                        const rawEdges = (parsedConfig.edges as Array<{ from: string; to: string; label?: string }>) || [];

                        let flowConfig: AnimatedFlowConfig;
                        if (viz.type === "flow-animation" && Array.isArray(parsedConfig.steps) && parsedConfig.steps.length > 0) {
                          const { config } = generateFlowSteps(rawNodes, rawEdges);
                          config.steps = parsedConfig.steps as AnimatedFlowConfig["steps"];
                          flowConfig = config;
                        } else {
                          const { config } = generateFlowSteps(rawNodes, rawEdges);
                          flowConfig = config;
                        }

                        return (
                          <AnimatedFlowExplainer key={viz.id} config={flowConfig} />
                        );
                      }

                      if (viz.type === "callstack") {
                        const frames = (parsedConfig.frames as Array<{ name: string; variables?: string[]; returned?: string }>) || [];
                        return (
                          <Card key={viz.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{viz.title}</CardTitle>
                              <Badge variant="outline" className="text-[10px]">Call Stack</Badge>
                            </CardHeader>
                            <CardContent>
                              <CallStack
                                frames={frames.map((f, i) => ({
                                  id: `frame-${i}`,
                                  name: f.name,
                                  args: f.variables || [],
                                  returnValue: f.returned || undefined,
                                  isExecuting: i === frames.length - 1,
                                }))}
                              />
                            </CardContent>
                          </Card>
                        );
                      }

                      if (viz.type === "memory") {
                        const layers = (parsedConfig.layers as Array<{ name: string; properties?: Record<string, string> }>) || [];
                        return (
                          <Card key={viz.id}>
                            <CardHeader>
                              <CardTitle className="text-base">{viz.title}</CardTitle>
                              <Badge variant="outline" className="text-[10px]">Memory View</Badge>
                            </CardHeader>
                            <CardContent>
                              <MemoryView
                                events={layers.flatMap((layer, layerIdx) =>
                                  Object.entries(layer.properties || {}).map(([key, value], propIdx) => ({
                                    step: layerIdx * 100 + propIdx,
                                    type: "variable",
                                    variable: `${layer.name}.${key}`,
                                    value,
                                  }))
                                )}
                                currentStep={999}
                              />
                            </CardContent>
                          </Card>
                        );
                      }

                      return (
                        <Card key={viz.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{viz.title}</CardTitle>
                            <Badge variant="outline" className="text-[10px]">{viz.type}</Badge>
                          </CardHeader>
                          <CardContent>
                            <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                              <code>{viz.config}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tutor" className="flex-1 overflow-hidden m-0 data-[state=inactive]:hidden">
              <AITutor
                userId={user?.id || null}
                topicId={lesson.topic.id}
                lessonId={lesson.id}
                className="h-full border-0 rounded-none"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Progress value={progressPercent} className="w-32">
                <ProgressTrack className="h-1.5">
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
              <span className="text-xs text-muted-foreground">{progressPercent}% complete</span>
            </div>

            <div className="flex items-center gap-2">
              {navigation?.prevLessonId && (
                <Button variant="outline" size="sm" render={<Link href={`/dashboard/learn/${navigation.prevLessonId}`} />}>
                  <ChevronLeftIcon className="size-4" />
                  Previous
                </Button>
              )}

              {completed ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
                    <CheckCircle2Icon className="size-3.5" />
                    Completed
                    {courseProgress && (
                      <span className="ml-1">
                        ({courseProgress.percentage}% course)
                      </span>
                    )}
                  </Badge>
                  {navigation?.nextLessonId && (
                    <Button size="sm" render={<Link href={`/dashboard/learn/${navigation.nextLessonId}`} />}>
                      Next
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={completing}
                >
                  <TrophyIcon className="size-4" />
                  {completing ? "Completing..." : "Mark Complete"}
                </Button>
              )}

              {!completed && navigation?.nextLessonId && (
                <Button variant="ghost" size="sm" render={<Link href={`/dashboard/learn/${navigation.nextLessonId}`} />}>
                  Skip
                  <ChevronRightIcon className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 border-b px-6 py-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-5 w-64 mt-1" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="border-t px-6 py-3">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}