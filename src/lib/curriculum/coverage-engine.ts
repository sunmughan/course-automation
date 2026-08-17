import { prisma } from "@/lib/db";

export type CoverageDimension =
  | "theory"
  | "prerequisites"
  | "simpleExample"
  | "multipleExamples"
  | "interactive"
  | "visualization"
  | "execution"
  | "commonMistakes"
  | "practice"
  | "assessment"
  | "realWorld"
  | "advanced"
  | "production"
  | "interview";

export interface DimensionConfig {
  label: string;
  description: string;
  isMandatory: boolean;
  weight: number;
}

export const COVERAGE_DIMENSIONS: Record<CoverageDimension, DimensionConfig> = {
  theory: {
    label: "Theory",
    description: "Core conceptual explanation and theoretical foundations",
    isMandatory: true,
    weight: 1,
  },
  prerequisites: {
    label: "Prerequisites",
    description: "Prerequisite dependencies or explicit foundation designation",
    isMandatory: true,
    weight: 1,
  },
  simpleExample: {
    label: "Simple Example",
    description: "At least one clear code example with explanation",
    isMandatory: true,
    weight: 1,
  },
  multipleExamples: {
    label: "Multiple Examples",
    description: "Two or more code examples covering multiple scenarios or edge cases",
    isMandatory: false,
    weight: 1,
  },
  interactive: {
    label: "Interactive Example",
    description: "Hands-on runnable starter code or interactive simulation",
    isMandatory: true,
    weight: 1,
  },
  visualization: {
    label: "Visualization",
    description: "Flowchart, memory diagram, callstack trace, or architectural visualization",
    isMandatory: true,
    weight: 1,
  },
  execution: {
    label: "Execution",
    description: "Runnable code blocks with executable test cases and expected outputs",
    isMandatory: true,
    weight: 1,
  },
  commonMistakes: {
    label: "Common Mistakes",
    description: "Documented misconceptions, pitfalls, or gotcha hints",
    isMandatory: false,
    weight: 1,
  },
  practice: {
    label: "Practice",
    description: "Structured coding exercise with test verification and solution",
    isMandatory: true,
    weight: 1,
  },
  assessment: {
    label: "Assessment",
    description: "Quiz or evaluation questions testing concept understanding",
    isMandatory: true,
    weight: 1,
  },
  realWorld: {
    label: "Real World",
    description: "Practical industry use-cases and applications",
    isMandatory: false,
    weight: 1,
  },
  advanced: {
    label: "Advanced",
    description: "Deep-dive nuances, underlying mechanics, and complex scenarios",
    isMandatory: false,
    weight: 1,
  },
  production: {
    label: "Production",
    description: "Production readiness, performance, security, and best practices",
    isMandatory: false,
    weight: 1,
  },
  interview: {
    label: "Interview",
    description: "Technical interview problems, complexity analysis, or common questions",
    isMandatory: false,
    weight: 1,
  },
};

export const TOTAL_DIMENSIONS_COUNT = Object.keys(COVERAGE_DIMENSIONS).length; // 14
export const MANDATORY_DIMENSIONS = (
  Object.keys(COVERAGE_DIMENSIONS) as CoverageDimension[]
).filter((dim) => COVERAGE_DIMENSIONS[dim].isMandatory);

export interface DimensionEvaluation {
  dimension: CoverageDimension;
  label: string;
  description: string;
  satisfied: boolean;
  isMandatory: boolean;
  evidence?: string;
}

export interface TopicCoverageReport {
  topicId: string;
  title: string;
  slug: string;
  difficulty: number;
  dimensions: Record<CoverageDimension, DimensionEvaluation>;
  satisfiedCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
  status: "complete" | "incomplete" | "minimal";
  missingArtifacts: string[];
  mandatoryMissing: string[];
}

export interface ModuleCoverageReport {
  moduleId: string;
  title: string;
  slug: string;
  topicCount: number;
  completeTopicCount: number;
  topics: TopicCoverageReport[];
  percentage: number;
  isComplete: boolean;
  missingArtifactsSummary: Record<string, number>;
}

