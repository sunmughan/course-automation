import { aiGateway, type ProviderCallResult, type StreamChunk } from "./gateway";
import { aiRouter, type TaskType } from "./router";
import { tokenRouter, type TokenAllocation } from "./token-router";
import { tokenBudgetManager } from "./token-budget";
import { providerHealthMonitor } from "./health-monitor";
import { aiTracer } from "./tracing";
import { buildContext, type ContextBuildOptions, type AIContext } from "./context";
import { composePromptCompact, getModeSystemPrompt, getModeTaskInstruction } from "./prompts";
import { createAIRequestId, persistAIRequest } from "./persistence";
import type { TutorMode } from "@/types";

export type OrchestrationMode = "parallel" | "chain" | "voting" | "debate" | "fallback";

export interface AgentRole {
  id: string;
  name: string;
  description: string;
  systemPromptAddition: string;
  expertise: string[];
  preferredProvider?: string;
  preferredModel?: string;
}

export interface AgentTask {
  agentRole: AgentRole;
  messages: { role: string; content: string }[];
  allocation: TokenAllocation;
}

export interface AgentResult {
  agentRole: AgentRole;
  result: ProviderCallResult;
  rank?: number;
}

export interface OrchestrationResult {
  mode: OrchestrationMode;
  agents: AgentResult[];
  finalContent: string;
  consensus: {
    agreementLevel: "high" | "medium" | "low";
    commonPoints: string[];
    divergentPoints: string[];
  } | null;
  meta: {
    totalCost: number;
    totalTokens: number;
    totalLatency: number;
    providers: string[];
    models: string[];
  };
}

export interface OrchestrationOptions {
  mode: OrchestrationMode;
  agents: AgentRole[];
  messages: { role: string; content: string }[];
  taskType: string;
  complexity: "low" | "medium" | "high";
  userId: string;
  temperature?: number;
  aggregationPrompt?: string;
  requestId?: string;
  organizationId?: string;
  sessionId?: string;
}

const DEFAULT_AGENTS: AgentRole[] = [
  {
    id: "senior-engineer",
    name: "Senior Engineer",
    description: "Experienced software engineer focused on practical, production-ready solutions",
    systemPromptAddition:
      "You are a Senior Software Engineer with 15+ years of experience. Focus on practical, maintainable, production-ready solutions. Consider edge cases, error handling, and performance. Be pragmatic and direct.",
    expertise: ["code_generation", "architecture", "debugging", "review"],
    preferredProvider: "nvidia",
    preferredModel: "deepseek-ai/deepseek-r1",
  },
  {
    id: "teacher",
    name: "Teacher",
    description: "Patient educator focused on clear explanations and learning",
    systemPromptAddition:
      "You are a Patient Programming Teacher. Your goal is to educate and explain clearly. Use simple language, analogies, and step-by-step reasoning. Always check for understanding and encourage the learner.",
    expertise: ["explain", "simple_qa", "simplify", "visualization"],
    preferredProvider: "gemini",
    preferredModel: "gemini-3.7-flash",
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Meticulous reviewer focused on code quality, patterns, and best practices",
    systemPromptAddition:
      "You are a Meticulous Code Reviewer. Analyze code for correctness, style, performance, security, and maintainability. Point out anti-patterns, suggest improvements, and explain the reasoning behind each suggestion.",
    expertise: ["review", "debugging", "code_generation", "architecture"],
    preferredProvider: "gemini",
    preferredModel: "gemini-3.7-flash",
  },
  {
    id: "architect",
    name: "System Architect",
    description: "System design expert focused on architecture, scalability, and patterns",
    systemPromptAddition:
      "You are a System Architect specializing in scalable distributed systems. Think about system design, data flow, trade-offs, and architectural patterns. Consider the big picture and long-term maintainability.",
    expertise: ["architecture", "code_generation", "compare"],
    preferredProvider: "nvidia",
    preferredModel: "deepseek-ai/deepseek-r1",
  },
  {
    id: "debugger",
    name: "Debugger",
    description: "Debugging specialist focused on finding and fixing issues",
    systemPromptAddition:
      "You are a Debugging Specialist. Your approach is methodical and scientific. Form hypotheses, test them, and trace through code execution. Focus on root cause analysis, not just symptom fixes.",
    expertise: ["debugging", "code_generation"],
    preferredProvider: "gemini",
    preferredModel: "gemini-3.5-flash",
  },
  {
    id: "interviewer",
    name: "Technical Interviewer",
    description: "Interview-style problem solver focused on optimal solutions",
    systemPromptAddition:
      "You are a Technical Interviewer at a top tech company. Evaluate solutions for correctness, time/space complexity, and edge cases. Push for optimal solutions and clean code. Think aloud about trade-offs.",
    expertise: ["interview", "code_generation", "compare", "practice"],
    preferredProvider: "nvidia",
    preferredModel: "deepseek-ai/deepseek-r1",
  },
];

