import { describe, expect, it } from "vitest";
import { ZYLOO_MODELS, zylooService, createZylooAdapter, ZYLOO_PROVIDER_CONFIG } from "./providers/zyloo";
import { generateAIImage, buildEnhancedVisualPrompt, getAvailableImageModels } from "./images";
import { createProviderAdapter } from "./providers";

describe("Zyloo.ai Provider & Model Catalog", () => {
  it("includes models across all 11 supported providers", () => {
    const providers = [
      "Google",
      "OpenAI",
      "Anthropic",
      "DeepSeek",
      "Qwen",
      "Moonshot",
      "智谱 Zhipu",
      "xAI",
      "MiniMax",
      "Meta",
      "Xiaomi",
    ] as const;

    for (const p of providers) {
      const models = zylooService.getModelsByProvider(p);
      expect(models.length).toBeGreaterThan(0);
    }
  });

  it("registers total catalog of 95+ models", () => {
    expect(ZYLOO_MODELS.length).toBeGreaterThanOrEqual(95);
  });

  it("verifies provider counts match the official specifications", () => {
    expect(zylooService.getModelsByProvider("Google").length).toBe(33);
    expect(zylooService.getModelsByProvider("OpenAI").length).toBe(16);
    expect(zylooService.getModelsByProvider("Anthropic").length).toBe(10);
    expect(zylooService.getModelsByProvider("DeepSeek").length).toBe(7);
    expect(zylooService.getModelsByProvider("Qwen").length).toBe(7);
    expect(zylooService.getModelsByProvider("Moonshot").length).toBe(5);
    expect(zylooService.getModelsByProvider("智谱 Zhipu").length).toBe(5);
    expect(zylooService.getModelsByProvider("xAI").length).toBe(4);
    expect(zylooService.getModelsByProvider("MiniMax").length).toBe(3);
    expect(zylooService.getModelsByProvider("Meta").length).toBe(3);
    expect(zylooService.getModelsByProvider("Xiaomi").length).toBe(2);
  });

  it("correctly identifies image-capable models", () => {
    const imageModels = zylooService.getImageModels();
    expect(imageModels.length).toBeGreaterThan(0);
    expect(imageModels.some((m) => m.name === "zyloo/gpt-image-2")).toBe(true);
    expect(imageModels.some((m) => m.name === "zyloo/gemini-3-pro-image-preview-4k")).toBe(true);
    expect(imageModels.some((m) => m.name === "zyloo/grok-imagine-image-2.0")).toBe(true);
  });

  it("creates an OpenAI-compatible wire adapter for Zyloo", () => {
    const generate = () => Promise.resolve({ content: "test", model: "zyloo/gemini-3.5-flash", provider: "zyloo", inputTokens: 5, outputTokens: 5, cost: 0.001 });
    const stream = async function* () { yield { content: "test", done: true }; };
    const healthCheck = () => Promise.resolve(true);

    const adapter = createZylooAdapter(ZYLOO_PROVIDER_CONFIG, {
      generate,
      stream,
      healthCheck,
    });

    expect(adapter.name).toBe("zyloo");
    expect(adapter.protocol).toBe("openai-compatible");
  });
});

describe("AI Image Generation Service", () => {
  it("builds enhanced visual prompt tailored to technical architecture", () => {
    const enhanced = buildEnhancedVisualPrompt({
      prompt: "Microservices with Kafka and PostgreSQL",
      visualType: "architecture",
    });

    expect(enhanced).toContain("Microservices with Kafka and PostgreSQL");
    expect(enhanced).toContain("software architecture diagram");
  });

  it("generates fallback SVG visual representation when offline or without API key", async () => {
    const result = await generateAIImage({
      prompt: "Neural network forward pass visualization",
      visualType: "concept-illustration",
    });

    expect(result).toBeDefined();
    expect(result.visualType).toBe("concept-illustration");
    expect(result.provider).toBe("zyloo");
    expect(result.svgFallback).toBeDefined();
    expect(result.svgFallback).toContain("<svg");
    expect(result.svgFallback).toContain("SkillForge AI Visual Studio");
  });

  it("lists all available image models", () => {
    const models = getAvailableImageModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.isImageModel)).toBe(true);
  });
});
