import { apiHandler } from "@/lib/api-handler";
import { buildSkillGraph, getTopicSkillBreakdown } from "@/lib/adaptive/skill-graph";
import { NotFoundError } from "@/lib/errors";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const { searchParams } = new URL(ctx.request.url);
  const type = searchParams.get("type");
  const courseId = searchParams.get("courseId") || undefined;
  const topicId = searchParams.get("topicId");

  if (type === "breakdown") {
    if (!topicId) {
      return { error: "topicId is required for breakdown" };
    }
    const breakdown = await getTopicSkillBreakdown(user.id, topicId);
    return { breakdown };
  }

  const graph = await buildSkillGraph(user.id, courseId);

  const nodes = Array.from(graph.nodes.values()).map((node) => ({
    topicId: node.topicId,
    topicName: node.topicName,
    skillName: node.skillName,
    score: node.score,
    level: node.level,
    attempts: node.attempts,
    lastAttemptAt: node.lastAttemptAt?.toISOString() || null,
    dependencies: node.dependencies,
    dependents: node.dependents,
    isWeak: node.isWeak,
    masteryPercent: node.masteryPercent,
  }));

  return {
    graph: {
      nodes,
      edges: graph.edges,
      overallLevel: graph.overallLevel,
      overallScore: graph.overallScore,
      totalTopics: graph.totalTopics,
      masteredTopics: graph.masteredTopics,
      weakTopics: graph.weakTopics,
      strongestTopics: graph.strongestTopics,
    },
  };
}, { requireAuth: true });