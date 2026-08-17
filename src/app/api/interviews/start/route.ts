import { apiHandler } from "@/lib/api-handler";
import { InterviewEngine } from "@/lib/interviews/engine";
import { z } from "zod";

const startInterviewSchema = z.object({
  topicId: z.string().optional(),
  courseId: z.string().optional(),
  role: z.string().default("Full-Stack Engineer"),
  targetLevel: z.enum(["junior", "mid", "senior", "staff"]).default("mid"),
  initialDifficulty: z.number().int().min(1).max(5).default(2),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof startInterviewSchema>;

  const session = await InterviewEngine.startSession({
    userId: user.id,
    topicId: body.topicId,
    courseId: body.courseId,
    role: body.role,
    targetLevel: body.targetLevel,
    initialDifficulty: body.initialDifficulty,
  });

  return session;
}, { requireAuth: true, bodySchema: startInterviewSchema });
