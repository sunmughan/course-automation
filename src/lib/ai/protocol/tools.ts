import { z } from "zod";

export const ToolDefinition = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.object({
      type: z.string(),
      description: z.string(),
      enum: z.array(z.string()).optional(),
    })),
    required: z.array(z.string()).optional(),
  }),
});
export type ToolDefinition = z.infer<typeof ToolDefinition>;

export interface ToolHandler {
  definition: ToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
  requiresAuth: boolean;
  maxExecutionTimeMs: number;
}

export const TOOL_REGISTRY: Record<string, ToolHandler> = {
  execute_code: {
    definition: {
      name: "execute_code",
      description: "Execute code in a safe sandboxed environment and return output and events",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "The source code to execute" },
          language: { type: "string", description: "Programming language (e.g. javascript, python, typescript)" },
        },
        required: ["code"],
      },
    },
    execute: async (args) => {
      const code = (args.code as string) || "";
      const language = (args.language as string) || "javascript";
      const { executeMultiLanguage } = await import("@/lib/execution/multi-lang-sandbox");

      const result = await executeMultiLanguage({
        code,
        language,
        trace: false,
      });

      return {
        output: result.output || "",
        error: result.error || null,
        executionTime: result.executionTime || 0,
        events: result.events || [],
      };
    },
    requiresAuth: false,
    maxExecutionTimeMs: 10000,
  },
  get_lesson_content: {
    definition: {
      name: "get_lesson_content",
      description: "Retrieve the content of a specific lesson from the course",
      parameters: {
        type: "object",
        properties: {
          lessonId: { type: "string", description: "The ID of the lesson to retrieve" },
        },
        required: ["lessonId"],
      },
    },
    execute: async (args) => {
      const { prisma } = await import("@/lib/db");
      const lesson = await prisma.lesson.findUnique({
        where: { id: args.lessonId as string },
        include: {
          concepts: { orderBy: { order: "asc" } },
          examples: { orderBy: { order: "asc" }, take: 5 },
        },
      });
      if (!lesson) return { error: "Lesson not found" };
      return {
        title: lesson.title,
        content: lesson.content,
        concepts: lesson.concepts.map((c) => ({ title: c.title, description: c.description })),
        examples: lesson.examples.map((e) => ({ title: e.title, code: e.solutionCode })),
      };
    },
    requiresAuth: false,
    maxExecutionTimeMs: 3000,
  },
  get_topic_info: {
    definition: {
      name: "get_topic_info",
      description: "Get detailed information about a course topic",
      parameters: {
        type: "object",
        properties: {
          topicId: { type: "string", description: "The ID of the topic" },
        },
        required: ["topicId"],
      },
    },
    execute: async (args) => {
      const { prisma } = await import("@/lib/db");
      const topic = await prisma.topic.findUnique({
        where: { id: args.topicId as string },
        include: {
          module: { select: { title: true, courseId: true } },
          prerequisites: { include: { prerequisite: { select: { title: true } } } },
          lessons: { orderBy: { order: "asc" }, select: { id: true, title: true } },
        },
      });
      if (!topic) return { error: "Topic not found" };
      return {
        title: topic.title,
        description: topic.description,
        difficulty: topic.difficulty,
        module: topic.module.title,
        prerequisites: topic.prerequisites.map((p) => p.prerequisite.title),
        lessons: topic.lessons,
      };
    },
    requiresAuth: false,
    maxExecutionTimeMs: 3000,
  },
  get_student_progress: {
    definition: {
      name: "get_student_progress",
      description: "Get the student's progress on a specific topic or course",
      parameters: {
        type: "object",
        properties: {
          userId: { type: "string", description: "The user's ID" },
          topicId: { type: "string", description: "Optional: filter by topic ID" },
        },
        required: ["userId"],
      },
    },
    execute: async (args) => {
      const { prisma } = await import("@/lib/db");
      const where: Record<string, unknown> = { userId: args.userId };
      if (args.topicId) where.topicId = args.topicId;

      const [progress, skills, mistakes] = await Promise.all([
        prisma.studentProgress.findMany({ where: where as any, orderBy: { updatedAt: "desc" }, take: 20 }),
        prisma.studentSkill.findMany({ where: { userId: args.userId as string } }),
        prisma.studentMistake.findMany({ where: { userId: args.userId as string }, orderBy: { count: "desc" }, take: 10 }),
      ]);

      return {
        completedLessons: progress.filter((p) => p.status === "completed").length,
        totalLessons: progress.length,
        skills: skills.map((s) => ({ name: s.skillName, score: s.score, status: s.status })),
        commonMistakes: mistakes.map((m) => ({ error: m.error, count: m.count })),
      };
    },
    requiresAuth: true,
    maxExecutionTimeMs: 3000,
  },
  explain_concept: {
    definition: {
      name: "explain_concept",
      description: "Generate an in-depth AI explanation of a programming concept with context and examples",
      parameters: {
        type: "object",
        properties: {
          concept: { type: "string", description: "The concept to explain" },
          level: { type: "string", description: "Student level: beginner, intermediate, advanced", enum: ["beginner", "intermediate", "advanced"] },
          course: { type: "string", description: "Optional course title or stream" },
          lesson: { type: "string", description: "Optional lesson name" },
          lessonId: { type: "string", description: "Optional lesson ID for database context lookup" },
          code: { type: "string", description: "Optional current code context" },
          context: { type: "string", description: "Optional additional relevant context" },
        },
        required: ["concept"],
      },
    },
    execute: async (args) => {
      const concept = (args.concept as string) || "";
      const level = (args.level as string) || "intermediate";
      const course = args.course as string | undefined;
      const lesson = args.lesson as string | undefined;
      const lessonId = args.lessonId as string | undefined;
      const code = args.code as string | undefined;
      const customContext = args.context as string | undefined;
      const userId = args.userId as string | undefined;

      let lessonInfo: { title: string; content: string } | null = null;
      if (lessonId) {
        try {
          const { prisma } = await import("@/lib/db");
          const found = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { title: true, content: true },
          });
          if (found) lessonInfo = found;
        } catch {
          // Non-critical DB context lookup
        }
      }

      const systemPrompt = `You are an expert programming tutor on SkillForge.
Explain the requested programming concept thoroughly and clearly for a ${level} level student.
Provide intuitive explanations, concrete code examples, and highlight practical use cases.`;

      const userPromptParts: string[] = [`Please explain the concept: "${concept}"`];
      userPromptParts.push(`Student Level: ${level}`);
      if (course) userPromptParts.push(`Course: ${course}`);
      if (lesson || lessonInfo?.title) userPromptParts.push(`Lesson: ${lesson || lessonInfo?.title}`);
      if (lessonInfo?.content) userPromptParts.push(`Lesson Content Context: ${lessonInfo.content.slice(0, 1000)}`);
      if (code) userPromptParts.push(`Current Student Code:\n\`\`\`\n${code}\n\`\`\``);
      if (customContext) userPromptParts.push(`Additional Context: ${customContext}`);

      try {
        const { aiRouter } = await import("../router");
        const { createAIRequestId } = await import("../persistence");

        const result = await aiRouter.executeWithFallback(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPromptParts.join("\n\n") },
          ],
          {
            complexity: level === "advanced" ? "high" : level === "beginner" ? "low" : "medium",
            userId: userId || undefined,
            requestId: createAIRequestId(),
            agent: "teacher",
            mode: "explain",
          }
        );

        return {
          concept,
          level,
          explanation: result.content,
          meta: {
            provider: result.provider,
            model: result.model,
            latency: result.latency,
            tokens: result.inputTokens + result.outputTokens,
          },
        };
      } catch (error) {
        return {
          concept,
          level,
          explanation: `Explanation for "${concept}" (${level} level): A foundational programming concept. Please refer to course lessons for detailed breakdowns.`,
          error: error instanceof Error ? error.message : "AI explanation failed",
        };
      }
    },
    requiresAuth: false,
    maxExecutionTimeMs: 15000,
  },
  search_knowledge: {
    definition: {
      name: "search_knowledge",
      description: "Search the course knowledge base for relevant topics and lessons",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          limit: { type: "string", description: "Maximum number of results (default: 5)" },
        },
        required: ["query"],
      },
    },
    execute: async (args) => {
      const { prisma } = await import("@/lib/db");
      const query = args.query as string;
      const limit = parseInt(args.limit as string) || 5;

      const [topics, lessons] = await Promise.all([
        prisma.topic.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
          take: limit,
          select: { id: true, title: true, description: true, difficulty: true },
        }),
        prisma.lesson.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { content: { contains: query } },
            ],
          },
          take: limit,
          select: { id: true, title: true, topicId: true },
        }),
      ]);

      return { topics, lessons };
    },
    requiresAuth: false,
    maxExecutionTimeMs: 3000,
  },
};