export interface CourseCoverageReport {
  courseId: string;
  title: string;
  slug: string;
  stream: string;
  published: boolean;
  totalModules: number;
  totalTopics: number;
  completeTopics: number;
  overallPercentage: number;
  isFullyCovered: boolean;
  canPublish: boolean;
  publishBlockers: string[];
  modules: ModuleCoverageReport[];
  summary: {
    totalRequirements: number;
    satisfiedRequirements: number;
    missingRequirements: number;
  };
}

/**
 * Evaluates a topic against all 14 coverage dimensions
 */
export function evaluateTopicDimensions(topic: any): Record<CoverageDimension, DimensionEvaluation> {
  const lessons = Array.isArray(topic.lessons) ? topic.lessons : [];
  const primaryLesson = lessons[0] || null;

  const contentText = [
    topic.description || "",
    ...lessons.map((l: any) => `${l.content || ""} ${l.explanation || ""}`),
  ].join(" ").toLowerCase();

  const concepts = lessons.flatMap((l: any) => l.concepts || []);
  const examples = lessons.flatMap((l: any) => l.examples || []);
  const exercises = lessons.flatMap((l: any) => l.exercises || []);
  const visualizations = lessons.flatMap((l: any) => l.visualizations || []);
  const assessments = lessons.flatMap((l: any) => l.assessments || []);
  const prerequisites = Array.isArray(topic.prerequisites) ? topic.prerequisites : [];

  // 1. Theory
  const hasTheory =
    (primaryLesson &&
      primaryLesson.content &&
      primaryLesson.content.trim().length > 40 &&
      primaryLesson.explanation &&
      primaryLesson.explanation.trim().length > 20) ||
    concepts.length > 0;

  // 2. Prerequisites
  const hasPrerequisites =
    prerequisites.length > 0 ||
    topic.difficulty === 1 ||
    contentText.includes("prerequisite") ||
    contentText.includes("foundation") ||
    contentText.includes("beginner");

  // 3. Simple Example
  const hasSimpleExample =
    examples.length >= 1 &&
    examples.some((ex: any) => (ex.starterCode || ex.solutionCode) && ex.starterCode?.trim().length > 0);

  // 4. Multiple Examples
  const hasMultipleExamples =
    examples.length >= 2 &&
    examples.every((ex: any) => (ex.starterCode || ex.solutionCode) && ex.starterCode?.trim().length > 0);

  // 5. Interactive Example
  const hasInteractive =
    exercises.length > 0 ||
    examples.some((ex: any) => ex.starterCode && ex.starterCode.includes("// Your code here")) ||
    contentText.includes("interactive") ||
    contentText.includes("simulation");

  // 6. Visualization
  const hasVisualization =
    visualizations.length > 0 ||
    contentText.includes("diagram") ||
    contentText.includes("flowchart") ||
    contentText.includes("visualization") ||
    contentText.includes("call stack") ||
    contentText.includes("memory model");

  // 7. Execution
  const hasExecution =
    exercises.some((ex: any) => ex.testCases && ex.testCases.trim().length > 0) ||
    examples.some((ex: any) => ex.solutionCode && ex.solutionCode.trim().length > 0);

  // 8. Common Mistakes
  const hasCommonMistakes =
    contentText.includes("mistake") ||
    contentText.includes("pitfall") ||
    contentText.includes("gotcha") ||
    contentText.includes("misconception") ||
    contentText.includes("avoid") ||
    exercises.some((ex: any) => ex.hints && ex.hints.toLowerCase().includes("avoid"));

  // 9. Practice
  const hasPractice =
    exercises.length > 0 &&
    exercises.some((ex: any) => ex.instructions || ex.description);

  // 10. Assessment
  const hasAssessment =
    assessments.length > 0 ||
    exercises.some((ex: any) => ex.testCases && ex.testCases.trim().length > 0) ||
    contentText.includes("quiz") ||
    contentText.includes("assessment") ||
    contentText.includes("check for understanding");

  // 11. Real World
  const hasRealWorld =
    contentText.includes("real-world") ||
    contentText.includes("real world") ||
    contentText.includes("practical") ||
    contentText.includes("industry") ||
    contentText.includes("in practice") ||
    contentText.includes("production use");

  // 12. Advanced
  const hasAdvanced =
    topic.difficulty >= 3 ||
    contentText.includes("advanced") ||
    contentText.includes("deep dive") ||
    contentText.includes("under the hood") ||
    contentText.includes("internals") ||
    contentText.includes("nuance") ||
    concepts.length >= 3;

  // 13. Production
  const hasProduction =
    contentText.includes("production") ||
    contentText.includes("performance") ||
    contentText.includes("best practice") ||
    contentText.includes("security") ||
    contentText.includes("optimization") ||
    contentText.includes("scalability");

  // 14. Interview
  const hasInterview =
    contentText.includes("interview") ||
    contentText.includes("complexity") ||
    contentText.includes("time complexity") ||
    contentText.includes("space complexity") ||
    contentText.includes("big o") ||
    contentText.includes("technical question");

  const results: Record<CoverageDimension, DimensionEvaluation> = {
    theory: {
      dimension: "theory",
      label: COVERAGE_DIMENSIONS.theory.label,
      description: COVERAGE_DIMENSIONS.theory.description,
      satisfied: Boolean(hasTheory),
      isMandatory: COVERAGE_DIMENSIONS.theory.isMandatory,
      evidence: hasTheory ? `Lesson text & ${concepts.length} concepts` : "Missing detailed explanation/concepts",
    },
    prerequisites: {
      dimension: "prerequisites",
      label: COVERAGE_DIMENSIONS.prerequisites.label,
      description: COVERAGE_DIMENSIONS.prerequisites.description,
      satisfied: Boolean(hasPrerequisites),
      isMandatory: COVERAGE_DIMENSIONS.prerequisites.isMandatory,
      evidence: hasPrerequisites ? `${prerequisites.length} prerequisites linked` : "No prerequisites configured",
    },
    simpleExample: {
      dimension: "simpleExample",
      label: COVERAGE_DIMENSIONS.simpleExample.label,
      description: COVERAGE_DIMENSIONS.simpleExample.description,
      satisfied: Boolean(hasSimpleExample),
      isMandatory: COVERAGE_DIMENSIONS.simpleExample.isMandatory,
      evidence: hasSimpleExample ? `${examples.length} example(s) present` : "No code examples present",
    },
    multipleExamples: {
      dimension: "multipleExamples",
      label: COVERAGE_DIMENSIONS.multipleExamples.label,
      description: COVERAGE_DIMENSIONS.multipleExamples.description,
      satisfied: Boolean(hasMultipleExamples),
      isMandatory: COVERAGE_DIMENSIONS.multipleExamples.isMandatory,
      evidence: hasMultipleExamples ? `${examples.length} examples present` : "Requires at least 2 code examples",
    },
    interactive: {
      dimension: "interactive",
      label: COVERAGE_DIMENSIONS.interactive.label,
      description: COVERAGE_DIMENSIONS.interactive.description,
      satisfied: Boolean(hasInteractive),
      isMandatory: COVERAGE_DIMENSIONS.interactive.isMandatory,
      evidence: hasInteractive ? "Interactive starter code or exercise" : "Missing interactive code exercise",
    },
    visualization: {
      dimension: "visualization",
      label: COVERAGE_DIMENSIONS.visualization.label,
      description: COVERAGE_DIMENSIONS.visualization.description,
      satisfied: Boolean(hasVisualization),
      isMandatory: COVERAGE_DIMENSIONS.visualization.isMandatory,
      evidence: hasVisualization ? `${visualizations.length} visualization schema(s)` : "Missing visual diagram/model",
    },
    execution: {
      dimension: "execution",
      label: COVERAGE_DIMENSIONS.execution.label,
      description: COVERAGE_DIMENSIONS.execution.description,
      satisfied: Boolean(hasExecution),
      isMandatory: COVERAGE_DIMENSIONS.execution.isMandatory,
      evidence: hasExecution ? "Executable test cases & solution" : "Missing executable test cases/solution",
    },
    commonMistakes: {
      dimension: "commonMistakes",
      label: COVERAGE_DIMENSIONS.commonMistakes.label,
      description: COVERAGE_DIMENSIONS.commonMistakes.description,
      satisfied: Boolean(hasCommonMistakes),
      isMandatory: COVERAGE_DIMENSIONS.commonMistakes.isMandatory,
      evidence: hasCommonMistakes ? "Common pitfalls/gotchas covered" : "No common mistakes/pitfalls identified",
    },
    practice: {
      dimension: "practice",
      label: COVERAGE_DIMENSIONS.practice.label,
      description: COVERAGE_DIMENSIONS.practice.description,
      satisfied: Boolean(hasPractice),
      isMandatory: COVERAGE_DIMENSIONS.practice.isMandatory,
      evidence: hasPractice ? `${exercises.length} practice exercise(s)` : "No practice exercises configured",
    },
    assessment: {
      dimension: "assessment",
      label: COVERAGE_DIMENSIONS.assessment.label,
      description: COVERAGE_DIMENSIONS.assessment.description,
      satisfied: Boolean(hasAssessment),
      isMandatory: COVERAGE_DIMENSIONS.assessment.isMandatory,
      evidence: hasAssessment ? "Assessment questions / tests present" : "Missing assessment questions/tests",
    },
    realWorld: {
      dimension: "realWorld",
      label: COVERAGE_DIMENSIONS.realWorld.label,
      description: COVERAGE_DIMENSIONS.realWorld.description,
      satisfied: Boolean(hasRealWorld),
      isMandatory: COVERAGE_DIMENSIONS.realWorld.isMandatory,
      evidence: hasRealWorld ? "Industry context documented" : "Missing real-world application context",
    },
    advanced: {
      dimension: "advanced",
      label: COVERAGE_DIMENSIONS.advanced.label,
      description: COVERAGE_DIMENSIONS.advanced.description,
      satisfied: Boolean(hasAdvanced),
      isMandatory: COVERAGE_DIMENSIONS.advanced.isMandatory,
      evidence: hasAdvanced ? "Advanced nuances covered" : "Missing advanced mechanics/edge cases",
    },
    production: {
      dimension: "production",
      label: COVERAGE_DIMENSIONS.production.label,
      description: COVERAGE_DIMENSIONS.production.description,
      satisfied: Boolean(hasProduction),
      isMandatory: COVERAGE_DIMENSIONS.production.isMandatory,
      evidence: hasProduction ? "Production/performance best practices covered" : "Missing production best practices",
    },
    interview: {
      dimension: "interview",
      label: COVERAGE_DIMENSIONS.interview.label,
      description: COVERAGE_DIMENSIONS.interview.description,
      satisfied: Boolean(hasInterview),
      isMandatory: COVERAGE_DIMENSIONS.interview.isMandatory,
      evidence: hasInterview ? "Interview/complexity context covered" : "Missing interview/complexity scenario",
    },
  };

  return results;
}

