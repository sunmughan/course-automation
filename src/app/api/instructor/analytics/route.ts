import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { getBatchAnalytics, getStudentEvidenceDrillDown } from "@/lib/instructor";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const request = ctx.request;
  const url = new URL(request.url);
  const batchId = url.searchParams.get("batchId");
  const studentId = url.searchParams.get("studentId");

  if (studentId) {
    const drillDown = await getStudentEvidenceDrillDown(studentId, user.id);
    return { drillDown };
  }

  if (!batchId) {
    return Response.json({ error: "batchId or studentId query parameter is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const analytics = await getBatchAnalytics(batchId, user.id);
  return { analytics };
}, { requireInstructor: true });