import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { issueCourseCertificate } from "@/lib/certificates/service";

const issueSchema = z.object({
  courseId: z.string(),
  studentNameOverride: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof issueSchema>;

  const course = await prisma.course.findUnique({
    where: { id: body.courseId },
    include: {
      modules: {
        include: {
          topics: {
            include: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Calculate total lessons
  const totalLessons = course.modules.reduce((sum, m) => {
    return sum + m.topics.reduce((tSum, t) => tSum + t.lessons.length, 0);
  }, 0);

  // Extract skills from course modules and topics
  const skills = course.modules.map((m) => m.title).slice(0, 5);

  const cert = issueCourseCertificate({
    userId: user.id,
    studentName: body.studentNameOverride || user.name || "Software Engineer",
    studentEmail: user.email,
    courseId: course.id,
    courseTitle: course.title,
    courseStream: course.stream || "Full-Stack Development",
    totalLessonsCompleted: totalLessons || 12,
    skills,
    grade: "A+ / Distinguished",
  });

  return {
    success: true,
    certificate: cert,
    message: "Congratulations! Course completion certificate awarded successfully.",
  };
}, { bodySchema: issueSchema });
