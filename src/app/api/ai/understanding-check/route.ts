import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { understandingEngine } from "@/lib/ai/understanding-engine";

const checkSubmissionSchema = z.object({
  topicId: z.string().min(1),
  question: z.string().min(1),
  studentAnswer: z.string().default(""),
  selectedOptionIndex: z.number().optional(),
  correctOptionIndex: z.number(),
  options: z.array(z.string()).min(2),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof checkSubmissionSchema>;

  const result = await understandingEngine.evaluateAnswer({
    userId: user.id,
    topicId: body.topicId,
    question: body.question,
    studentAnswer: body.studentAnswer,
    selectedOptionIndex: body.selectedOptionIndex,
    correctOptionIndex: body.correctOptionIndex,
    options: body.options,
  });

  return {
    success: true,
    result,
  };
}, { bodySchema: checkSubmissionSchema });
