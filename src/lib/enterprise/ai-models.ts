import { prisma } from "@/lib/db";

export interface CustomAIModelData {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string[];
  maxTokens: number;
  costPer1K: number;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatCustomAIModel(model: {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string;
  maxTokens: number;
  costPer1K: number;
  settings: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomAIModelData {
  return {
    id: model.id,
    organizationId: model.organizationId,
    name: model.name,
    provider: model.provider,
    model: model.model,
    capabilities: JSON.parse(model.capabilities),
    maxTokens: model.maxTokens,
    costPer1K: model.costPer1K,
    settings: JSON.parse(model.settings),
    isActive: model.isActive,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export async function createCustomAIModel(data: {
  organizationId: string;
  name: string;
  provider: string;
  model: string;
  capabilities?: string[];
  maxTokens?: number;
  costPer1K?: number;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}): Promise<CustomAIModelData> {
  const model = await prisma.customAIModel.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      provider: data.provider,
      model: data.model,
      capabilities:
        data.capabilities !== undefined ? JSON.stringify(data.capabilities) : "[]",
      maxTokens: data.maxTokens ?? 4096,
      costPer1K: data.costPer1K ?? 0,
      settings: data.settings !== undefined ? JSON.stringify(data.settings) : "{}",
      isActive: data.isActive ?? true,
    },
  });

  return formatCustomAIModel(model);
}

export async function getCustomAIModel(
  modelId: string
): Promise<CustomAIModelData | null> {
  const model = await prisma.customAIModel.findUnique({
    where: { id: modelId },
  });

  return model ? formatCustomAIModel(model) : null;
}

export async function listCustomAIModels(
  organizationId: string
): Promise<CustomAIModelData[]> {
  const models = await prisma.customAIModel.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return models.map(formatCustomAIModel);
}

export async function updateCustomAIModel(
  modelId: string,
  data: {
    name?: string;
    provider?: string;
    model?: string;
    capabilities?: string[];
    maxTokens?: number;
    costPer1K?: number;
    settings?: Record<string, unknown>;
    isActive?: boolean;
  }
): Promise<CustomAIModelData> {
  const model = await prisma.customAIModel.update({
    where: { id: modelId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.provider !== undefined && { provider: data.provider }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.capabilities !== undefined && {
        capabilities: JSON.stringify(data.capabilities),
      }),
      ...(data.maxTokens !== undefined && { maxTokens: data.maxTokens }),
      ...(data.costPer1K !== undefined && { costPer1K: data.costPer1K }),
      ...(data.settings !== undefined && { settings: JSON.stringify(data.settings) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return formatCustomAIModel(model);
}

export async function deleteCustomAIModel(modelId: string): Promise<void> {
  await prisma.customAIModel.delete({
    where: { id: modelId },
  });
}
