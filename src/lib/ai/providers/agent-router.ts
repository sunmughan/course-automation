import type { AIProviderConfig } from "../gateway";
import { createProviderAdapter, type ProviderAdapterDependencies } from "./index";

export function createAgentRouterAdapter(
  provider: AIProviderConfig,
  dependencies: ProviderAdapterDependencies
) {
  return createProviderAdapter(provider, dependencies);
}
