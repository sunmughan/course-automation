import { apiHandler } from "@/lib/api-handler";
import {
  getOrganization,
  getOrgOverview,
  getOrgAIAnalytics,
  getOrgActivityTimeline,
  queryAnalyticsEvents,
} from "@/lib/enterprise";

export const GET = apiHandler(async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return Response.json(
      { error: "organizationId query parameter is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const org = await getOrganization(organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const view = url.searchParams.get("view") || "overview";

  if (view === "ai") {
    const ai = await getOrgAIAnalytics(organizationId);
    return { ai };
  }

  if (view === "timeline") {
    const days = url.searchParams.get("days")
      ? parseInt(url.searchParams.get("days")!)
      : 30;
    const timeline = await getOrgActivityTimeline(organizationId, days);
    return { timeline };
  }

  if (view === "events") {
    const event = url.searchParams.get("event") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;
    const limit = url.searchParams.get("limit")
      ? parseInt(url.searchParams.get("limit")!)
      : undefined;
    const offset = url.searchParams.get("offset")
      ? parseInt(url.searchParams.get("offset")!)
      : undefined;

    const result = await queryAnalyticsEvents({
      organizationId,
      event,
      userId,
      startDate,
      endDate,
      limit,
      offset,
    });

    return result;
  }

  const overview = await getOrgOverview(organizationId);
  return { overview };
}, { requireAdmin: true });