export function getToolDefinitions(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).map((t) => t.definition);
}

export function getToolDefinitionsForMode(
  mode: string
): ToolDefinition[] {
  const allTools = getToolDefinitions();

  const modeTools: Record<string, string[]> = {
    debug: ["execute_code", "get_lesson_content", "get_student_progress"],
    "code-breakdown": ["execute_code", "get_lesson_content", "explain_concept"],
    execution: ["execute_code"],
    explain: ["get_lesson_content", "get_topic_info", "explain_concept", "search_knowledge"],
    practice: ["execute_code", "get_lesson_content", "get_student_progress"],
    interview: ["execute_code", "get_student_progress"],
    review: ["get_lesson_content", "get_topic_info", "get_student_progress"],
    hint: ["get_lesson_content", "get_topic_info", "get_student_progress"],
    socratic: ["get_lesson_content", "get_topic_info", "get_student_progress"],
    "deep-dive": ["get_topic_info", "explain_concept", "search_knowledge"],
    visualize: ["get_lesson_content", "get_topic_info"],
    compare: ["get_topic_info", "explain_concept", "search_knowledge"],
    simplify: ["explain_concept", "search_knowledge"],
  };

  const allowed = modeTools[mode] || [];
  return allTools.filter((t) => allowed.includes(t.name));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const handler = TOOL_REGISTRY[name];
  if (!handler) {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  try {
    const result = await Promise.race([
      handler.execute(args),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tool execution timed out")), handler.maxExecutionTimeMs)
      ),
    ]);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    };
  }
}

export function formatToolsForSystemPrompt(tools: ToolDefinition[]): string {
  if (tools.length === 0) return "";

  const parts = ["## Available Tools", ""];

  for (const tool of tools) {
    parts.push(`### ${tool.name}`);
    parts.push(tool.description);
    parts.push("");

    const props = tool.parameters.properties;
    const required = tool.parameters.required || [];

    parts.push("Parameters:");
    for (const [key, prop] of Object.entries(props)) {
      const req = required.includes(key) ? " (required)" : " (optional)";
      parts.push(`- ${key}${req}: ${(prop as { description: string }).description}`);
    }
    parts.push("");
  }

  parts.push(
    "To use a tool, respond with:",
    "```json",
    '{ "tool_call": { "name": "<tool_name>", "arguments": { "key": "value" } } }',
    "```",
    ""
  );

  return parts.join("\n");
}

export function parseToolCallFromResponse(
  content: string
): { name: string; arguments: Record<string, unknown> } | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.tool_call?.name) {
      return {
        name: parsed.tool_call.name,
        arguments: parsed.tool_call.arguments || {},
      };
    }
    return null;
  } catch {
    return null;
  }
}