/**
 * Analyzes coverage for a single topic
 */
export function analyzeTopicCoverage(topic: any): TopicCoverageReport {
  const dimensions = evaluateTopicDimensions(topic);
  const totalCount = TOTAL_DIMENSIONS_COUNT;
  let satisfiedCount = 0;
  const missingArtifacts: string[] = [];
  const mandatoryMissing: string[] = [];

  for (const [key, dim] of Object.entries(dimensions) as [CoverageDimension, DimensionEvaluation][]) {
    if (dim.satisfied) {
      satisfiedCount++;
    } else {
      missingArtifacts.push(dim.label);
      if (dim.isMandatory) {
        mandatoryMissing.push(dim.label);
      }
    }
  }

  const percentage = Math.round((satisfiedCount / totalCount) * 100);
  const isComplete = mandatoryMissing.length === 0 && percentage >= 70;
  let status: "complete" | "incomplete" | "minimal" = "incomplete";
  if (isComplete && percentage >= 90) {
    status = "complete";
  } else if (percentage < 40) {
    status = "minimal";
  }

  return {
    topicId: topic.id || topic.slug,
    title: topic.title,
    slug: topic.slug,
    difficulty: topic.difficulty || 1,
    dimensions,
    satisfiedCount,
    totalCount,
    percentage,
    isComplete,
    status,
    missingArtifacts,
    mandatoryMissing,
  };
}

