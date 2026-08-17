import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    aIRequest: { upsert: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { persistAIRequest } from "./persistence";

describe("AI request persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists trace, usage, cost, context, and fallback details for one request", async () => {
    prismaMock.aIRequest.upsert.mockResolvedValue({ id: "trace-1" });
    const startedAt = new Date("2026-08-13T10:00:00.000Z");
    const completedAt = new Date("2026-08-13T10:00:01.250Z");

    await persistAIRequest({
      requestId: "req-1",
      userId: "user-1",
      organizationId: "org-1",
      sessionId: "session-1",
      provider: "gemini",
      model: "gemini-3.5-flash",
      agent: "tutor",
      mode: "explain",
      startedAt,
      completedAt,
      latency: 1250,
      status: "success",
      error: null,
      inputTokens: 120,
      outputTokens: 80,
      estimatedCost: 0.002,
      fallbackUsed: true,
      attemptedProviders: ["nvidia", "gemini"],
      attemptedModels: ["meta/llama-3.3-70b-instruct", "gemini-3.5-flash"],
      finalProvider: "gemini",
    });

    expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith({
      where: { requestId: "req-1" },
      create: expect.objectContaining({
        requestId: "req-1",
        userId: "user-1",
        organizationId: "org-1",
        sessionId: "session-1",
        provider: "gemini",
        model: "gemini-3.5-flash",
        agent: "tutor",
        inputTokens: 120,
        outputTokens: 80,
        totalTokens: 200,
        cost: 0.002,
        estimatedCost: 0.002,
        fallbackUsed: true,
        attemptedProviders: JSON.stringify(["nvidia", "gemini"]),
        attemptedModels: JSON.stringify(["meta/llama-3.3-70b-instruct", "gemini-3.5-flash"]),
        finalProvider: "gemini",
      }),
      update: expect.objectContaining({
        status: "success",
        completedAt,
        latency: 1250,
      }),
    });
  });
});
