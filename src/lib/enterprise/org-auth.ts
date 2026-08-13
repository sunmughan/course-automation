import { prisma } from "@/lib/db";

export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: string;
  permissions: string[];
}

export async function getUserOrgMemberships(
  userId: string
): Promise<OrgMembership[]> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, isActive: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships
    .filter((m) => m.organization.isActive)
    .map((m) => ({
      organizationId: m.organizationId,
      organizationName: m.organization.name,
      organizationSlug: m.organization.slug,
      role: m.role,
      permissions: JSON.parse(m.permissions),
    }));
}

export async function getUserOrgPermissions(
  userId: string,
  organizationId: string
): Promise<string[]> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });

  if (!membership) return [];
  return JSON.parse(membership.permissions);
}

export async function isOrgAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });
  return membership?.role === "admin";
}

export async function getUserDefaultOrg(
  userId: string
): Promise<OrgMembership | null> {
  const memberships = await getUserOrgMemberships(userId);
  return memberships.length > 0 ? memberships[0] : null;
}