export class AgentOrchestrator {
  private agents: Map<string, AgentRole> = new Map();

  constructor() {
    for (const agent of DEFAULT_AGENTS) {
      this.registerAgent(agent);
    }
  }

  registerAgent(agent: AgentRole): void {
    this.agents.set(agent.id, agent);
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
  }

  getAgent(id: string): AgentRole | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentRole[] {
    return Array.from(this.agents.values());
  }

  selectAgentsForTask(
    taskType: string,
    count: number = 3
  ): AgentRole[] {
    const scored = Array.from(this.agents.values())
      .map((agent) => {
        const expertiseMatch = agent.expertise.filter((e) =>
          taskType.toLowerCase().includes(e.toLowerCase()) ||
          e.toLowerCase().includes(taskType.toLowerCase())
        ).length;
        return { agent, score: expertiseMatch };
      })
      .filter((a) => a.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return Array.from(this.agents.values()).slice(0, count);
    }

    return scored.slice(0, count).map((a) => a.agent);
  }

  async execute(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    switch (options.mode) {
      case "parallel":
        return this.executeParallel(options);
      case "chain":
        return this.executeChain(options);
      case "voting":
        return this.executeVoting(options);
      case "debate":
        return this.executeDebate(options);
      case "fallback":
        return this.executeFallback(options);
      default:
        return this.executeParallel(options);
    }
  }

  private async callAgentProvider(
    options: OrchestrationOptions,
    agent: AgentRole,
    provider: string,
    model: string,
    messages: { role: string; content: string }[],
    callOptions: { maxTokens?: number; temperature?: number }
  ): Promise<ProviderCallResult> {
    const requestId = createAIRequestId();
    const startedAt = new Date();

    try {
      const result = await aiGateway.callProvider(provider, model, messages, {
        ...callOptions,
        userId: options.userId,
        organizationId: options.organizationId,
        requestId,
        sessionId: options.sessionId,
        agent: agent.id,
        mode: options.mode,
      });
      const completedAt = new Date();
      const attemptedProviders = result.attemptedProviders ?? [result.provider];
      const attemptedModels = result.attemptedModels ?? [result.model];
      const fallbackUsed = result.fallbackUsed ?? attemptedProviders.length > 1;
      const finalProvider = result.finalProvider ?? result.provider;

      await persistAIRequest({
        requestId,
        userId: options.userId,
        organizationId: options.organizationId,
        sessionId: options.sessionId,
        provider: result.provider,
        model: result.model,
        agent: agent.id,
        mode: options.mode,
        startedAt,
        completedAt,
        latency: result.latency,
        status: "success",
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        estimatedCost: result.cost,
        fallbackUsed,
        attemptedProviders,
        attemptedModels,
        finalProvider,
      });

      return { ...result, fallbackUsed, attemptedProviders, attemptedModels, finalProvider };
    } catch (error) {
      const completedAt = new Date();
      const failure = error instanceof Error ? error : new Error(String(error));
      await persistAIRequest({
        requestId,
        userId: options.userId,
        organizationId: options.organizationId,
        sessionId: options.sessionId,
        provider,
        model,
        agent: agent.id,
        mode: options.mode,
        startedAt,
        completedAt,
        latency: completedAt.getTime() - startedAt.getTime(),
        status: "failed",
        error: failure.message,
        attemptedProviders: [provider],
        attemptedModels: [model],
        finalProvider: null,
      });
      throw failure;
    }
  }

