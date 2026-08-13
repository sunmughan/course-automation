import { apiHandler } from "@/lib/api-handler";
import { queryAuditLogs } from "@/lib/enterprise";

export const GET = apiHandler(async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);

  const organizationId = url.searchParams.get("organizationId") || undefined;
  const userId = url.searchParams.get("userId") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const resource = url.searchParams.get("resource") || undefined;
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined;
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : undefined;

  const result = await queryAuditLogs({
    organizationId,
    userId,
    action,
    resource,
    startDate,
    endDate,
    limit,
    offset,
  });

  return result;
}, { requireAdmin: true });