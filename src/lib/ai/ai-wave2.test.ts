import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, fetchMock } = vi.hoisted(() => {
  const pMock = {
    aIRequest: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    routingRule: {
      upsert: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
    },
  };
  return { prismaMock: pMock, fetchMock: vi.fn() };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { aiGateway } from "./gateway";
import { aiRouter, AIRouter } from "./router";
import { tokenRouter, TokenRouter } from "./token-router";
import { agentOrchestrator } from "./orchestrator";
import { aiTracer } from "./tracing";
import { providerHealthMonitor } from "./health-monitor";
import { persistAIRequest } from "./persistence";
import { createNvidiaAdapter } from "./providers/nvidia";
import { createGeminiAdapter } from "./providers/gemini";
import { createAgentRouterAdapter } from "./providers/agent-router";
import { createTokenRouterAdapter } from "./providers/token-router";

describe("Wave 2: AI Persistence, Observability, and Provider Adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("2.1 & 2.2: AI Trace and Token Usage Persistence", () => {
    it("persists complete request lifecycle, token counts, cost, and context to Prisma", async () => {
      prismaMock.aIRequest.upsert.mockResolvedValue({ id: "trace-101" });
      const startedAt = new Date("2026-08-14T10:00:00.000Z");
      const completedAt = new Date("2026-08-14T10:00:01.500Z");

      await persistAIRequest({
        requestId: "req-trace-1",
        userId: "user-42",
        organizationId: "org-99",
        sessionId: "sess-123",
        provider: "gemini",
        model: "gemini-3.5-flash",
        agent: "senior-engineer",
        mode: "code_generation",
        startedAt,
        completedAt,
        latency: 1500,
        status: "success",
        inputTokens: 250,
        outputTokens: 150,
        estimatedCost: 0.0006,
        fallbackUsed: false,
        attemptedProviders: ["gemini"],
        attemptedModels: ["gemini-3.5-flash"],
        finalProvider: "gemini",
      });

      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith({
        where: { requestId: "req-trace-1" },
        create: expect.objectContaining({
          requestId: "req-trace-1",
          userId: "user-42",
          organizationId: "org-99",
          sessionId: "sess-123",
          provider: "gemini",
          model: "gemini-3.5-flash",
          agent: "senior-engineer",
          mode: "code_generation",
          inputTokens: 250,
          outputTokens: 150,
          totalTokens: 400,
          cost: 0.0006,
          estimatedCost: 0.0006,
          latency: 1500,
          status: "success",
          fallbackUsed: false,
          attemptedProviders: JSON.stringify(["gemini"]),
          attemptedModels: JSON.stringify(["gemini-3.5-flash"]),
          finalProvider: "gemini",
        }),
        update: expect.objectContaining({
          status: "success",
          latency: 1500,
          totalTokens: 400,
        }),
      });
    });

    it("retrieves persistent traces and user history via AITracer DB lookup", async () => {
      prismaMock.aIRequest.findUnique.mockResolvedValue({
        id: "cuid-1",
        requestId: "req-persisted-1",
        userId: "user-42",
        organizationId: "org-99",
        sessionId: "sess-123",
        provider: "nvidia",
        model: "meta/llama-3.3-70b-instruct",
        agent: "debugger",
        mode: "debugging",
        status: "success",
        latency: 450,
        cost: 0.001,
        estimatedCost: 0.001,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        fallbackUsed: false,
        attemptedProviders: JSON.stringify(["nvidia"]),
        attemptedModels: JSON.stringify(["meta/llama-3.3-70b-instruct"]),
        finalProvider: "nvidia",
        error: null,
        startedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date(),
      });

      const trace = await aiTracer.getPersistedTrace("req-persisted-1");
      expect(trace).not.toBeNull();
      expect(trace?.requestId).toBe("req-persisted-1");
      expect(trace?.provider).toBe("nvidia");
      expect(trace?.attemptedProviders).toEqual(["nvidia"]);
      expect(trace?.finalProvider).toBe("nvidia");

      prismaMock.aIRequest.findMany.mockResolvedValue([
        {
          id: "cuid-1",
          requestId: "req-persisted-1",
          userId: "user-42",
          organizationId: "org-99",
          sessionId: "sess-123",
          provider: "nvidia",
          model: "meta/llama-3.3-70b-instruct",
          agent: "debugger",
          mode: "debugging",
          status: "success",
          latency: 450,
          cost: 0.001,
          estimatedCost: 0.001,
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          fallbackUsed: false,
          attemptedProviders: JSON.stringify(["nvidia"]),
          attemptedModels: JSON.stringify(["meta/llama-3.3-70b-instruct"]),
          finalProvider: "nvidia",
          error: null,
          startedAt: new Date(),
          completedAt: new Date(),
          createdAt: new Date(),
        },
      ]);

      const userTraces = await aiTracer.getPersistedUserTraces("user-42");
      expect(userTraces).toHaveLength(1);
      expect(userTraces[0].userId).toBe("user-42");
    });
  });

  describe("2.3: Real Fallback Tracking", () => {
    it("tracks multiple attempts when primary provider fails and fallback succeeds", async () => {
      const router = new AIRouter();
      vi.spyOn(router, "route").mockResolvedValue({
        decision: {
          provider: "nvidia",
          model: "deepseek-ai/deepseek-r1",
          score: 0.95,
          fallbackChain: ["gemini"],
          scoredCandidates: [],
          reasoning: "Test reasoning",
        },
        classification: {
          taskType: "code_generation",
          capability: "code_generation",
          confidence: 0.9,
          complexity: "high",
        },
      });

      vi.spyOn(aiGateway, "getProvider").mockImplementation((name: string) => {
        if (name === "nvidia") {
          return {
            name: "nvidia",
            baseUrl: "https://nvidia.example.com",
            apiKey: "nv-key",
            models: [{ name: "deepseek-ai/deepseek-r1", maxTokens: 131072, costPer1K: 0.0035, capabilities: ["code_generation"] }],
          };
        }
        if (name === "gemini") {
          return {
            name: "gemini",
            baseUrl: "https://gemini.example.com",
            apiKey: "gem-key",
            models: [{ name: "gemini-3.7-flash", maxTokens: 1048576, costPer1K: 0.00125, capabilities: ["code_generation"] }],
          };
        }
        return undefined;
      });

      vi.spyOn(providerHealthMonitor, "isProviderAvailable").mockReturnValue(true);

      const callProviderSpy = vi.spyOn(aiGateway, "callProvider")
        .mockRejectedValueOnce(new Error("NVIDIA connection timeout"))
        .mockResolvedValueOnce({
          content: "export function solve() { return true; }",
          model: "gemini-3.7-flash",
          provider: "gemini",
          inputTokens: 150,
          outputTokens: 80,
          latency: 420,
          cost: 0.0003,
        });

      const result = await router.executeWithFallback(
        [{ role: "user", content: "Write a solve function" }],
        {
          userId: "user-100",
          organizationId: "org-100",
          sessionId: "session-100",
          agent: "tutor",
          mode: "code_generation",
        }
      );

      expect(callProviderSpy).toHaveBeenCalledTimes(2);
      expect(result.fallbackUsed).toBe(true);
      expect(result.attemptedProviders).toEqual(["nvidia", "gemini"]);
      expect(result.attemptedModels).toEqual(["deepseek-ai/deepseek-r1", "gemini-3.7-flash"]);
      expect(result.finalProvider).toBe("gemini");
      expect(result.content).toContain("export function solve");

      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: "user-100",
            organizationId: "org-100",
            sessionId: "session-100",
            provider: "gemini",
            model: "gemini-3.7-flash",
            agent: "tutor",
            fallbackUsed: true,
            attemptedProviders: JSON.stringify(["nvidia", "gemini"]),
            attemptedModels: JSON.stringify(["deepseek-ai/deepseek-r1", "gemini-3.7-flash"]),
            finalProvider: "gemini",
            status: "success",
          }),
        })
      );
    });

    it("persists failed status and error message when all providers in fallback chain fail", async () => {
      const router = new AIRouter();
      vi.spyOn(router, "route").mockResolvedValue({
        decision: {
          provider: "nvidia",
          model: "deepseek-ai/deepseek-r1",
          score: 0.9,
          fallbackChain: ["gemini"],
          scoredCandidates: [],
          reasoning: "Test reasoning",
        },
        classification: {
          taskType: "debugging",
          capability: "debugging",
          confidence: 0.85,
          complexity: "medium",
        },
      });

      vi.spyOn(aiGateway, "getProvider").mockImplementation((name: string) => {
        return {
          name,
          baseUrl: "https://example.com",
          apiKey: "key",
          models: [{ name: `${name}-model`, maxTokens: 10000, costPer1K: 0.001, capabilities: ["debugging"] }],
        };
      });

      vi.spyOn(providerHealthMonitor, "isProviderAvailable").mockReturnValue(true);

      vi.spyOn(aiGateway, "callProvider")
        .mockRejectedValueOnce(new Error("NVIDIA 503 Service Unavailable"))
        .mockRejectedValueOnce(new Error("Gemini 429 Rate Limited"));

      const result = await router.executeWithFallback(
          [{ role: "user", content: "Debug this syntax error" }],
          {
            userId: "user-101",
            requestId: "req-all-fail",
            agent: "debugger",
            mode: "debug",
          }
        );

      // Now returns local fallback instead of throwing
      expect(result.provider).toBe("local");
      expect(result.model).toBe("local-knowledge-base");

      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            requestId: "req-all-fail",
            userId: "user-101",
            status: "fallback",
            error: "Gemini 429 Rate Limited",
            fallbackUsed: true,
            attemptedProviders: JSON.stringify(["nvidia", "gemini"]),
            finalProvider: "local",
          }),
        })
      );
    });
  });

  describe("2.2: Token Router Execution and Budget Propagation", () => {
    it("propagates user, org, and session context and persists token usage", async () => {
      const router = new TokenRouter();
      vi.spyOn(router, "checkDailyBudget").mockResolvedValue({
        withinBudget: true,
        currentUsage: null,
        remaining: { tokens: 500000, cost: 0.25 },
      });

      vi.spyOn(router, "getSmartAllocation").mockReturnValue({
        provider: "gemini",
        model: "gemini-3.5-flash",
        estimatedInputTokens: 120,
        maxOutputTokens: 250,
        estimatedCost: 0.0001,
        isWithinBudget: true,
      });

      vi.spyOn(aiGateway, "callProvider").mockResolvedValue({
        content: "Smart token response",
        model: "gemini-3.5-flash",
        provider: "gemini",
        inputTokens: 120,
        outputTokens: 200,
        latency: 180,
        cost: 0.0001,
      });

      const result = await router.executeWithTokenBudget(
        [{ role: "user", content: "Explain big-O notation" }],
        "explain",
        "low",
        "user-budget-1",
        {
          organizationId: "org-budget-1",
          requestId: "req-budget-1",
          sessionId: "sess-budget-1",
          agent: "teacher",
          mode: "explain",
        }
      );

      expect(result.content).toBe("Smart token response");
      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            requestId: "req-budget-1",
            userId: "user-budget-1",
            organizationId: "org-budget-1",
            sessionId: "sess-budget-1",
            provider: "gemini",
            model: "gemini-3.5-flash",
            agent: "teacher",
            inputTokens: 120,
            outputTokens: 200,
            totalTokens: 320,
            finalProvider: "gemini",
          }),
        })
      );
    });

    it("handles token budget exhaustion correctly", async () => {
      const router = new TokenRouter();
      vi.spyOn(router, "checkDailyBudget").mockResolvedValue({
        withinBudget: false,
        currentUsage: null,
        remaining: { tokens: 0, cost: 0 },
      });

      await expect(
        router.executeWithTokenBudget(
          [{ role: "user", content: "Do some heavy work" }],
          "code_generation",
          "high",
          "user-exhausted"
        )
      ).rejects.toThrow(/Daily token budget.*exhausted/);
    });
  });

  describe("2.4: Provider Adapter Boundary", () => {
    it("creates adapters conforming to AIProviderAdapter for nvidia, gemini, agentrouter, and tokenrouter", () => {
      const generate = vi.fn();
      const stream = vi.fn();
      const healthCheck = vi.fn();
      const deps = { generate, stream, healthCheck };

      const nvAdapter = createNvidiaAdapter({ name: "nvidia", baseUrl: "https://nv.com", apiKey: "k", models: [] }, deps);
      const gemAdapter = createGeminiAdapter({ name: "gemini", baseUrl: "https://gem.com", apiKey: "k", models: [] }, deps);
      const arAdapter = createAgentRouterAdapter({ name: "agentrouter", baseUrl: "https://ar.com", apiKey: "k", models: [] }, deps);
      const trAdapter = createTokenRouterAdapter({ name: "tokenrouter", baseUrl: "https://tr.com", apiKey: "k", models: [] }, deps);

      expect(nvAdapter.name).toBe("nvidia");
      expect(nvAdapter.protocol).toBe("openai-compatible");
      expect(gemAdapter.name).toBe("gemini");
      expect(gemAdapter.protocol).toBe("gemini");
      expect(arAdapter.name).toBe("agentrouter");
      expect(arAdapter.protocol).toBe("openai-compatible");
      expect(trAdapter.name).toBe("tokenrouter");
      expect(trAdapter.protocol).toBe("token-router");

      expect(nvAdapter.generate).toBe(generate);
      expect(nvAdapter.stream).toBe(stream);
      expect(nvAdapter.healthCheck).toBe(healthCheck);
    });

    it("AIGateway getProviderAdapter returns appropriate adapter instance", () => {
      const nvAdapter = aiGateway.getProviderAdapter({ name: "nvidia", baseUrl: "https://nv.com", apiKey: "k", models: [] });
      const gemAdapter = aiGateway.getProviderAdapter({ name: "gemini", baseUrl: "https://gem.com", apiKey: "k", models: [] });
      const trAdapter = aiGateway.getProviderAdapter({ name: "tokenrouter", baseUrl: "https://tr.com", apiKey: "k", models: [] });

      expect(nvAdapter.protocol).toBe("openai-compatible");
      expect(gemAdapter.protocol).toBe("gemini");
      expect(trAdapter.protocol).toBe("token-router");
      expect(typeof nvAdapter.generate).toBe("function");
      expect(typeof nvAdapter.stream).toBe("function");
      expect(typeof nvAdapter.healthCheck).toBe("function");
    });
  });

  describe("Agent Orchestrator Observability & Context Propagation", () => {
    it("multi-agent parallel execution persists individual agent requests with context", async () => {
      vi.spyOn(aiGateway, "callProvider").mockImplementation(async (provider, model, msgs, opts) => {
        return {
          content: `Response from ${opts?.agent || "agent"} using ${provider}`,
          model,
          provider,
          inputTokens: 50,
          outputTokens: 40,
          latency: 120,
          cost: 0.0001,
        };
      });

      const result = await agentOrchestrator.execute({
        mode: "parallel",
        agents: [
          {
            id: "senior-engineer",
            name: "Senior Engineer",
            description: "Experienced dev",
            systemPromptAddition: "",
            expertise: ["code_generation"],
            preferredProvider: "nvidia",
            preferredModel: "deepseek-ai/deepseek-r1",
          },
          {
            id: "teacher",
            name: "Teacher",
            description: "Educator",
            systemPromptAddition: "",
            expertise: ["explain"],
            preferredProvider: "gemini",
            preferredModel: "gemini-3.7-flash",
          },
        ],
        messages: [{ role: "user", content: "Review async/await patterns" }],
        taskType: "explain",
        complexity: "medium",
        userId: "user-orch-1",
        organizationId: "org-orch-1",
        sessionId: "sess-orch-1",
      });

      expect(result.agents).toHaveLength(2);
      expect(result.meta.totalTokens).toBe(180);
      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledTimes(2);
      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: "user-orch-1",
            organizationId: "org-orch-1",
            sessionId: "sess-orch-1",
            mode: "parallel",
          }),
        })
      );
    });

    it("multi-agent chain execution persists requests for every step in the chain", async () => {
      vi.spyOn(aiGateway, "callProvider").mockImplementation(async (provider, model, msgs, opts) => {
        return {
          content: `Chain step output from ${opts?.agent || "agent"}`,
          model,
          provider,
          inputTokens: 60,
          outputTokens: 45,
          latency: 150,
          cost: 0.00015,
        };
      });

      const result = await agentOrchestrator.execute({
        mode: "chain",
        agents: [
          {
            id: "teacher",
            name: "Teacher",
            description: "Educator",
            systemPromptAddition: "",
            expertise: ["explain"],
            preferredProvider: "gemini",
            preferredModel: "gemini-3.5-flash",
          },
          {
            id: "code-reviewer",
            name: "Code Reviewer",
            description: "Reviewer",
            systemPromptAddition: "",
            expertise: ["review"],
            preferredProvider: "gemini",
            preferredModel: "gemini-3.7-flash",
          },
        ],
        messages: [{ role: "user", content: "Explain closures and review sample code" }],
        taskType: "explain",
        complexity: "medium",
        userId: "user-chain-1",
        organizationId: "org-chain-1",
      });

      expect(result.agents).toHaveLength(2);
      expect(result.finalContent).toContain("Chain step output");
      expect(prismaMock.aIRequest.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
