import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const contextSwitchSchema = z.object({
  targetCourseSlug: z.string().optional(),
  targetTopicSlug: z.string().optional(),
  overrideReason: z.string().default("student_conversational_switch"),
  conversationId: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof contextSwitchSchema>;

  // 1. Locate target topic & course
  let topic = null;
  let courseId = "";

  if (body.targetTopicSlug) {
    topic = await prisma.topic.findFirst({
      where: { slug: body.targetTopicSlug },
      include: { module: { include: { course: true } } },
    });
    if (topic && topic.module?.course) {
      courseId = topic.module.course.id;
    }
  } else if (body.targetCourseSlug) {
    const course = await prisma.course.findFirst({
      where: { slug: body.targetCourseSlug },
      include: {
        modules: {
          include: {
            topics: {
              include: { lessons: true },
            },
          },
        },
      },
    });

    if (course) {
      courseId = course.id;
      if (course.modules[0]?.topics[0]) {
        topic = course.modules[0].topics[0];
      }
    }
  }

  if (!topic || !courseId) {
    return {
      success: false,
      message: "Target course or topic context could not be identified",
    };
  }

  // 2. Strict Authorization Check: Validate student enrollment in course
  const enrollment = await prisma.enrolledCourse.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
  });

  // If not enrolled, validate that the course is published and enroll
  if (!enrollment) {
    const targetCourse = await prisma.course.findUnique({ where: { id: courseId } });
    if (!targetCourse || !targetCourse.published) {
      throw new AppError("You do not have authorization to access this unpublished course", 403);
    }

    // Auto-create enrollment for published courses
    await prisma.enrolledCourse.create({
      data: {
        userId: user.id,
        courseId,
        progress: 0,
      },
    });
  }

  // 3. Create isolated session context override scoped by authenticated userId
  const session = await prisma.aISession.create({
    data: {
      userId: user.id,
      topicId: topic.id,
      mode: "explain",
    },
  });

  return {
    success: true,
    message: `Context successfully switched to ${topic.title}`,
    session: {
      id: session.id,
      topicId: topic.id,
      topicTitle: topic.title,
      courseId,
    },
  };
}, { bodySchema: contextSwitchSchema });
