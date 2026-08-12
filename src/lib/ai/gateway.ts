import { prisma } from "@/lib/db";

export interface AIModelInfo {
  name: string;
  maxTokens: number;
  costPer1K: number;
  capabilities: string[];
}

export interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: AIModelInfo[];
  priority?: number;
}

export interface ProviderHealthStatus {
  isHealthy: boolean;
  successRate: number;
  avgLatency: number;
  errorRate: number;
  lastChecked: Date;
}

export interface ProviderCallResult {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latency: number;
  cost: number;
  routedTo?: string | null;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  inputTokens?: number;
  outputTokens?: number;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
  halfOpenAt: number | null;
  consecutiveSuccesses: number;
}

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 30_000;
const CIRCUIT_HALF_OPEN_MAX = 3;
const HEALTH_CHECK_INTERVAL_MS = 60_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    name: "nvidia",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY || "",
    priority: 0,
    models: [
      {
        name: "meta/llama-3.3-70b-instruct",
        maxTokens: 131072,
        costPer1K: 0.00059,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa"],
      },
      {
        name: "deepseek-ai/deepseek-r1",
        maxTokens: 131072,
        costPer1K: 0.00350,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review"],
      },
      {
        name: "qwen/qwen3-235b-a22b",
        maxTokens: 131072,
        costPer1K: 0.00089,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization"],
      },
      {
        name: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
        maxTokens: 131072,
        costPer1K: 0.00125,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "socratic"],
      },
    ],
  },
  {
    name: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiKey: process.env.GEMINI_API_KEY || "",
    priority: 1,
    models: [
      {
        name: "gemini-2.5-pro",
        maxTokens: 1048576,
        costPer1K: 0.00125,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
      {
        name: "gemini-2.5-flash",
        maxTokens: 1048576,
        costPer1K: 0.00015,
        capabilities: ["simple_qa", "explain", "code_generation", "debugging", "hint", "simplify"],
      },
      {
        name: "gemini-2.5-flash-lite",
        maxTokens: 1048576,
        costPer1K: 0.000075,
        capabilities: ["simple_qa", "explain", "hint", "simplify"],
      },
    ],
  },
  {
    name: "agentrouter",
    baseUrl: "https://agentrouter.org/v1",
    apiKey: process.env.AGENTROUTER_API_KEY || "",
    priority: 2,
    models: [
      {
        name: "claude-sonnet-4-5-20250929",
        maxTokens: 200000,
        costPer1K: 0.003,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
      {
        name: "claude-haiku-4-5-20251001",
        maxTokens: 200000,
        costPer1K: 0.0008,
        capabilities: ["simple_qa", "explain", "code_generation", "debugging", "hint", "simplify"],
      },
      {
        name: "gpt-5",
        maxTokens: 128000,
        costPer1K: 0.0025,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
      {
        name: "deepseek-chat",
        maxTokens: 65536,
        costPer1K: 0.00027,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa", "review"],
      },
      {
        name: "gemini-2.5-pro",
        maxTokens: 1048576,
        costPer1K: 0.00125,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
    ],
  },
  {
    name: "tokenrouter",
    baseUrl: "https://api.tokenrouter.io/v1",
    apiKey: process.env.TOKENROUTER_API_KEY || "",
    priority: 3,
    models: [
      {
        name: "auto:balance",
        maxTokens: 200000,
        costPer1K: 0.0015,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
      {
        name: "auto:cost",
        maxTokens: 200000,
        costPer1K: 0.0005,
        capabilities: ["simple_qa", "explain", "hint", "simplify", "code_generation"],
      },
      {
        name: "auto:quality",
        maxTokens: 200000,
        costPer1K: 0.003,
        capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
      },
      {
        name: "auto:latency",
        maxTokens: 200000,
        costPer1K: 0.001,
        capabilities: ["simple_qa", "explain", "hint", "simplify"],
      },
    ],
  },
];

export class AIGateway {
  private providers: Map<string, AIProviderConfig> = new Map();
  private circuits: Map<string, CircuitState> = new Map();
  private healthCache: Map<string, ProviderHealthStatus> = new Map();
  private lastHealthCheck: Map<string, number> = new Map();
  private latencyHistory: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    for (const config of DEFAULT_PROVIDERS) {
      if (config.apiKey) {
        this.registerProvider(config);
      }
    }
  }

  registerProvider(config: AIProviderConfig): void {
    this.providers.set(config.name, config);
    this.circuits.set(config.name, {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      halfOpenAt: null,
      consecutiveSuccesses: 0,
    });
    this.latencyHistory.set(config.name, []);
    this.syncProviderToDb(config).catch(() => {});
  }

  removeProvider(name: string): void {
    this.providers.delete(name);
    this.circuits.delete(name);
    this.healthCache.delete(name);
    this.lastHealthCheck.delete(name);
    this.latencyHistory.delete(name);
  }

  getProvider(name: string): AIProviderConfig | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): AIProviderConfig[] {
    return Array.from(this.providers.values()).sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );
  }

  getActiveProviders(): AIProviderConfig[] {
    return this.getAllProviders().filter((p) => !this.isCircuitOpen(p.name));
  }

  getProviderModels(name: string): AIModelInfo[] {
    const provider = this.providers.get(name);
    return provider?.models || [];
  }

  getCheapestModel(providerName: string, capabilities: string[]): AIModelInfo | null {
    const provider = this.providers.get(providerName);
    if (!provider) return null;
    return provider.models
      .filter((m) => capabilities.every((c) => m.capabilities.includes(c)))
      .sort((a, b) => a.costPer1K - b.costPer1K)[0] || null;
  }

  getEstimatedCost(providerName: string, modelName: string, estimatedTokens: number): number {
    const provider = this.providers.get(providerName);
    if (!provider) return 0;
    const model = provider.models.find((m) => m.name === modelName);
    if (!model) return 0;
    return (estimatedTokens / 1000) * model.costPer1K;
  }

  async healthCheck(name: string): Promise<ProviderHealthStatus> {
    const now = Date.now();
    const lastCheck = this.lastHealthCheck.get(name) || 0;

    if (now - lastCheck < HEALTH_CHECK_INTERVAL_MS && this.healthCache.has(name)) {
      return this.healthCache.get(name)!;
    }

    const provider = this.providers.get(name);
    if (!provider) {
      return { isHealthy: false, successRate: 0, avgLatency: 0, errorRate: 100, lastChecked: new Date() };
    }

    const startTime = performance.now();
    try {
      const isHealthy = await this.pingProvider(provider);
      const latency = performance.now() - startTime;

      this.recordLatency(name, latency);

      const avgLatency = this.getAverageLatency(name);
      const status: ProviderHealthStatus = {
        isHealthy,
        successRate: isHealthy ? this.calculateSmoothedSuccessRate(name, true) : 0,
        avgLatency,
        errorRate: isHealthy ? 0 : this.calculateSmoothedSuccessRate(name, false),
        lastChecked: new Date(),
      };

      this.healthCache.set(name, status);
      this.lastHealthCheck.set(name, now);
      await this.saveHealthToDb(name, status);

      return status;
    } catch {
      const latency = performance.now() - startTime;
      const status: ProviderHealthStatus = {
        isHealthy: false,
        successRate: this.calculateSmoothedSuccessRate(name, false),
        avgLatency: this.getAverageLatency(name),
        errorRate: this.calculateSmoothedSuccessRate(name, false),
        lastChecked: new Date(),
      };

      this.healthCache.set(name, status);
      this.lastHealthCheck.set(name, now);
      this.recordFailure(name);
      await this.saveHealthToDb(name, status);

      return status;
    }
  }

  async healthCheckAll(): Promise<Map<string, ProviderHealthStatus>> {
    const results = new Map<string, ProviderHealthStatus>();
    const checks = Array.from(this.providers.keys()).map(async (name) => {
      results.set(name, await this.healthCheck(name));
    });
    await Promise.all(checks);
    return results;
  }

  private async pingProvider(provider: AIProviderConfig): Promise<boolean> {
    try {
      if (provider.name === "gemini") {
        const url = `${provider.baseUrl}/models/gemini-2.5-flash:generateContent?key=${provider.apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }], role: "user" }],
            generationConfig: { maxOutputTokens: 1 },
          }),
          signal: AbortSignal.timeout(10000),
        });
        return response.ok;
      }

      if (provider.name === "tokenrouter") {
        const url = `${provider.baseUrl}/responses`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "auto:latency",
            input: "ping",
            max_output_tokens: 1,
          }),
          signal: AbortSignal.timeout(10000),
        });
        return response.ok;
      }

      const url = `${provider.baseUrl}/models`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async callProvider(
    name: string,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number; retries?: number }
  ): Promise<ProviderCallResult> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }

    const circuit = this.circuits.get(name);
    if (circuit?.isOpen) {
      if (circuit.halfOpenAt && Date.now() - circuit.halfOpenAt > CIRCUIT_BREAKER_TIMEOUT_MS) {
        circuit.isOpen = false;
        circuit.halfOpenAt = null;
        circuit.failures = 0;
        circuit.consecutiveSuccesses = 0;
      } else {
        throw new Error(`Circuit breaker is open for provider '${name}'`);
      }
    }

    const maxRetries = options?.retries ?? MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        const startTime = performance.now();
        const result = await this.executeProviderCall(provider, model, messages, options);
        const latency = performance.now() - startTime;

        this.recordSuccess(name);
        this.recordLatency(name, latency);

        return { ...result, latency: Math.round(latency) };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.recordFailure(name);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error(`Provider '${name}' failed after ${maxRetries} retries`);
  }

  private async executeProviderCall(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<Omit<ProviderCallResult, "latency">> {
    if (provider.name === "gemini") {
      return this.callGemini(provider, model, messages, options);
    }
    if (provider.name === "tokenrouter") {
      return this.callTokenRouter(provider, model, messages, options);
    }
    return this.callOpenAICompatible(provider, model, messages, options);
  }

  async *callProviderStream(
    name: string,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): AsyncGenerator<StreamChunk> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }

    if (this.isCircuitOpen(name)) {
      throw new Error(`Circuit breaker is open for provider '${name}'`);
    }

    try {
      if (provider.name === "gemini") {
        yield* this.streamGemini(provider, model, messages, options);
      } else if (provider.name === "tokenrouter") {
        yield* this.streamTokenRouter(provider, model, messages, options);
      } else {
        yield* this.streamOpenAICompatible(provider, model, messages, options);
      }
      this.recordSuccess(name);
    } catch (error) {
      this.recordFailure(name);
      throw error;
    }
  }

  private async callOpenAICompatible(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<Omit<ProviderCallResult, "latency">> {
    const url = `${provider.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        top_p: 0.95,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Provider '${provider.name}' returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const data = await response.json();
    const modelInfo = provider.models.find((m) => m.name === model);

    return {
      content: data.choices?.[0]?.message?.content || "",
      model: data.model || model,
      provider: provider.name,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: this.calculateCost(modelInfo?.costPer1K || 0, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0),
    };
  }

  private async *streamOpenAICompatible(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): AsyncGenerator<StreamChunk> {
    const url = `${provider.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Provider '${provider.name}' returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let totalOutputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        if (data === "[DONE]") {
          yield { content: "", done: true, outputTokens: totalOutputTokens };
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            totalOutputTokens++;
            yield { content, done: false };
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    yield { content: "", done: true, outputTokens: totalOutputTokens };
  }

  private async callTokenRouter(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<Omit<ProviderCallResult, "latency">> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");
    const input = userMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

    const url = `${provider.baseUrl}/responses`;

    const body: Record<string, unknown> = {
      model,
      input,
      max_output_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
    };

    if (systemMessage) {
      body.instructions = systemMessage.content;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`TokenRouter returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const data = await response.json();
    const modelInfo = provider.models.find((m) => m.name === model);

    const content = data.output?.[0]?.content?.map((c: { type: string; text: string }) => c.text).join("") || "";
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    return {
      content,
      model: data.model || model,
      provider: provider.name,
      inputTokens,
      outputTokens,
      cost: ((inputTokens + outputTokens) / 1000) * (modelInfo?.costPer1K || 0.001),
      routedTo: data.metadata?.provider || null,
    };
  }

  private async *streamTokenRouter(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): AsyncGenerator<StreamChunk> {
    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");
    const input = userMessages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

    const url = `${provider.baseUrl}/responses`;

    const body: Record<string, unknown> = {
      model,
      input,
      stream: true,
      max_output_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature ?? 0.7,
    };

    if (systemMessage) {
      body.instructions = systemMessage.content;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`TokenRouter stream returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body for TokenRouter stream");

    const decoder = new TextDecoder();
    let totalOutputTokens = 0;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") continue;

        try {
          const data = JSON.parse(dataStr);
          if (data.event === "content.delta" && data.delta?.text) {
            totalOutputTokens++;
            yield { content: data.delta.text, done: false, outputTokens: totalOutputTokens };
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }

    yield { content: "", done: true, outputTokens: totalOutputTokens };
  }

  private async callGemini(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<Omit<ProviderCallResult, "latency">> {
    const url = `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`;

    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const contents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Provider '${provider.name}' returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const data = await response.json();
    const modelInfo = provider.models.find((m) => m.name === model);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const inputTokens = data.usageMetadata?.promptTokenCount || 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
      content,
      model: model,
      provider: provider.name,
      inputTokens,
      outputTokens,
      cost: this.calculateCost(modelInfo?.costPer1K || 0, inputTokens, outputTokens),
    };
  }

  private async *streamGemini(
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): AsyncGenerator<StreamChunk> {
    const url = `${provider.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${provider.apiKey}`;

    const systemMessage = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const contents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
      },
    };

    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`Provider '${provider.name}' returned ${response.status}: ${errorText.substring(0, 500)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let totalOutputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            totalOutputTokens++;
            yield { content: text, done: false };
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    yield { content: "", done: true, outputTokens: totalOutputTokens };
  }

  calculateCost(costPer1K: number, inputTokens: number, outputTokens: number): number {
    return ((inputTokens + outputTokens) / 1000) * costPer1K;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  recordSuccess(name: string): void {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.consecutiveSuccesses++;
      if (circuit.consecutiveSuccesses >= CIRCUIT_HALF_OPEN_MAX) {
        circuit.failures = 0;
        circuit.isOpen = false;
        circuit.halfOpenAt = null;
      }
    }
  }

  recordFailure(name: string): void {
    const circuit = this.circuits.get(name);
    if (!circuit) return;

    circuit.consecutiveSuccesses = 0;
    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuit.isOpen = true;
      circuit.halfOpenAt = Date.now();
    }
  }

  isCircuitOpen(name: string): boolean {
    const circuit = this.circuits.get(name);
    if (!circuit) return false;
    if (circuit.isOpen && circuit.halfOpenAt && Date.now() - circuit.halfOpenAt > CIRCUIT_BREAKER_TIMEOUT_MS) {
      circuit.isOpen = false;
      circuit.halfOpenAt = null;
      circuit.failures = 0;
      circuit.consecutiveSuccesses = 0;
      return false;
    }
    return circuit.isOpen;
  }

  getProviderStatus(name: string): {
    circuitOpen: boolean;
    failures: number;
    consecutiveSuccesses: number;
    health: ProviderHealthStatus | null;
    averageLatency: number;
  } {
    const circuit = this.circuits.get(name);
    return {
      circuitOpen: circuit?.isOpen || false,
      failures: circuit?.failures || 0,
      consecutiveSuccesses: circuit?.consecutiveSuccesses || 0,
      health: this.healthCache.get(name) || null,
      averageLatency: this.getAverageLatency(name),
    };
  }

  getAllProviderStatuses(): Map<string, ReturnType<AIGateway["getProviderStatus"]>> {
    const statuses = new Map<string, ReturnType<AIGateway["getProviderStatus"]>>();
    for (const name of this.providers.keys()) {
      statuses.set(name, this.getProviderStatus(name));
    }
    return statuses;
  }

  private recordLatency(name: string, latency: number): void {
    const history = this.latencyHistory.get(name) || [];
    history.push(latency);
    if (history.length > 20) history.shift();
    this.latencyHistory.set(name, history);
  }

  private getAverageLatency(name: string): number {
    const history = this.latencyHistory.get(name) || [];
    if (history.length === 0) return 0;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  private calculateSmoothedSuccessRate(name: string, success: boolean): number {
    const existing = this.healthCache.get(name);
    const previousRate = existing?.successRate ?? 100;
    const alpha = 0.3;
    return Math.round(previousRate * (1 - alpha) + (success ? 100 : 0) * alpha);
  }

  private async syncProviderToDb(config: AIProviderConfig): Promise<void> {
    try {
      await prisma.aIProvider.upsert({
        where: { name: config.name },
        update: { baseUrl: config.baseUrl, priority: config.priority || 0, isActive: true },
        create: {
          name: config.name,
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          priority: config.priority || 0,
          isActive: true,
        },
      });

      const dbProvider = await prisma.aIProvider.findUnique({ where: { name: config.name } });
      if (!dbProvider) return;

      for (const model of config.models) {
        await prisma.aIModel.upsert({
          where: { id: `${dbProvider.id}_${model.name}` },
          update: {
            capabilities: JSON.stringify(model.capabilities),
            maxTokens: model.maxTokens,
            costPer1K: model.costPer1K,
            isActive: true,
          },
          create: {
            id: `${dbProvider.id}_${model.name}`,
            name: model.name,
            providerId: dbProvider.id,
            capabilities: JSON.stringify(model.capabilities),
            maxTokens: model.maxTokens,
            costPer1K: model.costPer1K,
            isActive: true,
          },
        });
      }
    } catch {
      // DB sync is non-critical
    }
  }

  private async saveHealthToDb(name: string, status: ProviderHealthStatus): Promise<void> {
    try {
      const dbProvider = await prisma.aIProvider.findUnique({ where: { name } });
      if (!dbProvider) return;

      await prisma.providerHealth.create({
        data: {
          providerId: dbProvider.id,
          successRate: status.successRate,
          avgLatency: status.avgLatency,
          errorRate: status.errorRate,
          isHealthy: status.isHealthy,
        },
      });
    } catch {
      // Non-critical
    }
  }
}

export const aiGateway = new AIGateway();