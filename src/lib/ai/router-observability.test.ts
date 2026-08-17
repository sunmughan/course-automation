import { beforeEach, describe, expect, it, vi } from "vitest";

const { aiGatewayMock, providerHealthMock, requestUpsertMock } = vi.hoisted(() => ({
  aiGatewayMock: {
    estimateTokens: vi.fn(() => 100),
    getActiveProviders: vi.fn(),
    getProviderModels: vi.fn(),
    getProvider: vi.fn(),
    callProvider: vi.fn(),
  },
  providerHealthMock: {
    isProviderAvailable: vi.fn(() => true),
    getHealthSummary: vi.fn(() => ({
      isHealthy: true,
      successRate: 100,
      avgLatency: 10,
      lastChecked: Date.now(),
    })),
  },
  requestUpsertMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    routingRule: { upsert: vi.fn() },
    aIRequest: { upsert: requestUpsertMock },
  },
}));
vi.mock("./gateway", () => ({ aiGateway: aiGatewayMock }));
vi.mock("./health-monitor", () => ({ providerHealthMonitor: providerHealthMock }));

import { AIRouter } from "./router";

describe("AI fallback tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiGatewayMock.getActiveProviders.mockReturnValue([
      { name: "nvidia" },
      { name: "gemini" },
    ]);
    aiGatewayMock.getProviderModels.mockImplementation((name: string) => [
      {
        name: name === "nvidia" ? "nvidia-model" : "gemini-model",
        capabilities: ["explain", "simple_qa"],
        maxTokens: 10000,
        costPer1K: 0.001,
      },
    ]);
    aiGatewayMock.getProvider.mockImplementation((name: string) => ({
      name,
      models: aiGatewayMock.getProviderModels(name),
    }));
  });

  it("returns the actual attempt chain when a provider fails and fallback succeeds", async () => {
    aiGatewayMock.callProvider
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({
        content: "ok",
        provider: "gemini",
        model: "gemini-model",
        inputTokens: 10,
        outputTokens: 5,
        latency: 20,
        cost: 0.001,
      });

    const router = new AIRouter();
    const result = await router.executeWithFallback(
      [{ role: "user", content: "Explain closures" }],
      {
        preferredProvider: "nvidia",
        preferredModel: "nvidia-model",
        userId: "user-1",
        organizationId: "org-1",
        requestId: "req-1",
        sessionId: "session-1",
        agent: "tutor",
      }
    );

    expect(result.fallbackUsed).toBe(true);
    expect(result.attemptedProviders).toEqual(["nvidia", "gemini"]);
    expect(result.attemptedModels).toEqual(["nvidia-model", "gemini-model"]);
    expect(result.finalProvider).toBe("gemini");
    expect(aiGatewayMock.callProvider).toHaveBeenNthCalledWith(
      1,
      "nvidia",
      "nvidia-model",
      expect.any(Array),
      expect.objectContaining({
        userId: "user-1",
        organizationId: "org-1",
        requestId: "req-1",
        sessionId: "session-1",
        agent: "tutor",
      })
    );
  });
});
