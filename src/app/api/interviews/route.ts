import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { searchParams } = new URL(ctx.request.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { turnNumber: "asc" } },
      },
    });

    if (!session || session.userId !== user.id) {
      return Response.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return { session };
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      turns: {
        select: {
          id: true,
          turnNumber: true,
          turnScore: true,
          questionType: true,
        },
      },
    },
  });

  return { sessions };
}, { requireAuth: true });
