import { apiHandler } from "@/lib/api-handler";
import { ProjectMentor, type MentorAction } from "@/lib/projects/project-mentor";
import { z } from "zod";

const mentorRequestSchema = z.object({
  action: z.enum([
    "architecture_review",
    "code_review",
    "debugging",
    "testing",
    "security_review",
    "performance_review",
    "milestone_planning",
    "general_guidance",
  ]).default("architecture_review"),
  userPrompt: z.string().optional(),
  activeFilePath: z.string().optional(),
  currentMilestone: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: projectId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof mentorRequestSchema>;

  const response = await ProjectMentor.reviewProject({
    projectId,
    userId: user.id,
    action: body.action as MentorAction,
    userPrompt: body.userPrompt,
    activeFilePath: body.activeFilePath,
    currentMilestone: body.currentMilestone,
  });

  return response;
}, { requireAuth: true, bodySchema: mentorRequestSchema });
