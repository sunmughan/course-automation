import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { tokenRouter } from "@/lib/ai/token-router";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const usage = await tokenRouter.getDailyUsage(user.id, date);
    const budget = tokenRouter.getBudget();
    const { withinBudget, remaining } = await tokenRouter.checkDailyBudget(user.id);

    const providers = aiGateway.getAllProviders();
    const providerStatuses: Record<string, unknown> = {};
    for (const provider of providers) {
      const status = aiGateway.getProviderStatus(provider.name);
      providerStatuses[provider.name] = {
        circuitOpen: status.circuitOpen,
        failures: status.failures,
        consecutiveSuccesses: status.consecutiveSuccesses,
        averageLatency: status.averageLatency,
        health: status.health
          ? {
              isHealthy: status.health.isHealthy,
              successRate: status.health.successRate,
              avgLatency: status.health.avgLatency,
              errorRate: status.health.errorRate,
            }
          : null,
      };
    }

    const pricing = tokenRouter.getProviderPricing();

    return NextResponse.json({
      usage: {
        date: usage.date,
        totalTokens: usage.totalTokens,
        totalCost: usage.totalCost,
        requestCount: usage.requestCount,
        providerBreakdown: usage.providerBreakdown,
      },
      budget: {
        dailyTokenBudget: budget.dailyTokenBudget,
        dailyCostBudget: budget.dailyCostBudget,
        maxTokensPerRequest: budget.maxTokensPerRequest,
        maxCostPerRequest: budget.maxCostPerRequest,
        withinBudget,
        remaining,
      },
      providers: providerStatuses,
      pricing,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}