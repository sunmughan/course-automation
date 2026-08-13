import { prisma } from "@/lib/db";

export interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customDomain: string | null;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface MemberData {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  permissions: string[];
  joinedAt: string;
}

export async function createOrganization(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<OrganizationData> {
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
    },
  });
  return formatOrganization(org);
}

export async function getOrganization(orgId: string): Promise<OrganizationData | null> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return null;
  return formatOrganization(org);
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationData | null> {
  const org = await prisma.organization.findUnique({ where: { slug } });
  if (!org) return null;
  return formatOrganization(org);
}

export async function listOrganizations(): Promise<OrganizationData[]> {
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
  });
  return orgs.map(formatOrganization);
}

export async function updateOrganization(
  orgId: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    customDomain?: string;
    isActive?: boolean;
    settings?: Record<string, unknown>;
  }
): Promise<OrganizationData> {
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
      ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
      ...(data.customDomain !== undefined && { customDomain: data.customDomain }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.settings !== undefined && { settings: JSON.stringify(data.settings) }),
    },
  });
  return formatOrganization(org);
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await prisma.organization.delete({ where: { id: orgId } });
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: string = "member",
  permissions: string[] = []
): Promise<MemberData> {
  const membership = await prisma.organizationMember.create({
    data: {
      organizationId: orgId,
      userId,
      role,
      permissions: JSON.stringify(permissions),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return {
    id: membership.id,
    userId: membership.userId,
    userName: membership.user.name || "Unknown",
    userEmail: membership.user.email,
    role: membership.role,
    permissions: JSON.parse(membership.permissions),
    joinedAt: membership.joinedAt.toISOString(),
  };
}

export async function removeOrganizationMember(
  orgId: string,
  userId: string
): Promise<void> {
  await prisma.organizationMember.deleteMany({
    where: { organizationId: orgId, userId },
  });
}

export async function getOrganizationMembers(
  orgId: string
): Promise<MemberData[]> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: "desc" },
  });
  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    userName: m.user.name || "Unknown",
    userEmail: m.user.email,
    role: m.role,
    permissions: JSON.parse(m.permissions),
    joinedAt: m.joinedAt.toISOString(),
  }));
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: string,
  permissions?: string[]
): Promise<MemberData> {
  const data: Record<string, unknown> = { role };
  if (permissions !== undefined) {
    data.permissions = JSON.stringify(permissions);
  }

  const membership = await prisma.organizationMember.update({
    where: { organizationId_userId: { organizationId: orgId, userId } },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return {
    id: membership.id,
    userId: membership.userId,
    userName: membership.user.name || "Unknown",
    userEmail: membership.user.email,
    role: membership.role,
    permissions: JSON.parse(membership.permissions),
    joinedAt: membership.joinedAt.toISOString(),
  };
}

function formatOrganization(org: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  customDomain: string | null;
  isActive: boolean;
  settings: string;
  createdAt: Date;
}): OrganizationData {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    accentColor: org.accentColor,
    customDomain: org.customDomain,
    isActive: org.isActive,
    settings: JSON.parse(org.settings),
    createdAt: org.createdAt.toISOString(),
  };
}