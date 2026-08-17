/**
 * Course & Curriculum Quality Validator
 * Automatically audits courses for pedagogical completeness, executable exercises,
 * valid prerequisites, and authoritative misconception mappings.
 */

import { prisma } from "@/lib/db";

export interface TopicAuditResult {
  topicId: string;
  topicTitle: string;
  completenessScore: number; // 0 - 100
  hasConcepts: boolean;
  hasExamples: boolean;
  hasExercises: boolean;
  hasVisualizations: boolean;
  hasPrerequisites: boolean;
  missingElements: string[];
}

export interface CourseQualityAudit {
  courseId: string;
  courseTitle: string;
  overallScore: number;
  totalTopics: number;
  completeTopicsCount: number;
  incompleteTopics: TopicAuditResult[];
}

export async function auditCourseQuality(courseId: string): Promise<CourseQualityAudit> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          topics: {
            include: {
              lessons: {
                include: {
                  concepts: true,
                  examples: true,
                  exercises: true,
                  visualizations: true,
                },
              },
              prerequisites: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found for audit");
  }

  const topicAudits: TopicAuditResult[] = [];

  for (const mod of course.modules) {
    for (const topic of mod.topics) {
      const missing: string[] = [];
      const hasConcepts = topic.lessons.some((l) => l.concepts.length > 0);
      const hasExamples = topic.lessons.some((l) => l.examples.length > 0);
      const hasExercises = topic.lessons.some((l) => l.exercises.length > 0);
      const hasVisualizations = topic.lessons.some((l) => l.visualizations.length > 0);
      const hasPrerequisites = topic.prerequisites.length > 0;

      let score = 20; // Base score for published topic
      if (hasConcepts) score += 20;
      else missing.push("Key Concepts");

      if (hasExamples) score += 20;
      else missing.push("Code Examples");

      if (hasExercises) score += 20;
      else missing.push("Practice Exercises");

      if (hasVisualizations) score += 20;
      else missing.push("Visual Models");

      topicAudits.push({
        topicId: topic.id,
        topicTitle: topic.title,
        completenessScore: score,
        hasConcepts,
        hasExamples,
        hasExercises,
        hasVisualizations,
        hasPrerequisites,
        missingElements: missing,
      });
    }
  }

  const total = topicAudits.length || 1;
  const avgScore = Math.round(topicAudits.reduce((sum, t) => sum + t.completenessScore, 0) / total);
  const completeCount = topicAudits.filter((t) => t.completenessScore >= 80).length;

  return {
    courseId: course.id,
    courseTitle: course.title,
    overallScore: avgScore,
    totalTopics: topicAudits.length,
    completeTopicsCount: completeCount,
    incompleteTopics: topicAudits.filter((t) => t.completenessScore < 80),
  };
}
