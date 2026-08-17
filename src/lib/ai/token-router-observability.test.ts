import { beforeEach, describe, expect, it, vi } from "vitest";

const { gatewayMock, requestUpsertMock } = vi.hoisted(() => ({
  gatewayMock: {
    getAllProviders: vi.fn(() => []),
    getActiveProviders: vi.fn(() => []),
    estimateTokens: vi.fn((text: string) => Math.ceil(text.length / 4)),
    callProvider: vi.fn(),
  },
  requestUpsertMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    aIRequest: {
      findMany: vi.fn(() => []),
      upsert: requestUpsertMock,
    },
  },
}));
vi.mock("./gateway", () => ({ aiGateway: gatewayMock }));
vi.mock("./health-monitor", () => ({
  providerHealthMonitor: { isCircuitOpen: vi.fn(() => false) },
}));

import { TokenRouter } from "./token-router";

describe("token budget context propagation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes user and organization context into gateway execution", async () => {
    gatewayMock.callProvider.mockResolvedValue({
      content: "ok",
      provider: "gemini",
      model: "gemini-model",
      inputTokens: 10,
      outputTokens: 5,
      latency: 20,
      cost: 0.001,
    });

    const router = new TokenRouter();
    vi.spyOn(router, "checkDailyBudget").mockResolvedValue({
      withinBudget: true,
      currentUsage: null,
      remaining: { tokens: 100000, cost: 1 },
    });
    vi.spyOn(router, "getSmartAllocation").mockReturnValue({
      provider: "gemini",
      model: "gemini-model",
      estimatedInputTokens: 100,
      maxOutputTokens: 100,
      estimatedCost: 0.001,
      isWithinBudget: true,
    });

    await router.executeWithTokenBudget(
      [{ role: "user", content: "Explain closures" }],
      "explain",
      "medium",
      "user-1",
      {
        organizationId: "org-1",
        requestId: "req-1",
        sessionId: "session-1",
        agent: "tutor",
      }
    );

    expect(gatewayMock.callProvider).toHaveBeenCalledWith(
      "gemini",
      "gemini-model",
      expect.any(Array),
      expect.objectContaining({
        userId: "user-1",
        organizationId: "org-1",
        requestId: "req-1",
        sessionId: "session-1",
        agent: "tutor",
      })
    );
    expect(requestUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { requestId: "req-1" },
        create: expect.objectContaining({
          requestId: "req-1",
          userId: "user-1",
          organizationId: "org-1",
          sessionId: "session-1",
          agent: "tutor",
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          finalProvider: "gemini",
        }),
      })
    );
  });
});
