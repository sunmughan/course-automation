import { prisma } from "@/lib/db";
import type { ExecutionEvent } from "@/types";

export interface AIContext {
  currentQuestion: string;
  currentCode: string | null;
  currentTopic: TopicContext | null;
  currentLesson: LessonContext | null;
  previousMistakes: MistakeContext[];
  studentSkillLevel: SkillContext | null;
  courseContext: CourseContext | null;
  conversationHistory: MessageContext[];
  executionResult: ExecutionContext | null;
}

export interface TopicContext {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  moduleTitle: string;
  prerequisites: string[];
}

export interface LessonContext {
  id: string;
  title: string;
  content: string;
  explanation: string;
  concepts: string[];
  examples: { title: string; code: string }[];
}

export interface MistakeContext {
  topicId: string;
  code: string;
  error: string;
  fix: string | null;
  count: number;
}

export interface SkillContext {
  topicId: string;
  skillName: string;
  score: number;
  status: string;
  attempts: number;
}

export interface CourseContext {
  title: string;
  description: string;
  stream: string;
  modules: { title: string; topics: string[] }[];
}

export interface MessageContext {
  role: string;
  content: string;
  code?: string | null;
}

export interface ExecutionContext {
  output: string;
  error: string | null;
  executionTime?: number;
  memoryUsed?: number;
  events?: ExecutionEvent[];
  selectedLine?: number | null;
  selectedEventIndex?: number | null;
  selectedEvent?: ExecutionEvent | null;
}

export interface ContextBuildOptions {
  userId: string;
  sessionId?: string;
  topicId?: string;
  lessonId?: string;
  code?: string;
  question: string;
  executionResult?: ExecutionContext;
  conversationLimit?: number;
}

export async function buildContext(options: ContextBuildOptions): Promise<AIContext> {
  const {
    userId,
    sessionId,
    topicId,
    lessonId,
    code,
    question,
    executionResult,
    conversationLimit = 10,
  } = options;

  const [
    topicContext,
    lessonContext,
    previousMistakes,
    studentSkillLevel,
    courseContext,
    conversationHistory,
  ] = await Promise.all([
    buildTopicContext(topicId),
    buildLessonContext(lessonId),
    buildMistakeContext(userId, topicId),
    buildSkillContext(userId, topicId),
    buildCourseContext(topicId, lessonId),
    buildConversationHistory(sessionId, conversationLimit),
  ]);

  return {
    currentQuestion: question,
    currentCode: code || null,
    currentTopic: topicContext,
    currentLesson: lessonContext,
    previousMistakes,
    studentSkillLevel,
    courseContext,
    conversationHistory,
    executionResult: executionResult || null,
  };
}

async function buildTopicContext(topicId?: string): Promise<TopicContext | null> {
  if (!topicId) return null;

  try {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: { select: { title: true } },
        prerequisites: {
          include: {
            prerequisite: { select: { title: true } },
          },
        },
      },
    });

    if (!topic) return null;

    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      difficulty: topic.difficulty,
      moduleTitle: topic.module.title,
      prerequisites: topic.prerequisites.map((p) => p.prerequisite.title),
    };
  } catch {
    return null;
  }
}

async function buildLessonContext(lessonId?: string): Promise<LessonContext | null> {
  if (!lessonId) return null;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        concepts: { select: { title: true, description: true }, orderBy: { order: "asc" } },
        examples: { select: { title: true, solutionCode: true }, orderBy: { order: "asc" }, take: 5 },
      },
    });

    if (!lesson) return null;

    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      explanation: lesson.explanation,
      concepts: lesson.concepts.map((c) => `${c.title}: ${c.description}`),
      examples: lesson.examples.map((e) => ({ title: e.title, code: e.solutionCode })),
    };
  } catch {
    return null;
  }
}

async function buildMistakeContext(userId: string, topicId?: string): Promise<MistakeContext[]> {
  try {
    const where: Record<string, unknown> = { userId };
    if (topicId) {
      where.topicId = topicId;
    }

    const mistakes = await prisma.studentMistake.findMany({
      where,
      orderBy: { count: "desc" },
      take: 10,
    });

    return mistakes.map((m) => ({
      topicId: m.topicId,
      code: m.code,
      error: m.error,
      fix: m.fix,
      count: m.count,
    }));
  } catch {
    return [];
  }
}

async function buildSkillContext(userId: string, topicId?: string): Promise<SkillContext | null> {
  if (!topicId) {
    try {
      const skills = await prisma.studentSkill.findMany({
        where: { userId },
        orderBy: { score: "desc" },
        take: 1,
      });
      if (skills.length === 0) return null;
      const s = skills[0];
      return {
        topicId: s.topicId,
        skillName: s.skillName,
        score: s.score,
        status: s.status,
        attempts: s.attempts,
      };
    } catch {
      return null;
    }
  }

  try {
    const skill = await prisma.studentSkill.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    if (!skill) return null;

    return {
      topicId: skill.topicId,
      skillName: skill.skillName,
      score: skill.score,
      status: skill.status,
      attempts: skill.attempts,
    };
  } catch {
    return null;
  }
}

