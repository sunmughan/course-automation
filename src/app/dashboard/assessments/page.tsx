"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Code2,
  Clock,
  Brain,
  ChevronRight,
  Send,
  Lightbulb,
  Bug,
  Trophy,
  RotateCcw,
} from "lucide-react";

interface AssessmentData {
  id: string;
  title: string;
  lessonId: string;
  timeLimit: number | null;
  passingScore: number;
  questions: Array<{
    id: string;
    type: string;
    question: string;
    code: string | null;
    options: string | null;
    correctAnswer: string;
    explanation: string | null;
    points: number;
  }>;
}

interface AssessmentResult {
  score: number;
  totalPoints: number;
  passed: boolean;
  feedback: string;
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const res = await fetch("/api/progress?type=assessments", {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setAssessments(data);
        }
      } catch {
        setError("Failed to load assessments");
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, []);

  const startAssessment = (assessment: AssessmentData) => {
    setActiveAssessment(assessment);
    setAnswers({});
    setResult(null);
  };

  const submitAssessment = async () => {
    if (!activeAssessment) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          type: "assessment",
          assessmentId: activeAssessment.id,
          answers,
        }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch {
      setError("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "mcq": return <CheckCircle2 className="h-4 w-4" />;
      case "code": return <Code2 className="h-4 w-4" />;
      case "predict": return <Brain className="h-4 w-4" />;
      case "debug": return <Bug className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (activeAssessment) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{activeAssessment.title}</h1>
            <p className="text-gray-400 mt-1">
              {activeAssessment.questions.length} questions
              {activeAssessment.timeLimit && ` • ${activeAssessment.timeLimit} min time limit`}
            </p>
          </div>
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            Passing: {activeAssessment.passingScore}%
          </Badge>
        </div>

        {result ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-8 text-center">
              <div className={`h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                result.passed ? "bg-green-500/20" : "bg-red-500/20"
              }`}>
                {result.passed ? (
                  <Trophy className="h-8 w-8 text-green-400" />
                ) : (
                  <RotateCcw className="h-8 w-8 text-red-400" />
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${
                result.passed ? "text-green-400" : "text-red-400"
              }`}>
                {result.passed ? "Assessment Passed!" : "Keep Practicing"}
              </h2>
              <p className="text-gray-400 mb-4">
                Score: {result.score}/{result.totalPoints} ({Math.round((result.score / result.totalPoints) * 100)}%)
              </p>
              <p className="text-gray-300 mb-6">{result.feedback}</p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => setActiveAssessment(null)}>
                  Back to Assessments
                </Button>
                {!result.passed && (
                  <Button onClick={() => { setResult(null); setAnswers({}); }}>
                    Retry Assessment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {activeAssessment.questions.map((q, idx) => (
                <Card key={q.id} className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getQuestionTypeIcon(q.type)}
                            <span className="ml-1 capitalize">{q.type}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">{q.points} pts</span>
                        </div>
                        <p className="text-white">{q.question}</p>
                        {q.code && (
                          <pre className="bg-gray-950 p-3 rounded-lg text-sm text-gray-300 overflow-x-auto">
                            <code>{q.code}</code>
                          </pre>
                        )}
                        {q.type === "mcq" && q.options ? (
                          <div className="space-y-2">
                            {JSON.parse(q.options).map((opt: string, i: number) => (
                              <label
                                key={i}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  answers[q.id] === opt
                                    ? "border-blue-500/50 bg-blue-500/10"
                                    : "border-gray-700 hover:border-gray-600"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={answers[q.id] === opt}
                                  onChange={(e) =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                  }
                                  className="text-blue-500"
                                />
                                <span className="text-gray-300">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <Textarea
                            placeholder="Type your answer..."
                            value={answers[q.id] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            className="bg-gray-950 border-gray-700 text-white min-h-[80px]"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={submitAssessment}
                disabled={submitting || Object.keys(answers).length < activeAssessment.questions.length}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Assessments</h1>
        <p className="text-gray-400 mt-1">Test your knowledge and track your mastery</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {assessments.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-12 text-center">
            <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No assessments available yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Complete lessons to unlock assessments
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessments.map((assessment) => (
            <Card
              key={assessment.id}
              className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => startAssessment(assessment)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{assessment.title}</CardTitle>
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {assessment.questions.length} questions
                  </span>
                  {assessment.timeLimit && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {assessment.timeLimit} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Pass: {assessment.passingScore}%
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}