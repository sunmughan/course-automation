"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  BookOpen,
  Target,
  AlertCircle,
  Trophy,
} from "lucide-react";

interface ProgressData {
  records: Array<{
    id: string;
    lessonId: string;
    lessonTitle: string;
    topicTitle: string;
    moduleTitle: string;
    courseTitle: string;
    status: string;
    score: number | null;
    timeSpent: number;
    completedAt: string | null;
  }>;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    completionPercentage: number;
    totalTimeSpent: number;
  };
}

interface SkillData {
  id: string;
  skillName: string;
  score: number;
  status: string;
  attempts: number;
}

export default function ProgressPage() {
  const { user } = useAuthContext();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("auth-token");
        const [progressRes, skillsRes] = await Promise.all([
          fetch("/api/progress", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/progress?type=skills", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (progressRes.ok) setProgress(await progressRes.json());
        if (skillsRes.ok) setSkills(await skillsRes.json());
      } catch {
        setError("Failed to load progress data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getSkillLevel = (status: string) => {
    switch (status) {
      case "mastered":
        return { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Mastered" };
      case "strong":
        return { color: "text-green-400", bg: "bg-green-500/20", label: "Strong" };
      case "competent":
        return { color: "text-blue-400", bg: "bg-blue-500/20", label: "Competent" };
      case "developing":
        return { color: "text-orange-400", bg: "bg-orange-500/20", label: "Developing" };
      default:
        return { color: "text-gray-400", bg: "bg-gray-500/20", label: "Beginner" };
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
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
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Progress</h1>
        <p className="text-gray-400 mt-1">Track your learning journey and skill mastery</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Overall Progress</p>
                <p className="text-2xl font-bold text-white">
                  {progress?.stats.completionPercentage ?? 0}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <Progress
              value={progress?.stats.completionPercentage ?? 0}
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Lessons Completed</p>
                <p className="text-2xl font-bold text-white">
                  {progress?.stats.completed ?? 0}
                  <span className="text-sm text-gray-500 ml-1">
                    / {progress?.stats.total ?? 0}
                  </span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-white">
                  {progress?.stats.inProgress ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Time</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((progress?.stats.totalTimeSpent ?? 0) / 60)}h
                  <span className="text-sm text-gray-500 ml-1">
                    {(progress?.stats.totalTimeSpent ?? 0) % 60}m
                  </span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="skills">Skill Matrix</TabsTrigger>
          <TabsTrigger value="lessons">Lesson Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-4">
          {skills.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No skills tracked yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Start completing lessons to build your skill profile
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {skills.map((skill) => {
                const level = getSkillLevel(skill.status);
                return (
                  <Card key={skill.id} className="bg-gray-900/50 border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{skill.skillName}</span>
                          <Badge className={`${level.bg} ${level.color} border-transparent`}>
                            {level.label}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-400">
                          {skill.attempts} attempts
                        </span>
                      </div>
                      <Progress value={skill.score} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{skill.score}% mastery</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          {!progress?.records.length ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No lessons started yet</p>
                <p className="text-gray-500 text-sm mt-1">
                  Enroll in a course and start learning
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {progress.records.map((record) => (
                <Card key={record.id} className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-gray-500">{record.courseTitle}</p>
                        <span className="text-gray-600">/</span>
                        <p className="text-sm text-gray-500">{record.moduleTitle}</p>
                      </div>
                      <p className="font-medium text-white">{record.lessonTitle}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Topic: {record.topicTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.score != null && (
                        <span className="text-sm text-gray-400">
                          Score: {record.score}%
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {Math.round(record.timeSpent / 60)}m
                      </span>
                      {getStatusBadge(record.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "First Lesson", earned: (progress?.stats.completed ?? 0) > 0, icon: BookOpen },
              { label: "10 Lessons", earned: (progress?.stats.completed ?? 0) >= 10, icon: CheckCircle2 },
              { label: "1 Hour Coded", earned: (progress?.stats.totalTimeSpent ?? 0) >= 3600, icon: Clock },
              { label: "50% Complete", earned: (progress?.stats.completionPercentage ?? 0) >= 50, icon: Trophy },
            ].map((achievement) => (
              <div
                key={achievement.label}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  achievement.earned
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-gray-800/50 border-gray-700/50 opacity-50"
                }`}
              >
                <achievement.icon
                  className={`h-6 w-6 mx-auto mb-2 ${
                    achievement.earned ? "text-yellow-400" : "text-gray-600"
                  }`}
                />
                <p className={`text-sm ${achievement.earned ? "text-yellow-400" : "text-gray-500"}`}>
                  {achievement.label}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {achievement.earned ? "Earned" : "Locked"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}