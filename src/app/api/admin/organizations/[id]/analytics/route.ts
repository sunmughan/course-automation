import { apiHandler } from "@/lib/api-handler";
import { OrganizationService } from "@/lib/organizations/org-service";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: organizationId } = await ctx.params;

  const hasAccess = await OrganizationService.verifyOrgAccess(user.id, organizationId, ["owner", "admin"]);
  if (!hasAccess) {
    return Response.json({ error: "Unauthorized access to organization analytics", code: "FORBIDDEN" }, { status: 403 });
  }

  const analytics = await OrganizationService.getOrganizationAnalytics(organizationId);
  return { analytics };
}, { requireAuth: true });