/**
 * Analyzes coverage for a module
 */
export function analyzeModuleCoverage(module: any): ModuleCoverageReport {
  const topics = Array.isArray(module.topics) ? module.topics : [];
  const topicReports = topics.map(analyzeTopicCoverage);

  const totalPossible = topicReports.length * TOTAL_DIMENSIONS_COUNT;
  const totalSatisfied = topicReports.reduce((sum: number, t: TopicCoverageReport) => sum + t.satisfiedCount, 0);
  const percentage = totalPossible > 0 ? Math.round((totalSatisfied / totalPossible) * 100) : 0;
  const completeTopicCount = topicReports.filter((t: TopicCoverageReport) => t.isComplete).length;
  const isComplete = topicReports.length > 0 && completeTopicCount === topicReports.length;

  const missingArtifactsSummary: Record<string, number> = {};
  for (const t of topicReports) {
    for (const missing of t.missingArtifacts) {
      missingArtifactsSummary[missing] = (missingArtifactsSummary[missing] || 0) + 1;
    }
  }

  return {
    moduleId: module.id || module.slug,
    title: module.title,
    slug: module.slug,
    topicCount: topicReports.length,
    completeTopicCount,
    topics: topicReports,
    percentage,
    isComplete,
    missingArtifactsSummary,
  };
}

