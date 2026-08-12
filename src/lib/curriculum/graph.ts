import { prisma } from "@/lib/db";

export interface TopicNode {
  id: string;
  title: string;
  slug: string;
  description: string;
  moduleId: string;
  difficulty: number;
  order: number;
  prerequisites: { id: string; title: string; slug: string }[];
  dependedBy: { id: string; title: string; slug: string }[];
}

export interface LearningPathStep {
  topicId: string;
  topicTitle: string;
  topicSlug: string;
  moduleId: string;
  moduleTitle: string;
  order: number;
  difficulty: number;
  status: "locked" | "available" | "in_progress" | "completed" | "mastered";
}

export async function getTopicWithPrerequisites(
  topicId: string
): Promise<TopicNode | null> {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      prerequisites: {
        include: {
          prerequisite: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
      dependedBy: {
        include: {
          topic: {
            select: { id: true, title: true, slug: true },
          },
        },
      },
    },
  });

  if (!topic) return null;

  return {
    id: topic.id,
    title: topic.title,
    slug: topic.slug,
    description: topic.description,
    moduleId: topic.moduleId,
    difficulty: topic.difficulty,
    order: topic.order,
    prerequisites: topic.prerequisites.map((p) => p.prerequisite),
    dependedBy: topic.dependedBy.map((d) => d.topic),
  };
}

export async function getAllPrerequisiteIds(
  topicId: string
): Promise<Set<string>> {
  const visited = new Set<string>();
  const queue = [topicId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const prereqs = await prisma.topicPrerequisite.findMany({
      where: { topicId: current },
      select: { prerequisiteId: true },
    });

    for (const p of prereqs) {
      if (!visited.has(p.prerequisiteId)) {
        queue.push(p.prerequisiteId);
      }
    }
  }

  visited.delete(topicId);
  return visited;
}

export async function isTopicUnlocked(
  userId: string,
  topicId: string
): Promise<boolean> {
  const prereqs = await prisma.topicPrerequisite.findMany({
    where: { topicId },
    select: { prerequisiteId: true },
  });

  if (prereqs.length === 0) return true;

  const prerequisiteIds = prereqs.map((p) => p.prerequisiteId);

  const prerequisiteTopics = await prisma.topic.findMany({
    where: { id: { in: prerequisiteIds } },
    include: {
      lessons: {
        select: { id: true },
      },
    },
  });

  const allLessonIds = prerequisiteTopics.flatMap((t) =>
    t.lessons.map((l) => l.id)
  );

  if (allLessonIds.length === 0) return true;

  const completedProgress = await prisma.studentProgress.findMany({
    where: {
      userId,
      lessonId: { in: allLessonIds },
      status: "completed",
    },
  });

  const prerequisiteLessonIds = new Set(allLessonIds);
  const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));

  for (const prerequisiteTopic of prerequisiteTopics) {
    const topicLessonIds = prerequisiteTopic.lessons.map((l) => l.id);
    const allLessonsCompleted = topicLessonIds.every((lid) =>
      completedLessonIds.has(lid)
    );
    if (!allLessonsCompleted) return false;
  }

  return true;
}