  private async executeParallel(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const { agents, messages, taskType, complexity, userId, temperature } = options;

    const agentTasks = this.prepareAgentTasks(agents, messages, taskType, complexity, userId);

    const results = await Promise.all(
      agentTasks.map(async (task) => {
        try {
          const result = await this.callAgentProvider(
            options,
            task.agentRole,
            task.allocation.provider,
            task.allocation.model,
            task.messages,
            {
              maxTokens: task.allocation.maxOutputTokens,
              temperature,
            }
          );

          return { agentRole: task.agentRole, result };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            agentRole: task.agentRole,
            result: {
              content: `[${task.agentRole.name} failed: ${errorMessage}]`,
              model: task.allocation.model,
              provider: task.allocation.provider,
              inputTokens: 0,
              outputTokens: 0,
              latency: 0,
              cost: 0,
            },
          };
        }
      })
    );

    const successfulResults = results.filter((r) => r.result.content && !r.result.content.startsWith("["));
    const finalContent = this.synthesizeParallelResults(successfulResults, options);

    return this.buildOrchestrationResult("parallel", results, finalContent);
  }

  private async executeChain(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const { agents, messages, taskType, complexity, userId, temperature } = options;

    const agentResults: AgentResult[] = [];
    let previousOutput = "";
    const chainMessages = [...messages];

    const sortedAgents = [...agents].sort((a, b) => {
      const order = ["teacher", "senior-engineer", "architect", "code-reviewer", "debugger", "interviewer"];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

    for (let i = 0; i < sortedAgents.length; i++) {
      const agent = sortedAgents[i];
      const agentMessages = [...chainMessages];

      if (previousOutput && i > 0) {
        agentMessages.push({
          role: "assistant",
          content: `[Previous agent (${sortedAgents[i - 1].name}) analysis]:\n${previousOutput.substring(0, 2000)}`,
        });
        agentMessages.push({
          role: "user",
          content: `Build upon and improve the analysis above. Add your unique perspective as ${agent.name}. Correct any issues you find and enhance the overall response.`,
        });
      }

      const allocation = this.selectAllocationForAgent(
        agent,
        taskType,
        complexity,
        agentMessages.map((m) => m.content).join("\n"),
        userId
      ) || {
        provider: agent.preferredProvider || "gemini",
        model: agent.preferredModel || "gemini-3.5-flash",
        estimatedInputTokens: 4096,
        maxOutputTokens: 4096,
        estimatedCost: 0.001,
        isWithinBudget: true,
      };

      try {
        const result = await this.callAgentProvider(
          options,
          agent,
          allocation.provider,
          allocation.model,
          agentMessages,
          {
            maxTokens: allocation.maxOutputTokens,
            temperature,
          }
        );

        previousOutput = result.content;
        agentResults.push({ agentRole: agent, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        agentResults.push({
          agentRole: agent,
          result: {
            content: `[${agent.name} failed: ${errorMessage}]`,
            model: allocation.model,
            provider: allocation.provider,
            inputTokens: 0,
            outputTokens: 0,
            latency: 0,
            cost: 0,
          },
        });
      }
    }

    const finalContent =
      agentResults.length > 0
        ? agentResults[agentResults.length - 1].result.content
        : "No agent was able to process the request.";

    return this.buildOrchestrationResult("chain", agentResults, finalContent);
  }

  private async executeVoting(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const { agents, messages, taskType, complexity, userId, temperature } = options;

    if (agents.length < 2) {
      throw new Error("Voting mode requires at least 2 agents");
    }

    const agentTasks = this.prepareAgentTasks(agents, messages, taskType, complexity, userId);

    const results = await Promise.all(
      agentTasks.map(async (task) => {
        try {
          const result = await this.callAgentProvider(
            options,
            task.agentRole,
            task.allocation.provider,
            task.allocation.model,
            task.messages,
            {
              maxTokens: task.allocation.maxOutputTokens,
              temperature,
            }
          );

          return { agentRole: task.agentRole, result };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            agentRole: task.agentRole,
            result: {
              content: `[${task.agentRole.name} failed: ${errorMessage}]`,
              model: task.allocation.model,
              provider: task.allocation.provider,
              inputTokens: 0,
              outputTokens: 0,
              latency: 0,
              cost: 0,
            },
          };
        }
      })
    );

    const successfulResults = results.filter(
      (r) => r.result.content && !r.result.content.startsWith("[")
    );

    const finalContent = await this.synthesizeVotingResults(successfulResults, options);

    return this.buildOrchestrationResult("voting", results, finalContent);
  }

  private async executeDebate(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const { agents, messages, taskType, complexity, userId, temperature } = options;

    if (agents.length < 2) {
      throw new Error("Debate mode requires at least 2 agents");
    }

    const debateAgents = agents.slice(0, 3);
    const debateResults: AgentResult[] = [];
    const debateRounds = 2;

    const allDebateMessages: { role: string; content: string }[] = [];

    const initialTasks = this.prepareAgentTasks(debateAgents, messages, taskType, complexity, userId);

    const initialResponses = await Promise.all(
      initialTasks.map(async (task) => {
        try {
          const result = await this.callAgentProvider(
            options,
            task.agentRole,
            task.allocation.provider,
            task.allocation.model,
            task.messages,
            { maxTokens: task.allocation.maxOutputTokens, temperature }
          );
          return { agentRole: task.agentRole, result };
        } catch {
          return null;
        }
      })
    );

    const validResponses = initialResponses.filter(
      (r): r is AgentResult => r !== null && !r.result.content.startsWith("[")
    );

    for (let round = 1; round <= debateRounds; round++) {
      for (let i = 0; i < validResponses.length; i++) {
        const currentAgent = validResponses[i];
        const otherResponses = validResponses.filter((_, j) => j !== i);

        const debatePrompt = [
          ...messages,
          {
            role: "assistant",
            content: `[Your initial response as ${currentAgent.agentRole.name}]:\n${currentAgent.result.content.substring(0, 2000)}`,
          },
          {
            role: "user",
            content: `Round ${round} of debate. Other agents have provided these perspectives:\n\n${otherResponses
              .map(
                (r) =>
                  `[${r.agentRole.name}]: ${r.result.content.substring(0, 1000)}`
              )
              .join("\n\n")}\n\nCritically evaluate the other perspectives. Defend your position where you believe it is correct, and acknowledge where others have made better points. Refine your response accordingly.`,
          },
        ];

        const allocation = this.selectAllocationForAgent(
          currentAgent.agentRole,
          taskType,
          complexity,
          debatePrompt.map((m) => m.content).join("\n"),
          userId
        );

        if (!allocation) continue;

        try {
          const result = await this.callAgentProvider(
            options,
            currentAgent.agentRole,
            allocation.provider,
            allocation.model,
            debatePrompt,
            { maxTokens: allocation.maxOutputTokens, temperature: (temperature ?? 0.7) + 0.1 }
          );

          currentAgent.result = result;
          allDebateMessages.push({
            role: "assistant",
            content: `[${currentAgent.agentRole.name} Round ${round}]: ${result.content}`,
          });
        } catch {
          // Keep previous response
        }
      }
    }

    for (const r of validResponses) {
      debateResults.push(r);
    }

    const finalContent = await this.synthesizeVotingResults(validResponses, options);

    return this.buildOrchestrationResult("debate", debateResults, finalContent);
  }

  private async executeFallback(
    options: OrchestrationOptions
  ): Promise<OrchestrationResult> {
    const { messages, taskType, complexity, userId, temperature } = options;

    const classification = aiRouter.classifyTask(options.messages.find((m) => m.role === "user")?.content || "");

    const result = await aiRouter.executeWithFallback(messages, {
      complexity: classification.complexity,
      temperature,
      userId,
      organizationId: options.organizationId,
      requestId: options.requestId,
      sessionId: options.sessionId,
      agent: "auto-router",
      mode: "fallback",
    });

    const agent: AgentRole = {
      id: "auto-router",
      name: "Auto Router",
      description: "Automatic routing with fallback",
      systemPromptAddition: "",
      expertise: [taskType],
    };

    const agentResult: AgentResult = {
      agentRole: agent,
      result,
    };

    return this.buildOrchestrationResult("fallback", [agentResult], result.content);
  }

  private prepareAgentTasks(
    agents: AgentRole[],
    baseMessages: { role: string; content: string }[],
    taskType: string,
    complexity: "low" | "medium" | "high",
    userId: string
  ): AgentTask[] {
    return agents.map((agent) => {
      const agentMessages = this.buildAgentMessages(agent, baseMessages);

      const allocation = this.selectAllocationForAgent(
        agent,
        taskType,
        complexity,
        agentMessages.map((m) => m.content).join("\n"),
        userId
      );

      return {
        agentRole: agent,
        messages: agentMessages,
        allocation: allocation || {
          provider: "gemini",
          model: "gemini-3.5-flash",
          estimatedInputTokens: 4096,
          maxOutputTokens: 4096,
          estimatedCost: 0.001,
          isWithinBudget: true,
        },
      };
    });
  }

  private buildAgentMessages(
    agent: AgentRole,
    baseMessages: { role: string; content: string }[]
  ): { role: string; content: string }[] {
    const systemMessage = baseMessages.find((m) => m.role === "system");

    const agentSystemPrompt = systemMessage
      ? `${systemMessage.content}\n\n## Agent Role: ${agent.name}\n${agent.systemPromptAddition}`
      : `You are acting as: ${agent.name} - ${agent.description}\n\n${agent.systemPromptAddition}`;

    return [
      { role: "system", content: agentSystemPrompt },
      ...baseMessages.filter((m) => m.role !== "system"),
    ];
  }

  private selectAllocationForAgent(
    agent: AgentRole,
    taskType: string,
    complexity: "low" | "medium" | "high",
    inputText: string,
    userId: string
  ): TokenAllocation | null {
    if (agent.preferredProvider && agent.preferredModel) {
      const provider = aiGateway.getProvider(agent.preferredProvider);
      if (provider && !providerHealthMonitor.isCircuitOpen(agent.preferredProvider)) {
        const model = provider.models.find((m) => m.name === agent.preferredModel);
        if (model && model.capabilities.some((c) => taskType.includes(c) || c.includes(taskType) || c === "explain")) {
          const { inputTokens, outputTokens } = tokenRouter.estimateTaskTokens(taskType, complexity, inputText);
          const cost = tokenRouter.estimateCost(agent.preferredProvider, agent.preferredModel, inputTokens, outputTokens);
          return {
            provider: agent.preferredProvider,
            model: agent.preferredModel,
            estimatedInputTokens: inputTokens,
            maxOutputTokens: outputTokens,
            estimatedCost: cost,
            isWithinBudget: true,
          };
        }
      }
    }

    return tokenRouter.selectModel(taskType, complexity, inputText);
  }

  private synthesizeParallelResults(
    results: AgentResult[],
    options: OrchestrationOptions
  ): string {
    if (results.length === 0) {
      return "No agent was able to process the request. Please try again.";
    }

    if (results.length === 1) {
      return `## ${results[0].agentRole.name}'s Response\n\n${results[0].result.content}`;
    }

    let synthesis = `## Multi-Agent Analysis (${results.length} agents)\n\n`;

    for (const agentResult of results) {
      synthesis += `### ${agentResult.agentRole.name}\n${agentResult.result.content}\n\n---\n\n`;
    }

    synthesis += `## Summary\n`;
    synthesis += `This analysis was performed by ${results.length} AI agents in parallel, each bringing a different perspective. `;
    synthesis += `Review the individual analyses above for a comprehensive understanding.\n`;

    return synthesis;
  }

  private async synthesizeVotingResults(
    results: AgentResult[],
    options: OrchestrationOptions
  ): Promise<string> {
    if (results.length === 0) {
      return "No agent was able to process the request. Please try again.";
    }

    if (results.length === 1) {
      return `## ${results[0].agentRole.name}'s Response\n\n${results[0].result.content}`;
    }

    const individualResponses = results
      .map((r, i) => `[Agent ${i + 1}: ${r.agentRole.name}]\n${r.result.content}`)
      .join("\n\n---\n\n");

    const synthesisPrompt = `You are a Synthesis Agent. Below are responses from ${results.length} different AI agents, each with a different perspective on the same question. Your task is to:

1. Identify common points of agreement across all responses
2. Note any divergent or conflicting points
3. Synthesize a comprehensive final answer that incorporates the best insights from all agents
4. Clearly indicate the level of agreement (high/medium/low)

## Individual Agent Responses

${individualResponses}

## Synthesis Instructions

Provide your synthesis in this format:

### Agreement Level
[high/medium/low] - [brief explanation]

### Common Points
- [point 1]
- [point 2]
...

### Divergent Points
- [point 1]
- [point 2]
...

### Synthesized Answer
[Your comprehensive synthesis incorporating the best from all agents]`;

    try {
      const synthesisAgent: AgentRole = {
        id: "synthesis",
        name: "Synthesis Agent",
        description: "Combines agent responses",
        systemPromptAddition: "",
        expertise: [],
      };
      const synthesisResult = await this.callAgentProvider(
        options,
        synthesisAgent,
        "gemini",
        "gemini-3.5-flash",
        [
          { role: "system", content: "You are a synthesis agent that combines multiple AI perspectives into a coherent answer." },
          { role: "user", content: synthesisPrompt },
        ],
        { maxTokens: 4096, temperature: 0.3 }
      );

      return `## Multi-Agent Consensus (${results.length} agents)\n\n${synthesisResult.content}\n\n<details>\n<summary>View Individual Agent Responses</summary>\n\n${individualResponses}\n</details>`;
    } catch {
      const parts: string[] = [`## Multi-Agent Consensus (${results.length} agents)\n`];

      parts.push("### Common Points");
      parts.push("- All agents addressed the core question");
      parts.push("- Responses were generated independently for diverse perspectives");
      parts.push("");

      parts.push("### Individual Responses\n");
      for (const agentResult of results) {
        parts.push(`#### ${agentResult.agentRole.name}`);
        parts.push(agentResult.result.content);
        parts.push("");
      }

      return parts.join("\n");
    }
  }

  private buildOrchestrationResult(
    mode: OrchestrationMode,
    agentResults: AgentResult[],
    finalContent: string
  ): OrchestrationResult {
    const successfulResults = agentResults.filter(
      (r) => r.result.content && !r.result.content.startsWith("[")
    );

    const totalCost = agentResults.reduce((sum, r) => sum + r.result.cost, 0);
    const totalTokens = agentResults.reduce(
      (sum, r) => sum + r.result.inputTokens + r.result.outputTokens,
      0
    );
    const totalLatency = agentResults.reduce((sum, r) => sum + r.result.latency, 0);

    const providers = [...new Set(agentResults.map((r) => r.result.provider))];
    const models = [...new Set(agentResults.map((r) => r.result.model))];

    const consensus = this.analyzeConsensus(successfulResults);

    return {
      mode,
      agents: agentResults,
      finalContent,
      consensus,
      meta: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalTokens,
        totalLatency: Math.round(totalLatency),
        providers,
        models,
      },
    };
  }

  private analyzeConsensus(results: AgentResult[]): OrchestrationResult["consensus"] {
    if (results.length < 2) return null;

    const contentLengths = results.map((r) => r.result.content.length);
    const avgLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;
    const maxDeviation = Math.max(...contentLengths.map((l) => Math.abs(l - avgLength))) / avgLength;

    let agreementLevel: "high" | "medium" | "low";
    if (maxDeviation < 0.3) {
      agreementLevel = "high";
    } else if (maxDeviation < 0.6) {
      agreementLevel = "medium";
    } else {
      agreementLevel = "low";
    }

    return {
      agreementLevel,
      commonPoints: ["All agents responded to the query", "Responses were generated independently"],
      divergentPoints:
        agreementLevel !== "high"
          ? ["Agents provided different levels of detail", "Different perspectives were emphasized"]
          : [],
    };
  }

  async executeWithContext(
    options: {
      mode: OrchestrationMode;
      agentIds?: string[];
      agentCount?: number;
      messages: { role: string; content: string }[];
      taskType?: string;
      userId: string;
      temperature?: number;
      tutorMode?: TutorMode;
      contextOptions?: Partial<ContextBuildOptions>;
      requestId?: string;
      organizationId?: string;
    }
  ): Promise<OrchestrationResult> {
    const {
      mode,
      agentIds,
      agentCount = 3,
      messages,
      taskType,
      userId,
      temperature,
      tutorMode,
      contextOptions,
    } = options;

    const userMessage = messages.find((m) => m.role === "user")?.content || "";
    const classification = aiRouter.classifyTask(userMessage);

    const resolvedTaskType = taskType || classification.taskType;
    const complexity = classification.complexity;

    let selectedAgents: AgentRole[];
    if (agentIds && agentIds.length > 0) {
      selectedAgents = agentIds
        .map((id) => this.agents.get(id))
        .filter((a): a is AgentRole => a !== undefined);
    } else {
      selectedAgents = this.selectAgentsForTask(resolvedTaskType, agentCount);
    }

    if (selectedAgents.length === 0) {
      selectedAgents = [DEFAULT_AGENTS[0]];
    }

    let context: AIContext | null = null;
    if (contextOptions && contextOptions.userId) {
      try {
        context = await buildContext({
          userId: contextOptions.userId,
          question: userMessage,
          ...contextOptions,
        });
      } catch {
        // Context is optional
      }
    }

    let finalMessages = messages;
    if (tutorMode && context) {
      finalMessages = composePromptCompact(tutorMode, context);
    }

    return this.execute({
      mode,
      agents: selectedAgents,
      messages: finalMessages,
      taskType: resolvedTaskType,
      complexity,
      userId,
      temperature,
      requestId: options.requestId,
      organizationId: options.organizationId,
      sessionId: options.contextOptions?.sessionId,
    });
  }

  getAvailableAgentsForTask(taskType: string): AgentRole[] {
    return Array.from(this.agents.values()).filter((agent) =>
      agent.expertise.some(
        (e) =>
          taskType.toLowerCase().includes(e.toLowerCase()) ||
          e.toLowerCase().includes(taskType.toLowerCase())
      )
    );
  }

  getAgentStatus(agentId: string): {
    agent: AgentRole | undefined;
    providerStatus: ReturnType<typeof aiGateway.getProviderStatus> | null;
    isAvailable: boolean;
  } {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { agent: undefined, providerStatus: null, isAvailable: false };
    }

    const providerStatus = agent.preferredProvider
      ? aiGateway.getProviderStatus(agent.preferredProvider)
      : null;

    const isAvailable = providerStatus ? !providerStatus.circuitOpen : true;

    return { agent, providerStatus, isAvailable };
  }
}

export const agentOrchestrator = new AgentOrchestrator();