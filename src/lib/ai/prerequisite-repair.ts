/**
 * Prerequisite Repair Engine
 * Diagnoses whether a student possesses the required foundational concepts before
 * learning advanced topics, offering dynamic repair mini-lessons and scoped session transitions.
 */

import { prisma } from "@/lib/db";
import { getTopicKnowledge } from "@/lib/curriculum/intelligence";

export interface PrerequisiteCheckResult {
  hasMissingPrerequisites: boolean;
  missingPrerequisites: Array<{
    topicId: string;
    topicSlug: string;
    topicTitle: string;
    currentScore: number;
  }>;
  repairMessage?: string;
  recommendedAction?: "proceed" | "mini_repair" | "redirect_to_prerequisite";
}

export async function checkPrerequisites({
  userId,
  topicSlug,
}: {
  userId: string;
  topicSlug: string;
}): Promise<PrerequisiteCheckResult> {
  const knowledge = getTopicKnowledge(topicSlug);
  if (!knowledge || !knowledge.prerequisites || knowledge.prerequisites.length === 0) {
    return { hasMissingPrerequisites: false, missingPrerequisites: [], recommendedAction: "proceed" };
  }

  const missingList: PrerequisiteCheckResult["missingPrerequisites"] = [];

  for (const prereqSlug of knowledge.prerequisites) {
    const prereqTopic = await prisma.topic.findFirst({
      where: { slug: prereqSlug },
    });

    if (prereqTopic) {
      const studentSkill = await prisma.studentSkill.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId: prereqTopic.id,
          },
        },
      });

      const score = studentSkill?.score ?? 0;

      // If score is below 50, flag as missing/unmastered prerequisite
      if (score < 50) {
        missingList.push({
          topicId: prereqTopic.id,
          topicSlug: prereqTopic.slug,
          topicTitle: prereqTopic.title,
          currentScore: score,
        });
      }
    }
  }

  if (missingList.length > 0) {
    const topMissing = missingList[0];
    return {
      hasMissingPrerequisites: true,
      missingPrerequisites: missingList,
      recommendedAction: "mini_repair",
      repairMessage: `To truly master **${knowledge.topicTitle}**, let's first solidify your foundation in **${topMissing.topicTitle}** (current score: ${Math.round(topMissing.currentScore)}%). Would you like a 2-minute refresher before continuing?`,
    };
  }

  return {
    hasMissingPrerequisites: false,
    missingPrerequisites: [],
    recommendedAction: "proceed",
  };
}
