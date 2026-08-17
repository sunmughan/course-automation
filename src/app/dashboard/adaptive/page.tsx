"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Brain,
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface SkillGraphData {
  graph: {
    nodes: Array<{
      topicId: string;
      topicName: string;
      skillName: string;
      score: number;
      level: string;
      attempts: number;
      lastAttemptAt: string | null;
      isWeak: boolean;
      masteryPercent: number;
    }>;
    overallLevel: string;
    overallScore: number;
    totalTopics: number;
    masteredTopics: number;
    weakTopics: string[];
  };
}

interface WeakTopicsData {
  weakTopics: Array<{
    topicId: string;
    topicName: string;
    skillLevel: string;
    score: number;
    masteryPercent: number;
    mistakeCount: number;
    reasons: string[];
    priority: number;
    recommendedActions: string[];
  }>;
  summary: {
    totalWeak: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
}

interface RevisionData {
  revision: {
    plans: Array<{
      title: string;
      description: string;
      priority: string;
      topics: Array<{
        topicId: string;
        topicName: string;
        reason: string;
        actions: string[];
        suggestedMode: string;
        isDue: boolean;
        isOverdue: boolean;
        skillLevel: string;
        masteryPercent: number;
      }>;
      estimatedTimeMinutes: number;
      totalItems: number;
    }>;
    dueCount: number;
    overdueCount: number;
    totalTopics: number;
    masteredTopics: number;
    overallRecommendation: string;
  };
}

interface ExercisesData {
  exercises: Array<{
    title: string;
    description: string;
    instructions: string;
    starterCode: string;
    difficulty: number;
    focusArea: string;
    hints: string[];
    topicId: string;
    topicName: string;
  }>;
  total: number;
}

function getLevelBadge(level: string) {
  switch (level) {
    case "mastered":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Mastered</Badge>;
    case "strong":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Strong</Badge>;
    case "competent":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Competent</Badge>;
    case "developing":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Developing</Badge>;
    default:
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Beginner</Badge>;
  }
}

function getPriorityBadge(priority: number) {
  if (priority >= 70) {
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
  }
  if (priority >= 40) {
    return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Medium</Badge>;
  }
  return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
}

function getDifficultyBadge(difficulty: number) {
  const labels = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];
  const colors = [
    "",
    "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "bg-red-500/20 text-red-400 border-red-500/30",
  ];
  return (
    <Badge className={colors[difficulty] || colors[1]}>
      {labels[difficulty] || `Level ${difficulty}`}
    </Badge>
  );
}

