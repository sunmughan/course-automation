import { apiHandler } from "@/lib/api-handler";
import { getAdminMetrics } from "@/lib/metrics";

export const GET = apiHandler(async () => {
  const metrics = await getAdminMetrics();
  return { metrics };
}, { requireAdmin: true });
