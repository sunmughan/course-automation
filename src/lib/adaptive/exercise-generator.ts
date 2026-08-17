import { prisma } from "@/lib/db";
import { aiRouter } from "@/lib/ai/router";
import { validateExecutableExercise } from "@/lib/curriculum/executable-contract";
import { z } from "zod";

export interface GeneratedExercise {
  id?: string;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  solutionCode: string;
  testCases: string;
  difficulty: number;
  focusArea: string;
  hints: string[];
  explanation?: string;
  topicId: string;
  topicName: string;
  isPersisted?: boolean;
}

export interface ExerciseRequest {
  userId: string;
  topicId?: string;
  count?: number;
  difficulty?: number;
  language?: string;
  focusArea?: string;
  persist?: boolean;
}

const AIExerciseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  instructions: z.string().min(10),
  starterCode: z.string().min(5),
  solutionCode: z.string().min(15),
  testCases: z.string().min(10),
  hints: z.array(z.string()).min(1),
  explanation: z.string().optional(),
  difficulty: z.number().int().min(1).max(5),
  focusArea: z.string().default("general"),
});

/**
 * Builds the AI prompt incorporating student skill, topic context, difficulty, and previous mistakes.
 */
export function buildExerciseGenerationPrompt(params: {
  topicTitle: string;
  language: string;
  difficulty: number;
  skillScore?: number;
  skillLevel?: string;
  mistakes: Array<{ error: string; count: number; code?: string }>;
  focusArea: string;
}): Array<{ role: "system" | "user"; content: string }> {
  const { topicTitle, language, difficulty, skillScore = 50, skillLevel = "DEVELOPING", mistakes, focusArea } = params;

  const mistakesSummary = mistakes.length > 0
    ? mistakes.map((m) => `- Error: "${m.error}" (occurred ${m.count} times)${m.code ? ` in code snippet: ${m.code.slice(0, 100)}` : ""}`).join("\n")
    : "No previous recorded mistakes for this topic.";

  const systemPrompt = `You are an expert interactive coding curriculum designer.
Generate a high-quality, practical coding exercise tailored to the student's mastery level and previous mistakes.

CRITICAL REQUIREMENTS:
1. Return ONLY valid, raw JSON with no markdown wrapping or extra commentary.
2. The JSON must match this exact schema:
{
  "title": "Clear concise exercise title",
  "description": "Descriptive overview of the problem",
  "instructions": "Step-by-step requirements for the learner",
  "starterCode": "// Starter scaffold with function signatures and comments",
  "solutionCode": "// Complete, working, verified reference solution code (NO TODOs or placeholders)",
  "testCases": "Semicolon-separated test assertions describing expected behaviors",
  "hints": ["Actionable hint 1", "Actionable hint 2"],
  "explanation": "Brief explanation of the core concept and common pitfalls",
  "difficulty": ${difficulty},
  "focusArea": "${focusArea}"
}
3. The solution code MUST be complete, syntactically correct, and runnable in ${language}. Never use placeholder comments or ellipses in solutionCode.
4. Test cases must be specific assertions or behavioral descriptions separated by semicolons.`;

  const userPrompt = `Generate a personalized ${language} exercise for:
- Topic: "${topicTitle}"
- Target Difficulty: Level ${difficulty} of 5
- Student Mastery: ${skillLevel} (${skillScore}% score)
- Targeted Focus Area: ${focusArea}
- Student's Past Mistakes to Address:
${mistakesSummary}

Ensure the exercise directly targets the student's weaknesses and provides clear scaffolding in starterCode and complete working solution in solutionCode.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

/**
 * Extracts student focus areas based on recent error patterns and skill level.
 */
export function extractFocusAreas(
  mistakes: Array<{ error: string; count: number }>,
  skill: { score: number } | null
): string[] {
  const areas: string[] = [];

  if (skill && skill.score < 40) {
    areas.push("fundamentals");
  }

  for (const m of mistakes) {
    const error = m.error.toLowerCase();
    if (error.includes("syntax") || error.includes("unexpected token")) areas.push("syntax-precision");
    if (error.includes("undefined") || error.includes("null") || error.includes("cannot read property")) areas.push("null-safety");
    if (error.includes("type") || error.includes("is not a function")) areas.push("type-coercion");
    if (error.includes("async") || error.includes("promise") || error.includes("await")) areas.push("async-flow");
    if (error.includes("scope") || error.includes("not defined")) areas.push("variable-scoping");
    if (error.includes("loop") || error.includes("iteration") || error.includes("call stack")) areas.push("loop-boundaries");
    if (error.includes("array") || error.includes("object") || error.includes("destructuring")) areas.push("data-manipulation");
  }

  if (areas.length === 0) {
    areas.push("algorithmic-logic", "edge-case-handling", "code-efficiency");
  }

  return [...new Set(areas)];
}

/**
 * Generates personalized, AI-assisted practice exercises through the AI Gateway.
 */
export async function generatePersonalizedExercises(request: ExerciseRequest): Promise<GeneratedExercise[]> {
  const { userId, count = 2, difficulty, language = "javascript", focusArea, persist = true } = request;
  let targetTopicId = request.topicId;

  // If no topicId was supplied, dynamically find the student's weakest or most active topic
  if (!targetTopicId) {
    const lowestSkill = await prisma.studentSkill.findFirst({
      where: { userId },
      orderBy: { score: "asc" },
      select: { topicId: true },
    });

    if (lowestSkill?.topicId) {
      targetTopicId = lowestSkill.topicId;
    } else {
      // Pick first published topic in the curriculum
      const firstTopic = await prisma.topic.findFirst({
        where: { published: true },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      targetTopicId = firstTopic?.id;
    }
  }

  // Retrieve student context and resolved topic
  const [skill, mistakes, topic] = await Promise.all([
    targetTopicId
      ? prisma.studentSkill.findUnique({ where: { userId_topicId: { userId, topicId: targetTopicId } } })
      : null,
    prisma.studentMistake.findMany({
      where: { userId, ...(targetTopicId ? { topicId: targetTopicId } : {}) },
      orderBy: { count: "desc" },
      take: 5,
    }),
    targetTopicId
      ? prisma.topic.findUnique({
          where: { id: targetTopicId },
          select: { id: true, title: true, slug: true, difficulty: true, lessons: { select: { id: true }, take: 1 } },
        })
      : null,
  ]);

  const targetDifficulty = difficulty ?? topic?.difficulty ?? 2;
  const focusAreas = focusArea ? [focusArea] : extractFocusAreas(mistakes, skill);
  const topicTitle = topic?.title || "Modern Full-Stack Development";
  const resolvedTopicId = topic?.id || targetTopicId || "general-practice";
  const lessonId = topic?.lessons?.[0]?.id;

  const exercises: GeneratedExercise[] = [];

  for (let i = 0; i < Math.min(count, 3); i++) {
    const selectedFocus = focusAreas[i % focusAreas.length];

    try {
      const messages = buildExerciseGenerationPrompt({
        topicTitle,
        language,
        difficulty: targetDifficulty,
        skillScore: skill?.score,
        skillLevel: skill?.status,
        mistakes,
        focusArea: selectedFocus,
      });

      const response = await aiRouter.executeWithFallback(messages, {
        userId,
        complexity: "medium",
        temperature: 0.3,
      });

      const rawContent = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsedJson = JSON.parse(rawContent);
      const validatedData = AIExerciseSchema.parse(parsedJson);

      // Validate against the Executable Learning Contract
      const contractCheck = validateExecutableExercise({
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        starterCode: validatedData.starterCode,
        solutionCode: validatedData.solutionCode,
        testCases: validatedData.testCases,
        hints: validatedData.hints.join("; "),
        difficulty: validatedData.difficulty,
      });

      if (!contractCheck.valid) {
        throw new Error(`Executable contract violation: ${contractCheck.errors.join(", ")}`);
      }

      let persistedId: string | undefined;

      if (persist && lessonId) {
        const created = await prisma.exercise.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            instructions: validatedData.instructions,
            starterCode: validatedData.starterCode,
            solutionCode: validatedData.solutionCode,
            testCases: validatedData.testCases,
            hints: validatedData.hints.join("; "),
            difficulty: validatedData.difficulty,
            lessonId,
            order: 99 + i,
          },
        });
        persistedId = created.id;
      }

      exercises.push({
        id: persistedId,
        title: validatedData.title,
        description: validatedData.description,
        instructions: validatedData.instructions,
        starterCode: validatedData.starterCode,
        solutionCode: validatedData.solutionCode,
        testCases: validatedData.testCases,
        difficulty: validatedData.difficulty,
        focusArea: validatedData.focusArea || selectedFocus,
        hints: validatedData.hints,
        explanation: validatedData.explanation,
        topicId: resolvedTopicId,
        topicName: topicTitle,
        isPersisted: Boolean(persistedId),
      });
    } catch (err) {
      console.warn(`[AI Exercise Generator] Fallback used for ${selectedFocus}:`, err);
      const fallback = createVerifiedFallbackExercise({
        topicTitle,
        topicId: resolvedTopicId,
        difficulty: targetDifficulty,
        language,
        focusArea: selectedFocus,
      });
      exercises.push(fallback);
    }
  }

  return exercises;
}

/**
 * Creates a verified, contract-compliant fallback exercise if AI response fails parsing.
 */
export function createVerifiedFallbackExercise(params: {
  topicTitle: string;
  topicId: string;
  difficulty: number;
  language: string;
  focusArea: string;
}): GeneratedExercise {
  const { topicTitle, topicId, difficulty, language, focusArea } = params;

  let starterCode = `function processData(items) {\n  // Implement solution for ${focusArea}\n  return [];\n}`;
  let solutionCode = `function processData(items) {\n  if (!Array.isArray(items)) return [];\n  return items.filter(Boolean).map(item => String(item).trim());\n}`;
  let testCases = "Returns empty array for non-array inputs; Filters out falsy values; Trims strings cleanly; Preserves item integrity";

  if (focusArea === "async-flow") {
    starterCode = `async function fetchWithRetry(url, maxRetries = 3) {\n  // Implement retry logic with exponential backoff\n}`;
    solutionCode = `async function fetchWithRetry(url, maxRetries = 3) {\n  for (let attempt = 1; attempt <= maxRetries; attempt++) {\n    try {\n      const res = await fetch(url);\n      if (res.ok) return await res.json();\n    } catch (err) {\n      if (attempt === maxRetries) throw err;\n      await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)));\n    }\n  }\n}`;
    testCases = "Retries failed requests up to maxRetries; Resolves valid response on success; Throws error when all retries are exhausted; Uses exponential backoff delays";
  } else if (focusArea === "null-safety") {
    starterCode = `function getNestedProperty(obj, path, defaultValue = null) {\n  // Safely traverse dotted path in obj\n}`;
    solutionCode = `function getNestedProperty(obj, path, defaultValue = null) {\n  if (!obj || typeof obj !== 'object') return defaultValue;\n  const keys = path.split('.');\n  let current = obj;\n  for (const key of keys) {\n    if (current === null || current === undefined) return defaultValue;\n    current = current[key];\n  }\n  return current !== undefined ? current : defaultValue;\n}`;
    testCases = "Extracts top-level properties; Extracts deeply nested properties; Returns defaultValue for missing keys; Handles null and undefined root objects safely";
  }

  return {
    title: `${topicTitle}: ${focusArea.replace(/-/g, " ").toUpperCase()} Drill`,
    description: `Targeted practice to reinforce ${topicTitle} with special focus on ${focusArea}.`,
    instructions: `Implement the function according to standard ${language} conventions. Handle boundary conditions and edge cases properly.`,
    starterCode,
    solutionCode,
    testCases,
    difficulty,
    focusArea,
    hints: [
      `Review key ${topicTitle} principles before writing code.`,
      `Account for edge cases like null, undefined, or empty inputs.`,
      `Ensure all test cases pass without side effects.`,
    ],
    explanation: `This drill reinforces critical data hygiene and structural safety in ${topicTitle}.`,
    topicId,
    topicName: topicTitle,
    isPersisted: false,
  };
}