import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

const contextSwitchSchema = z.object({
  targetCourseSlug: z.string().optional(),
  targetTopicSlug: z.string().optional(),
  overrideReason: z.string().default("student_conversational_switch"),
  conversationId: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof contextSwitchSchema>;

  // Find target topic or course
  let topic = null;
  if (body.targetTopicSlug) {
    topic = await prisma.topic.findFirst({
      where: { slug: body.targetTopicSlug },
      include: { module: { include: { course: true } } },
    });
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

    if (course && course.modules[0]?.topics[0]) {
      topic = course.modules[0].topics[0];
    }
  }

  if (!topic) {
    return {
      success: false,
      message: "Target course or topic context could not be identified",
    };
  }

  // Create or update AI session context override scoped by authenticated userId
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
      courseId: (topic as any).module?.courseId,
    },
  };
}, { bodySchema: contextSwitchSchema });