export async function getCourseTopicsWithPrerequisites(
  courseId: string
): Promise<TopicNode[]> {
  const modules = await prisma.module.findMany({
    where: { courseId, published: true },
    include: {
      topics: {
        where: { published: true },
        orderBy: { order: "asc" },
        include: {
          prerequisites: {
            include: {
              prerequisite: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
          dependedBy: {
            include: {
              topic: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const result: TopicNode[] = [];

  for (const module of modules) {
    for (const topic of module.topics) {
      result.push({
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        moduleId: topic.moduleId,
        difficulty: topic.difficulty,
        order: topic.order,
        prerequisites: topic.prerequisites.map((p) => p.prerequisite),
        dependedBy: topic.dependedBy.map((d) => d.topic),
      });
    }
  }

  return result;
}

export async function getLearningPath(
  courseId: string
): Promise<LearningPathStep[]> {
  const modules = await prisma.module.findMany({
    where: { courseId, published: true },
    orderBy: { order: "asc" },
    select: { id: true, title: true },
  });

  const topics = await prisma.topic.findMany({
    where: {
      module: { courseId, published: true },
      published: true,
    },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      moduleId: true,
      module: { select: { id: true, title: true, order: true } },
      difficulty: true,
      order: true,
      prerequisites: { select: { prerequisiteId: true } },
    },
  });

  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const t of topics) {
    inDegree.set(t.id, t.prerequisites.length);
    for (const p of t.prerequisites) {
      if (!adjacency.has(p.prerequisiteId)) {
        adjacency.set(p.prerequisiteId, []);
      }
      adjacency.get(p.prerequisiteId)!.push(t.id);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort((a, b) => {
      const ta = topicMap.get(a)!;
      const tb = topicMap.get(b)!;
      if (ta.moduleId !== tb.moduleId) {
        return ta.module.order - tb.module.order;
      }
      return ta.order - tb.order;
    });

    const current = queue.shift()!;
    sorted.push(current);

    for (const neighbor of adjacency.get(current) || []) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  const result: LearningPathStep[] = [];
  for (const topicId of sorted) {
    const t = topicMap.get(topicId);
    if (!t) continue;

    let topicOrder = t.order;
    let prevModuleId: string | null = null;
    let moduleCounter = 0;

    for (const module of modules) {
      if (module.id === t.moduleId) {
        topicOrder = moduleCounter + t.order;
        break;
      }
      const topicsInModule = topics.filter((tp) => tp.moduleId === module.id);
      moduleCounter += topicsInModule.length;
    }

    result.push({
      topicId: t.id,
      topicTitle: t.title,
      topicSlug: t.slug,
      moduleId: t.moduleId,
      moduleTitle: t.module.title,
      order: topicOrder,
      difficulty: t.difficulty,
      status: "locked",
    });
  }

  return result;
}

export async function getNextRecommendedTopic(
  userId: string,
  courseId: string
): Promise<{
  topic: { id: string; title: string; slug: string } | null;
  module: { id: string; title: string } | null;
  reason: string;
}> {
  const learningPath = await getLearningPath(courseId);

  const topics = await prisma.topic.findMany({
    where: {
      module: { courseId, published: true },
      published: true,
    },
    include: {
      lessons: { select: { id: true } },
    },
  });

  const topicLessonMap = new Map(topics.map((t) => [t.id, t.lessons]));

  const allLessonIds = topics.flatMap((t) => t.lessons.map((l) => l.id));
  const progressRecords = await prisma.studentProgress.findMany({
    where: {
      userId,
      lessonId: { in: allLessonIds },
    },
  });

  const completedLessonIds = new Set(
    progressRecords
      .filter((p) => p.status === "completed")
      .map((p) => p.lessonId)
  );

  const inProgressLessonIds = new Set(
    progressRecords
      .filter((p) => p.status === "in_progress")
      .map((p) => p.lessonId)
  );

  for (const step of learningPath) {
    const lessons = topicLessonMap.get(step.topicId) || [];
    const allCompleted = lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id));
    const anyInProgress = lessons.some((l) => inProgressLessonIds.has(l.id));

    if (allCompleted) continue;

    const unlocked = await isTopicUnlocked(userId, step.topicId);

    if (!unlocked) continue;

    if (anyInProgress) {
      return {
        topic: { id: step.topicId, title: step.topicTitle, slug: step.topicSlug },
        module: { id: step.moduleId, title: step.moduleTitle },
        reason: "You have a lesson in progress in this topic",
      };
    }

    return {
      topic: { id: step.topicId, title: step.topicTitle, slug: step.topicSlug },
      module: { id: step.moduleId, title: step.moduleTitle },
      reason: "This is the next topic in your learning path",
    };
  }

  return {
    topic: null,
    module: null,
    reason: "All topics in this course are completed",
  };
}

export async function getTopicUnlockStatus(
  userId: string,
  courseId: string
): Promise<Map<string, { unlocked: boolean; completed: boolean }>> {
  const topics = await getCourseTopicsWithPrerequisites(courseId);

  const allTopicIds = topics.map((t) => t.id);

  const allLessons = await prisma.lesson.findMany({
    where: { topicId: { in: allTopicIds } },
    select: { id: true, topicId: true },
  });

  const topicLessonMap = new Map<string, string[]>();
  for (const lesson of allLessons) {
    if (!topicLessonMap.has(lesson.topicId)) {
      topicLessonMap.set(lesson.topicId, []);
    }
    topicLessonMap.get(lesson.topicId)!.push(lesson.id);
  }

  const allLessonIds = allLessons.map((l) => l.id);
  const progressRecords = await prisma.studentProgress.findMany({
    where: {
      userId,
      lessonId: { in: allLessonIds },
    },
  });

  const completedLessonIds = new Set(
    progressRecords
      .filter((p) => p.status === "completed")
      .map((p) => p.lessonId)
  );

  const result = new Map<string, { unlocked: boolean; completed: boolean }>();

  for (const topic of topics) {
    const prereqIds = new Set(topic.prerequisites.map((p) => p.id));

    let unlocked = true;
    if (prereqIds.size > 0) {
      for (const prereqId of prereqIds) {
        const prereqLessons = topicLessonMap.get(prereqId) || [];
        if (prereqLessons.length === 0) continue;
        const allDone = prereqLessons.every((lid) => completedLessonIds.has(lid));
        if (!allDone) {
          unlocked = false;
          break;
        }
      }
    }

    const topicLessons = topicLessonMap.get(topic.id) || [];
    const completed = topicLessons.length > 0 && topicLessons.every((lid) => completedLessonIds.has(lid));

    result.set(topic.id, { unlocked, completed });
  }

  return result;
}