export default function AdaptivePage() {
  const [skillGraph, setSkillGraph] = useState<SkillGraphData | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopicsData | null>(null);
  const [revision, setRevision] = useState<RevisionData | null>(null);
  const [exercises, setExercises] = useState<ExercisesData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("skills");
  const [loading, setLoading] = useState(true);
  const [generatingExercises, setGeneratingExercises] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllData() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [skillRes, weakRes, revisionRes, exercisesRes] = await Promise.all([
        fetch("/api/adaptive/skills", { headers }),
        fetch("/api/adaptive/recommendations", { headers }),
        fetch("/api/adaptive/revision", { headers }),
        fetch("/api/adaptive/exercises", { headers }),
      ]);

      if (skillRes.ok) setSkillGraph(await skillRes.json());
      if (weakRes.ok) setWeakTopics(await weakRes.json());
      if (revisionRes.ok) setRevision(await revisionRes.json());
      if (exercisesRes.ok) setExercises(await exercisesRes.json());
    } catch {
      setError("Failed to load adaptive learning data");
    } finally {
      setLoading(false);
    }
  }

  async function generateExercises() {
    try {
      setGeneratingExercises(true);
      const res = await fetch("/api/adaptive/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ count: 3 }),
      });
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
        setActiveTab("exercises");
      }
    } catch {
      setError("Failed to generate exercises");
    } finally {
      setGeneratingExercises(false);
    }
  }

  async function markReviewed(topicId: string) {
    try {
      await fetch("/api/adaptive/revision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ topicId, quality: 4 }),
      });
      fetchAllData();
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchAllData);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Adaptive Learning</h1>
          <p className="text-gray-400 mt-1">
            AI-powered personalized learning path based on your performance
          </p>
        </div>
        <Button
          onClick={generateExercises}
          disabled={generatingExercises}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {generatingExercises ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {generatingExercises ? "Generating..." : "Generate Exercises"}
        </Button>
      </div>

      {revision?.revision.overallRecommendation && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-blue-300">{revision.revision.overallRecommendation}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overall Level</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {skillGraph?.graph.overallLevel || "N/A"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <Progress
              value={skillGraph?.graph.overallScore ?? 0}
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mastered Topics</p>
                <p className="text-2xl font-bold text-white">
                  {skillGraph?.graph.masteredTopics ?? 0}
                  <span className="text-sm text-gray-500 ml-1">
                    / {skillGraph?.graph.totalTopics ?? 0}
                  </span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Weak Areas</p>
                <p className="text-2xl font-bold text-white">
                  {weakTopics?.summary.totalWeak ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
            </div>
            {weakTopics && weakTopics.summary.highPriority > 0 && (
              <p className="text-xs text-red-400 mt-2">
                {weakTopics.summary.highPriority} need urgent attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Reviews Due</p>
                <p className="text-2xl font-bold text-white">
                  {revision?.revision.dueCount ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            {revision && revision.revision.overdueCount > 0 && (
              <p className="text-xs text-red-400 mt-2">
                {revision.revision.overdueCount} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="skills">Skill Graph</TabsTrigger>
          <TabsTrigger value="weak">Weak Topics</TabsTrigger>
          <TabsTrigger value="revision">Revision Plan</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-4">
          {!skillGraph?.graph.nodes.length ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No skills tracked yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Complete lessons to build your skill profile
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {skillGraph.graph.nodes
                .sort((a, b) => b.score - a.score)
                .map((node) => (
                  <Card key={node.topicId} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{node.topicName}</span>
                          {getLevelBadge(node.level)}
                          {node.isWeak && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Weak
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">
                            {node.attempts} attempts
                          </span>
                          <span className="text-sm font-medium text-white">
                            {node.masteryPercent}%
                          </span>
                        </div>
                      </div>
                      <Progress value={node.score} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        Score: {node.score}/100
                        {node.lastAttemptAt &&
                          ` · Last: ${new Date(node.lastAttemptAt).toLocaleDateString()}`}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weak" className="mt-4">
          {!weakTopics?.weakTopics.length ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No weak topics detected</p>
                <p className="text-gray-500 text-sm mt-1">
                  Great job! Keep up the consistent practice
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {weakTopics.weakTopics.map((topic) => (
                <Card
                  key={topic.topicId}
                  className={`bg-gray-900/50 border-gray-800 ${
                    topic.priority >= 70 ? "border-l-2 border-l-red-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{topic.topicName}</span>
                        {getLevelBadge(topic.skillLevel)}
                        {getPriorityBadge(topic.priority)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{topic.masteryPercent}%</p>
                        <p className="text-xs text-gray-500">{topic.mistakeCount} mistakes</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 font-medium mb-1">Detected Issues:</p>
                      <ul className="space-y-1">
                        {topic.reasons.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Recommended:</p>
                      <ul className="space-y-1">
                        {topic.recommendedActions.map((action, i) => (
                          <li key={i} className="text-sm text-blue-300 flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 text-blue-400 mt-1 shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="revision" className="mt-4">
          {!revision?.revision.plans.length ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No revision plans yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Continue learning to build your revision schedule
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {revision.revision.plans.map((plan) => (
                <div key={plan.title}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
                    <Badge
                      className={
                        plan.priority === "high"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : plan.priority === "medium"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }
                    >
                      {plan.priority}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      ~{plan.estimatedTimeMinutes} min
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                  <div className="grid gap-3">
                    {plan.topics.map((topic) => (
                      <Card key={topic.topicId} className="bg-gray-900/50 border-gray-800">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-white">{topic.topicName}</span>
                              {getLevelBadge(topic.skillLevel)}
                              {topic.isOverdue && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  Overdue
                                </Badge>
                              )}
                              {topic.isDue && !topic.isOverdue && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  Due
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markReviewed(topic.topicId)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Mark Reviewed
                            </Button>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{topic.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            {topic.actions.map((action, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          {!exercises?.exercises.length ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No exercises generated yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Click &quot;Generate Exercises&quot; to get personalized practice
                </p>
                <Button
                  onClick={generateExercises}
                  disabled={generatingExercises}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  {generatingExercises ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Generate Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exercises.exercises.map((ex, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{ex.title}</span>
                        {getDifficultyBadge(ex.difficulty)}
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {ex.focusArea}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-400">{ex.topicName}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{ex.description}</p>
                    <div className="bg-gray-950 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-400 mb-2">Instructions:</p>
                      <p className="text-sm text-gray-200">{ex.instructions}</p>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-400 mb-2">Starter Code:</p>
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        {ex.starterCode}
                      </pre>
                    </div>
                    {ex.hints.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Hints:</p>
                        <ul className="space-y-1">
                          {ex.hints.map((hint, j) => (
                            <li key={j} className="text-sm text-yellow-300 flex items-start gap-2">
                              <Lightbulb className="h-3 w-3 text-yellow-400 mt-1 shrink-0" />
                              {hint}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}