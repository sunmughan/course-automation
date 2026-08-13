import { prisma } from "@/lib/db";

export interface PolicyData {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description: string | null;
  rules: Record<string, unknown>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatPolicy(policy: {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description: string | null;
  rules: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PolicyData {
  return {
    id: policy.id,
    organizationId: policy.organizationId,
    name: policy.name,
    type: policy.type,
    description: policy.description,
    rules: JSON.parse(policy.rules),
    isEnabled: policy.isEnabled,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

export async function createPolicy(data: {
  organizationId: string;
  name: string;
  type: string;
  description?: string;
  rules?: Record<string, unknown>;
  isEnabled?: boolean;
}): Promise<PolicyData> {
  const policy = await prisma.policy.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      type: data.type,
      description: data.description,
      rules: data.rules !== undefined ? JSON.stringify(data.rules) : "{}",
      isEnabled: data.isEnabled ?? true,
    },
  });

  return formatPolicy(policy);
}

export async function getPolicy(policyId: string): Promise<PolicyData | null> {
  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
  });

  return policy ? formatPolicy(policy) : null;
}

export async function listPolicies(
  organizationId: string
): Promise<PolicyData[]> {
  const policies = await prisma.policy.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return policies.map(formatPolicy);
}

export async function updatePolicy(
  policyId: string,
  data: {
    name?: string;
    type?: string;
    description?: string;
    rules?: Record<string, unknown>;
    isEnabled?: boolean;
  }
): Promise<PolicyData> {
  const policy = await prisma.policy.update({
    where: { id: policyId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.rules !== undefined && { rules: JSON.stringify(data.rules) }),
      ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
    },
  });

  return formatPolicy(policy);
}

export async function deletePolicy(policyId: string): Promise<void> {
  await prisma.policy.delete({
    where: { id: policyId },
  });
}
