import { prisma } from "@/lib/db";

export async function getAIOrganizationId(userId: string): Promise<string | undefined> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { joinedAt: "asc" },
  });

  return membership?.organizationId;
}
