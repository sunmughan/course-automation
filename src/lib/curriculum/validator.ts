/**
 * Deep 6-Dimensional Pedagogical Curriculum Validator
 * Strictly audits curriculum topics across:
 * 1. Content completeness (0-20)
 * 2. Pedagogical structure (0-20)
 * 3. Executable examples & starter/solution (0-20)
 * 4. Visualization configuration & nodes (0-20)
 * 5. Assessment & diagnostic questions (0-10)
 * 6. Mastery criteria & prerequisites (0-10)
 */

import { prisma } from "@/lib/db";

export interface TopicDimensionScores {
  content: number;
  pedagogy: number;
  executability: number;
  visualization: number;
  assessment: number;
  mastery: number;
}

export interface TopicAuditResult {
  topicId: string;
  topicTitle: string;
  totalScore: number; // 0 - 100
  isCertifiedComplete: boolean;
  scores: TopicDimensionScores;
  missingElements: string[];
}

export interface CourseQualityAudit {
  courseId: string;
  courseTitle: string;
  overallScore: number;
  totalTopics: number;
  certifiedTopicsCount: number;
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
      const scores: TopicDimensionScores = {
        content: 0,
        pedagogy: 0,
        executability: 0,
        visualization: 0,
        assessment: 0,
        mastery: 0,
      };

      const lessons = topic.lessons || [];
      const concepts = lessons.flatMap((l) => l.concepts);
      const examples = lessons.flatMap((l) => l.examples);
      const exercises = lessons.flatMap((l) => l.exercises);
      const visualizations = lessons.flatMap((l) => l.visualizations);

      // 1. Content Completeness (0-20)
      if (topic.description && topic.description.length > 20) scores.content += 5;
      else missing.push("Rich Topic Description");

      if (concepts.length >= 2) scores.content += 15;
      else if (concepts.length === 1) scores.content += 8;
      else missing.push("Comprehensive Concepts (at least 2)");

      // 2. Pedagogical Structure (0-20)
      if (concepts.some((c) => c.description.length > 80)) scores.pedagogy += 10;
      else missing.push("Detailed Conceptual Explanations");

      if (examples.some((e) => e.description && e.description.length > 20)) scores.pedagogy += 10;
      else missing.push("Pedagogical Example Explanations");

      // 3. Executability (0-20)
      const hasExecutableCode = examples.some((e) => e.solutionCode && e.solutionCode.trim().length > 10);
      const hasExercises = exercises.some((ex) => ex.starterCode && ex.testCases);

      if (hasExecutableCode) scores.executability += 10;
      else missing.push("Valid Executable Solution Code");

      if (hasExercises) scores.executability += 10;
      else missing.push("Testable Practice Exercises with Test Cases");

      // 4. Visualization (0-20)
      if (visualizations.length > 0) {
        const validViz = visualizations.some((v) => {
          try {
            const parsed = JSON.parse(v.config);
            return parsed && (Array.isArray(parsed.nodes) || Array.isArray(parsed.steps));
          } catch {
            return false;
          }
        });

        if (validViz) scores.visualization += 20;
        else {
          scores.visualization += 8;
          missing.push("Valid Structured Visualization Config (nodes/edges/steps)");
        }
      } else {
        missing.push("Visual Diagram / Flowchart");
      }

      // 5. Assessment & Diagnostics (0-10)
      if (exercises.length > 0) scores.assessment += 10;
      else missing.push("Diagnostic Assessment Questions");

      // 6. Mastery & Prerequisites (0-10)
      if (topic.difficulty && topic.difficulty >= 1) scores.mastery += 5;
      if (topic.prerequisites.length > 0 || topic.order === 0) scores.mastery += 5;
      else missing.push("Prerequisite Knowledge Links");

      const totalScore =
        scores.content +
        scores.pedagogy +
        scores.executability +
        scores.visualization +
        scores.assessment +
        scores.mastery;

      const isCertifiedComplete = totalScore >= 85 && missing.length === 0;

      topicAudits.push({
        topicId: topic.id,
        topicTitle: topic.title,
        totalScore,
        isCertifiedComplete,
        scores,
        missingElements: missing,
      });
    }
  }

  const total = topicAudits.length || 1;
  const avgScore = Math.round(topicAudits.reduce((sum, t) => sum + t.totalScore, 0) / total);
  const certifiedCount = topicAudits.filter((t) => t.isCertifiedComplete).length;

  return {
    courseId: course.id,
    courseTitle: course.title,
    overallScore: avgScore,
    totalTopics: topicAudits.length,
    certifiedTopicsCount: certifiedCount,
    incompleteTopics: topicAudits.filter((t) => !t.isCertifiedComplete),
  };
}
