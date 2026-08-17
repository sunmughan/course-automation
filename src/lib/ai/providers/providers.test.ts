import { describe, expect, it, vi } from "vitest";
import type { AIProviderConfig } from "../gateway";
import { createProviderAdapter } from "./index";

const provider = (name: string): AIProviderConfig => ({
  name,
  baseUrl: "https://example.com/v1",
  apiKey: "test-key",
  models: [],
});

describe("provider adapter boundary", () => {
  it.each([
    ["nvidia", "openai-compatible"],
    ["gemini", "gemini"],
    ["agentrouter", "openai-compatible"],
    ["tokenrouter", "token-router"],
    ["zyloo", "openai-compatible"],
  ])("creates an adapter for %s", (name, protocol) => {
    const generate = vi.fn();
    const stream = vi.fn();
    const healthCheck = vi.fn();

    const adapter = createProviderAdapter(provider(name), {
      generate,
      stream,
      healthCheck,
    });

    expect(adapter.name).toBe(name);
    expect(adapter.protocol).toBe(protocol);
    expect(adapter.generate).toBe(generate);
    expect(adapter.stream).toBe(stream);
    expect(adapter.healthCheck).toBe(healthCheck);
  });
});
