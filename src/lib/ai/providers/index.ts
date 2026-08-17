import type {
  AIProviderConfig,
  GatewayCallOptions,
  ProviderCallResult,
  ProviderHealthStatus,
  StreamChunk,
} from "../gateway";

export interface ProviderAdapterDependencies {
  generate: (
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: GatewayCallOptions
  ) => Promise<Omit<ProviderCallResult, "latency" | "cached" | "deduplicated">>;
  stream: (
    provider: AIProviderConfig,
    model: string,
    messages: { role: string; content: string }[],
    options?: GatewayCallOptions
  ) => AsyncGenerator<StreamChunk>;
  healthCheck: (provider: AIProviderConfig) => Promise<boolean | ProviderHealthStatus>;
}

export interface AIProviderAdapter {
  name: string;
  protocol: "openai-compatible" | "gemini" | "token-router";
  generate: ProviderAdapterDependencies["generate"];
  stream: ProviderAdapterDependencies["stream"];
  healthCheck: ProviderAdapterDependencies["healthCheck"];
}

export function createProviderAdapter(
  provider: AIProviderConfig,
  dependencies: ProviderAdapterDependencies
): AIProviderAdapter {
  const protocol = provider.name === "gemini"
    ? "gemini"
    : provider.name === "tokenrouter"
      ? "token-router"
      : "openai-compatible";

  return {
    name: provider.name,
    protocol,
    generate: dependencies.generate,
    stream: dependencies.stream,
    healthCheck: dependencies.healthCheck,
  };
}
