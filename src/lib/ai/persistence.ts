import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export interface AIRequestPersistenceInput {
  requestId: string;
  userId: string;
  organizationId?: string | null;
  sessionId?: string | null;
  provider: string;
  model: string;
  agent?: string | null;
  mode: string;
  startedAt: Date;
  completedAt?: Date | null;
  latency?: number;
  status: "running" | "success" | "failed" | "fallback";
  error?: string | null;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
  attemptedModels?: string[];
  finalProvider?: string | null;
}

export function createAIRequestId(): string {
  return randomUUID();
}

export async function persistAIRequest(input: AIRequestPersistenceInput): Promise<void> {
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;
  const completedAt = input.completedAt ?? null;
  const data = {
    userId: input.userId,
    organizationId: input.organizationId ?? null,
    sessionId: input.sessionId ?? null,
    provider: input.provider,
    model: input.model,
    agent: input.agent ?? null,
    mode: input.mode,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    latency: input.latency ?? 0,
    cost: input.estimatedCost ?? 0,
    estimatedCost: input.estimatedCost ?? 0,
    status: input.status,
    error: input.error ?? null,
    fallbackUsed: input.fallbackUsed ?? false,
    attemptedProviders: JSON.stringify(input.attemptedProviders ?? []),
    attemptedModels: JSON.stringify(input.attemptedModels ?? []),
    finalProvider: input.finalProvider ?? null,
    startedAt: input.startedAt,
    completedAt,
  };

  await prisma.aIRequest.upsert({
    where: { requestId: input.requestId },
    create: { requestId: input.requestId, ...data },
    update: data,
  });
}
