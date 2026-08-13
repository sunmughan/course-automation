import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { createOrganization, listOrganizations, getOrganizationBySlug } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const organizations = await listOrganizations();

  await logAudit({
    userId: user.id,
    action: "organizations:list",
    resource: "organization",
  });

  return { organizations };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createOrgSchema>;

  const existing = await getOrganizationBySlug(body.slug);
  if (existing) {
    return Response.json({ error: "Organization with this slug already exists", code: "CONFLICT" }, { status: 409 });
  }

  const organization = await createOrganization({
    name: body.name,
    slug: body.slug,
    description: body.description,
  });

  await logAudit({
    userId: user.id,
    action: "organizations:create",
    resource: "organization",
    resourceId: organization.id,
    details: { name: body.name, slug: body.slug },
  });

  return { organization };
}, { requireAdmin: true, bodySchema: createOrgSchema });