async function buildCourseContext(
  topicId?: string,
  lessonId?: string
): Promise<CourseContext | null> {
  try {
    let courseId: string | null = null;

    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          topic: {
            include: {
              module: { select: { courseId: true } },
            },
          },
        },
      });
      courseId = lesson?.topic?.module?.courseId || null;
    }

    if (!courseId && topicId) {
      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          module: { select: { courseId: true } },
        },
      });
      courseId = topic?.module?.courseId || null;
    }

    if (!courseId) return null;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              select: { title: true },
            },
          },
        },
      },
    });

    if (!course) return null;

    return {
      title: course.title,
      description: course.description,
      stream: course.stream,
      modules: course.modules.map((m) => ({
        title: m.title,
        topics: m.topics.map((t) => t.title),
      })),
    };
  } catch {
    return null;
  }
}

async function buildConversationHistory(
  sessionId?: string,
  limit: number = 10
): Promise<MessageContext[]> {
  if (!sessionId) return [];

  try {
    const messages = await prisma.aIMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      role: m.role,
      content: m.content,
      code: m.code,
    }));
  } catch {
    return [];
  }
}

export function formatContextForPrompt(context: AIContext): string {
  const parts: string[] = [];

  if (context.courseContext) {
    parts.push(`## Course: ${context.courseContext.title}`);
    parts.push(`Stream: ${context.courseContext.stream}`);
    parts.push(`Description: ${context.courseContext.description}`);
    parts.push("");
  }

  if (context.currentTopic) {
    parts.push(`## Current Topic: ${context.currentTopic.title}`);
    parts.push(`Module: ${context.currentTopic.moduleTitle}`);
    parts.push(`Difficulty: ${context.currentTopic.difficulty}/5`);
    parts.push(`Description: ${context.currentTopic.description}`);
    if (context.currentTopic.prerequisites.length > 0) {
      parts.push(`Prerequisites: ${context.currentTopic.prerequisites.join(", ")}`);
    }
    parts.push("");
  }

  if (context.currentLesson) {
    parts.push(`## Current Lesson: ${context.currentLesson.title}`);
    parts.push(`Explanation: ${context.currentLesson.explanation}`);
    if (context.currentLesson.concepts.length > 0) {
      parts.push("Concepts:");
      for (const concept of context.currentLesson.concepts) {
        parts.push(`- ${concept}`);
      }
    }
    parts.push("");
  }

  if (context.currentCode) {
    parts.push("## Current Code:");
    parts.push("```");
    parts.push(context.currentCode);
    parts.push("```");
    parts.push("");
  }

  if (context.executionResult) {
    parts.push("## Execution Result:");
    if (context.executionResult.output) {
      parts.push("Output:");
      parts.push("```");
      parts.push(context.executionResult.output);
      parts.push("```");
    }
    if (context.executionResult.error) {
      parts.push("Error:");
      parts.push("```");
      parts.push(context.executionResult.error);
      parts.push("```");
    }
    parts.push(`Execution Time: ${context.executionResult.executionTime}ms`);
    parts.push(`Memory Used: ${context.executionResult.memoryUsed}MB`);
    parts.push("");
  }

  if (context.previousMistakes.length > 0) {
    parts.push("## Previous Mistakes:");
    for (const mistake of context.previousMistakes.slice(0, 5)) {
      parts.push(`- Error: ${mistake.error}`);
      parts.push(`  Code: ${mistake.code.substring(0, 200)}`);
      if (mistake.fix) {
        parts.push(`  Fix: ${mistake.fix}`);
      }
      parts.push(`  Occurrences: ${mistake.count}`);
    }
    parts.push("");
  }

  if (context.studentSkillLevel) {
    parts.push(`## Student Level: ${context.studentSkillLevel.status}`);
    parts.push(`Skill: ${context.studentSkillLevel.skillName}`);
    parts.push(`Proficiency Score: ${context.studentSkillLevel.score}%`);
    parts.push(`Total Attempts: ${context.studentSkillLevel.attempts}`);
    parts.push("");
  }

  if (context.conversationHistory.length > 0) {
    parts.push("## Conversation History:");
    for (const msg of context.conversationHistory) {
      parts.push(`${msg.role === "user" ? "Student" : "Tutor"}: ${msg.content.substring(0, 300)}`);
    }
    parts.push("");
  }

  parts.push("## Current Question:");
  parts.push(context.currentQuestion);

  return parts.join("\n");
}