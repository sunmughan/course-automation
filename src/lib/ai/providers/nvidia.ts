import type { AIProviderConfig } from "../gateway";
import { createProviderAdapter, type ProviderAdapterDependencies } from "./index";

export function createNvidiaAdapter(
  provider: AIProviderConfig,
  dependencies: ProviderAdapterDependencies
) {
  return createProviderAdapter(provider, dependencies);
}
