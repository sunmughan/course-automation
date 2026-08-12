import { prisma } from "@/lib/db";
import { buildSkillGraph } from "./skill-graph";
import { detectWeakTopics, type WeakTopic } from "./weak-detection";
import { getDueReviews } from "./spaced-repetition";

export interface RevisionPlan {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  topics: RevisionTopic[];
  estimatedTimeMinutes: number;
  totalItems: number;
}

export interface RevisionTopic {
  topicId: string;
  topicName: string;
  reason: string;
  actions: string[];
  suggestedMode: string;
  isDue: boolean;
  isOverdue: boolean;
  skillLevel: string;
  masteryPercent: number;
}

export interface RevisionSummary {
  plans: RevisionPlan[];
  weakTopics: WeakTopic[];
  dueCount: number;
  overdueCount: number;
  totalTopics: number;
  masteredTopics: number;
  overallRecommendation: string;
}

export async function generateRevisionPlan(
  userId: string,
  courseId?: string
): Promise<RevisionSummary> {
  const [graph, weakTopics, dueReviews] = await Promise.all([
    buildSkillGraph(userId, courseId),
    detectWeakTopics(userId, courseId),
    getDueReviews(userId, courseId),
  ]);

  const plans: RevisionPlan[] = [];
  const dueCount = dueReviews.filter((r) => r.isDue).length;
  const overdueCount = dueReviews.filter((r) => r.isOverdue).length;

  const urgentTopics = weakTopics.filter((w) => w.priority >= 70 || dueReviews.some((r) => r.topicId === w.topicId && r.isOverdue));
  if (urgentTopics.length > 0) {
    const revisionTopics: RevisionTopic[] = urgentTopics.map((w) => {
      const review = dueReviews.find((r) => r.topicId === w.topicId);
      return {
        topicId: w.topicId,
        topicName: w.topicName,
        reason: w.reasons[0] || "Needs attention",
        actions: w.recommendedActions,
        suggestedMode: w.skillLevel === "beginner" ? "explain" : "practice",
        isDue: review?.isDue ?? false,
        isOverdue: review?.isOverdue ?? false,
        skillLevel: w.skillLevel,
        masteryPercent: w.masteryPercent,
      };
    });

    plans.push({
      title: "Urgent Review",
      description: "Topics that need immediate attention based on your performance and review schedule.",
      priority: "high",
      topics: revisionTopics,
      estimatedTimeMinutes: revisionTopics.length * 15,
      totalItems: revisionTopics.length,
    });
  }

  const dueTopics = dueReviews.filter((r) => r.isDue && !urgentTopics.some((w) => w.topicId === r.topicId));
  if (dueTopics.length > 0) {
    const revisionTopics: RevisionTopic[] = dueTopics.map((r) => {
      const node = graph.nodes.get(r.topicId);
      return {
        topicId: r.topicId,
        topicName: r.topicName,
        reason: `Due for spaced repetition review (${r.reviewCount > 0 ? `review #${r.reviewCount + 1}` : "first review"})`,
        actions: ["Review the lesson content", "Complete a quick practice exercise", "Rate your understanding after review"],
        suggestedMode: "review",
        isDue: true,
        isOverdue: r.isOverdue,
        skillLevel: node?.level ?? "developing",
        masteryPercent: node?.masteryPercent ?? 0,
      };
    });

    plans.push({
      title: "Scheduled Review",
      description: "Topics due for review based on spaced repetition scheduling.",
      priority: "medium",
      topics: revisionTopics,
      estimatedTimeMinutes: revisionTopics.length * 10,
      totalItems: revisionTopics.length,
    });
  }

  const upcomingTopics = dueReviews.filter((r) => !r.isDue && !r.isOverdue);
  if (upcomingTopics.length > 0) {
    const revisionTopics: RevisionTopic[] = upcomingTopics.slice(0, 5).map((r) => {
      const node = graph.nodes.get(r.topicId);
      return {
        topicId: r.topicId,
        topicName: r.topicName,
        reason: `Upcoming review on ${r.nextReview.toLocaleDateString()}`,
        actions: ["Preview the material to stay ahead", "Check if you remember the key concepts"],
        suggestedMode: "review",
        isDue: false,
        isOverdue: false,
        skillLevel: node?.level ?? "developing",
        masteryPercent: node?.masteryPercent ?? 0,
      };
    });

    plans.push({
      title: "Upcoming Reviews",
      description: "Topics coming up for review soon.",
      priority: "low",
      topics: revisionTopics,
      estimatedTimeMinutes: revisionTopics.length * 5,
      totalItems: revisionTopics.length,
    });
  }

  let overallRecommendation: string;
  if (overdueCount > 0) {
    overallRecommendation = `You have ${overdueCount} overdue review${overdueCount > 1 ? "s" : ""}. Focus on urgent topics first, then move to scheduled reviews.`;
  } else if (dueCount > 0) {
    overallRecommendation = `You have ${dueCount} topic${dueCount > 1 ? "s" : ""} due for review. Stay on track with your spaced repetition schedule.`;
  } else if (weakTopics.length > 0) {
    overallRecommendation = `You have ${weakTopics.length} weak area${weakTopics.length > 1 ? "s" : ""}. Dedicate some time to strengthening these topics.`;
  } else {
    overallRecommendation = `Great job! You're on track. Keep up the momentum and explore new topics.`;
  }

  return {
    plans,
    weakTopics,
    dueCount,
    overdueCount,
    totalTopics: graph.totalTopics,
    masteredTopics: graph.masteredTopics,
    overallRecommendation,
  };
}

export async function generateTopicRevisionContent(topicId: string): Promise<{
  topic: { id: string; title: string; description: string };
  lessons: Array<{ id: string; title: string; keyConcepts: string[] }>;
  exercises: Array<{ id: string; title: string; difficulty: number }>;
  mistakes: Array<{ error: string; fix: string | null }>;
}> {
  const [topic, lessons, exercises, mistakes] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, title: true, description: true },
    }),
    prisma.lesson.findMany({
      where: { topicId, published: true },
      select: {
        id: true,
        title: true,
        concepts: { select: { title: true }, take: 5 },
      },
      orderBy: { order: "asc" },
    }),
    prisma.exercise.findMany({
      where: { lesson: { topicId } },
      select: { id: true, title: true, difficulty: true },
      orderBy: { difficulty: "asc" },
      take: 5,
    }),
    prisma.studentMistake.findMany({
      where: { topicId },
      select: { error: true, fix: true },
      orderBy: { count: "desc" },
      take: 5,
    }),
  ]);

  return {
    topic: topic || { id: topicId, title: "Unknown Topic", description: "" },
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      keyConcepts: l.concepts.map((c) => c.title),
    })),
    exercises: exercises.map((e) => ({ id: e.id, title: e.title, difficulty: e.difficulty })),
    mistakes: mistakes.map((m) => ({ error: m.error, fix: m.fix })),
  };
}