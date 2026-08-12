import { apiHandler } from "@/lib/api-handler";
import { generateRevisionPlan, generateTopicRevisionContent } from "@/lib/adaptive/revision-engine";
import { getDueReviews, getRevisionSchedule, markTopicReviewed } from "@/lib/adaptive/spaced-repetition";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const { searchParams } = new URL(ctx.request.url);
  const type = searchParams.get("type") || "plan";
  const courseId = searchParams.get("courseId") || undefined;
  const topicId = searchParams.get("topicId");
  const days = parseInt(searchParams.get("days") || "7", 10);

  if (type === "content") {
    if (!topicId) {
      return { error: "topicId is required for content" };
    }
    const content = await generateTopicRevisionContent(topicId);
    return { content };
  }

  if (type === "schedule") {
    const schedule = await getRevisionSchedule(user.id, courseId, days);
    return {
      schedule: schedule.schedule.map((s) => ({
        date: s.date,
        items: s.items.map((i) => ({
          id: i.id,
          topicId: i.topicId,
          topicName: i.topicName,
          reviewCount: i.reviewCount,
          easeFactor: i.easeFactor,
          interval: i.interval,
          nextReview: i.nextReview.toISOString(),
          lastReview: i.lastReview?.toISOString() || null,
          isDue: i.isDue,
          isOverdue: i.isOverdue,
        })),
      })),
      totalDue: schedule.totalDue,
      totalOverdue: schedule.totalOverdue,
    };
  }

  if (type === "due") {
    const reviews = await getDueReviews(user.id, courseId);
    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        topicId: r.topicId,
        topicName: r.topicName,
        reviewCount: r.reviewCount,
        easeFactor: r.easeFactor,
        interval: r.interval,
        nextReview: r.nextReview.toISOString(),
        lastReview: r.lastReview?.toISOString() || null,
        isDue: r.isDue,
        isOverdue: r.isOverdue,
      })),
      totalDue: reviews.filter((r) => r.isDue).length,
      totalOverdue: reviews.filter((r) => r.isOverdue).length,
    };
  }

  const plan = await generateRevisionPlan(user.id, courseId);

  return {
    revision: {
      plans: plan.plans.map((p) => ({
        title: p.title,
        description: p.description,
        priority: p.priority,
        topics: p.topics.map((t) => ({
          topicId: t.topicId,
          topicName: t.topicName,
          reason: t.reason,
          actions: t.actions,
          suggestedMode: t.suggestedMode,
          isDue: t.isDue,
          isOverdue: t.isOverdue,
          skillLevel: t.skillLevel,
          masteryPercent: t.masteryPercent,
        })),
        estimatedTimeMinutes: p.estimatedTimeMinutes,
        totalItems: p.totalItems,
      })),
      weakTopics: plan.weakTopics.map((w) => ({
        topicId: w.topicId,
        topicName: w.topicName,
        skillLevel: w.skillLevel,
        score: w.score,
        priority: w.priority,
      })),
      dueCount: plan.dueCount,
      overdueCount: plan.overdueCount,
      totalTopics: plan.totalTopics,
      masteredTopics: plan.masteredTopics,
      overallRecommendation: plan.overallRecommendation,
    },
  };
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const body = await ctx.request.json();
  const { topicId, quality } = body;

  if (!topicId) {
    return { error: "topicId is required" };
  }

  await markTopicReviewed(user.id, topicId, quality ?? 3);

  return { success: true, topicId };
}, { requireAuth: true });