/**
 * Analyzes coverage for an entire course from the database
 */
export async function analyzeCourseCoverage(
  courseIdOrSlug: string
): Promise<CourseCoverageReport | null> {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
    },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          topics: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: {
                  concepts: true,
                  examples: true,
                  exercises: true,
                  visualizations: true,
                  assessments: {
                    include: {
                      questions: true,
                    },
                  },
                },
              },
              prerequisites: {
                include: {
                  prerequisite: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  const moduleReports = course.modules.map(analyzeModuleCoverage);
  const allTopics = moduleReports.flatMap((m) => m.topics);
  const totalTopics = allTopics.length;
  const completeTopics = allTopics.filter((t) => t.isComplete).length;

  const totalRequirements = totalTopics * TOTAL_DIMENSIONS_COUNT;
  const satisfiedRequirements = allTopics.reduce((sum, t) => sum + t.satisfiedCount, 0);
  const missingRequirements = totalRequirements - satisfiedRequirements;

  const overallPercentage =
    totalRequirements > 0 ? Math.round((satisfiedRequirements / totalRequirements) * 100) : 0;
  const isFullyCovered = totalTopics > 0 && completeTopics === totalTopics && overallPercentage >= 90;

  const publishBlockers: string[] = [];
  if (totalTopics === 0) {
    publishBlockers.push("Course contains no topics");
  }
  for (const t of allTopics) {
    if (t.mandatoryMissing.length > 0) {
      publishBlockers.push(
        `Topic "${t.title}" is missing mandatory artifacts: ${t.mandatoryMissing.join(", ")}`
      );
    }
  }

  const canPublish = publishBlockers.length === 0;

  return {
    courseId: course.id,
    title: course.title,
    slug: course.slug,
    stream: course.stream,
    published: course.published,
    totalModules: moduleReports.length,
    totalTopics,
    completeTopics,
    overallPercentage,
    isFullyCovered,
    canPublish,
    publishBlockers,
    modules: moduleReports,
    summary: {
      totalRequirements,
      satisfiedRequirements,
      missingRequirements,
    },
  };
}

/**
 * Gets global coverage summary across all courses
 */
export async function getCurriculumCoverageSummary(stream?: string) {
  const courses = await prisma.course.findMany({
    where: stream ? { stream } : undefined,
    select: { id: true, slug: true },
    orderBy: { order: "asc" },
  });

  const reports: CourseCoverageReport[] = [];
  for (const c of courses) {
    const rep = await analyzeCourseCoverage(c.id);
    if (rep) reports.push(rep);
  }

  const totalCourses = reports.length;
  const totalTopics = reports.reduce((sum, c) => sum + c.totalTopics, 0);
  const completeTopics = reports.reduce((sum, c) => sum + c.completeTopics, 0);
  const totalReqs = reports.reduce((sum, c) => sum + c.summary.totalRequirements, 0);
  const satisfiedReqs = reports.reduce((sum, c) => sum + c.summary.satisfiedRequirements, 0);

  const globalPercentage = totalReqs > 0 ? Math.round((satisfiedReqs / totalReqs) * 100) : 0;

  return {
    courses: reports,
    globalPercentage,
    totalCourses,
    totalTopics,
    completeTopics,
  };
}

/**
 * Guard that prevents publishing courses with missing mandatory artifacts
 */
export async function canPublishCourse(
  courseId: string
): Promise<{ allowed: boolean; reasons: string[] }> {
  const report = await analyzeCourseCoverage(courseId);
  if (!report) {
    return { allowed: false, reasons: ["Course not found"] };
  }

  return {
    allowed: report.canPublish,
    reasons: report.publishBlockers,
  };
}
