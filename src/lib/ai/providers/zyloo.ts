import type { AIModelInfo, AIProviderConfig, GatewayCallOptions, ProviderCallResult, StreamChunk } from "../gateway";
import { createProviderAdapter, type ProviderAdapterDependencies } from "./index";

export interface ZylooModelMetadata extends AIModelInfo {
  providerGroup:
    | "Google"
    | "OpenAI"
    | "Anthropic"
    | "DeepSeek"
    | "Qwen"
    | "Moonshot"
    | "智谱 Zhipu"
    | "xAI"
    | "MiniMax"
    | "Meta"
    | "Xiaomi";
  isImageModel?: boolean;
  isThinkingModel?: boolean;
  contextWindow: number;
}

export interface ZylooImageGenerationRequest {
  model?: string;
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" | string;
  response_format?: "url" | "b64_json";
  quality?: "standard" | "hd" | "4k" | "2k";
}

export interface ZylooImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model: string;
  provider: string;
}

export interface ZylooImageEditRequest {
  model?: string;
  image: Blob | Buffer | string;
  prompt: string;
  mask?: Blob | Buffer | string;
  n?: number;
  size?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive 95+ Model Catalog Across 11 Providers
// ─────────────────────────────────────────────────────────────────────────────
export const ZYLOO_MODELS: ZylooModelMetadata[] = [
  // ── 1. Anthropic (10 models) ───────────────────────────────────────────────
  {
    name: "zyloo/claude-fable-5",
    providerGroup: "Anthropic",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.010,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review", "socratic", "practice", "interview", "reasoning"],
  },
  {
    name: "zyloo/claude-opus-5",
    providerGroup: "Anthropic",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.009,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review", "socratic", "reasoning"],
  },
  {
    name: "zyloo/claude-sonnet-5",
    providerGroup: "Anthropic",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.003,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
  },
  {
    name: "zyloo/claude-opus-4-8",
    providerGroup: "Anthropic",
    maxTokens: 500000,
    contextWindow: 500000,
    costPer1K: 0.007,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "reasoning"],
  },
  {
    name: "zyloo/claude-opus-4-7",
    providerGroup: "Anthropic",
    maxTokens: 500000,
    contextWindow: 500000,
    costPer1K: 0.006,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "review", "reasoning"],
  },
  {
    name: "zyloo/claude-opus-4-6",
    providerGroup: "Anthropic",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.005,
    capabilities: ["explain", "code_generation", "debugging", "architecture"],
  },
  {
    name: "zyloo/claude-opus-4",
    providerGroup: "Anthropic",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.004,
    capabilities: ["explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/claude-sonnet-4-6",
    providerGroup: "Anthropic",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0028,
    capabilities: ["explain", "code_generation", "debugging", "simple_qa", "hint", "simplify"],
  },
  {
    name: "zyloo/claude-sonnet-4-5",
    providerGroup: "Anthropic",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0025,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa", "review"],
  },
  {
    name: "zyloo/claude-haiku-4-5",
    providerGroup: "Anthropic",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0008,
    capabilities: ["simple_qa", "explain", "hint", "simplify", "code_generation"],
  },

  // ── 2. OpenAI (16 models) ──────────────────────────────────────────────────
  {
    name: "zyloo/gpt-5.6-sol",
    providerGroup: "OpenAI",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0045,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "reasoning", "deep-dive"],
  },
  {
    name: "zyloo/gpt-5.6-terra",
    providerGroup: "OpenAI",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0035,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa"],
  },
  {
    name: "zyloo/gpt-5.6-luna",
    providerGroup: "OpenAI",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0012,
    capabilities: ["simple_qa", "explain", "hint", "simplify"],
  },
  {
    name: "zyloo/gpt-5.5",
    providerGroup: "OpenAI",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.003,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview", "reasoning"],
  },
  {
    name: "zyloo/gpt-5.4",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.0025,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa"],
  },
  {
    name: "zyloo/gpt-5.3",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.0022,
    capabilities: ["explain", "code_generation", "debugging", "simple_qa"],
  },
  {
    name: "zyloo/gpt-5.2",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.0018,
    capabilities: ["explain", "code_generation", "debugging", "simple_qa"],
  },
  {
    name: "zyloo/gpt-5.1",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.0015,
    capabilities: ["explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/gpt-4.1",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.001,
    capabilities: ["simple_qa", "explain", "code_generation"],
  },
  {
    name: "zyloo/gpt-4o",
    providerGroup: "OpenAI",
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1K: 0.0025,
    capabilities: ["explain", "code_generation", "debugging", "visualization", "simple_qa"],
  },
  // OpenAI Image Models
  {
    name: "zyloo/gpt-image-2",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.04,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },
  {
    name: "zyloo/gpt-image-2-vip",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.06,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },
  {
    name: "zyloo/gpt-image-1.5",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.03,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },
  {
    name: "zyloo/gpt-image-1-vip",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.04,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },
  {
    name: "zyloo/gpt-4o-image",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.035,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },
  {
    name: "zyloo/gpt-4o-image-vip",
    providerGroup: "OpenAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.05,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },

  // ── 3. Google (33 models) ──────────────────────────────────────────────────
  {
    name: "zyloo/gemini-3.6-flash",
    providerGroup: "Google",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.00015,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "deep-dive", "compare", "review", "socratic", "practice", "interview"],
  },
  {
    name: "zyloo/gemini-3.5-flash",
    providerGroup: "Google",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.00012,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization", "simple_qa", "hint", "simplify"],
  },
  {
    name: "zyloo/gemini-3.1-pro-preview",
    providerGroup: "Google",
    maxTokens: 2097152,
    contextWindow: 2097152,
    costPer1K: 0.00125,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "reasoning"],
  },
  {
    name: "zyloo/gemini-3-pro-preview",
    providerGroup: "Google",
    maxTokens: 2097152,
    contextWindow: 2097152,
    costPer1K: 0.00125,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive"],
  },
  {
    name: "zyloo/gemini-3.1-flash-lite-preview",
    providerGroup: "Google",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.000075,
    capabilities: ["simple_qa", "explain", "hint", "simplify"],
  },
  {
    name: "zyloo/gemini-3-flash-preview",
    providerGroup: "Google",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.00010,
    capabilities: ["simple_qa", "explain", "code_generation"],
  },
  {
    name: "zyloo/gemini-2.5-flash",
    providerGroup: "Google",
    maxTokens: 1048576,
    contextWindow: 1048576,
    costPer1K: 0.000075,
    capabilities: ["simple_qa", "explain", "hint", "simplify"],
  },
  // Google Image Models
  { name: "zyloo/gemini-3-pro-image-preview-4k-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.06, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview-4k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.05, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-4k-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.045, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3.1-flash-image-preview-4k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.04, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-4k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.035, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview-2k-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.04, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.035, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview-hd", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.03, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview-2k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.03, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-2k-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.03, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.025, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-hd", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3-pro-image-preview", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.025, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3.1-flash-image-preview-2k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.025, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2-2k", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-2", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.015, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-3.1-flash-image-preview", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-hd", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.018, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image-preview-vip", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.02, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image-preview-hd", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.015, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image-preview", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.012, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image-hd", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.015, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/nano-banana", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.01, isImageModel: true, capabilities: ["visualization", "creative"] },
  { name: "zyloo/gemini-2.5-flash-image", providerGroup: "Google", maxTokens: 4096, contextWindow: 4096, costPer1K: 0.01, isImageModel: true, capabilities: ["visualization", "creative"] },

  // ── 4. DeepSeek (7 models) ─────────────────────────────────────────────────
  {
    name: "zyloo/deepseek-v4-pro-0813",
    providerGroup: "DeepSeek",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0005,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "reasoning", "deep-dive"],
  },
  {
    name: "zyloo/deepseek-v4-flash-0731",
    providerGroup: "DeepSeek",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0002,
    capabilities: ["simple_qa", "explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/deepseek-v4-pro",
    providerGroup: "DeepSeek",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.00045,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "reasoning"],
  },
  {
    name: "zyloo/deepseek-v4-flash",
    providerGroup: "DeepSeek",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.00018,
    capabilities: ["simple_qa", "explain", "code_generation"],
  },
  {
    name: "zyloo/deepseek-v3.2",
    providerGroup: "DeepSeek",
    maxTokens: 65536,
    contextWindow: 65536,
    costPer1K: 0.00025,
    capabilities: ["explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/deepseek-v3.1",
    providerGroup: "DeepSeek",
    maxTokens: 65536,
    contextWindow: 65536,
    costPer1K: 0.0002,
    capabilities: ["simple_qa", "explain"],
  },
  {
    name: "zyloo/deepseek-r1",
    providerGroup: "DeepSeek",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0035,
    isThinkingModel: true,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "compare", "review", "reasoning"],
  },

  // ── 5. Qwen (7 models) ─────────────────────────────────────────────────────
  {
    name: "zyloo/qwen3.8-2.4t-a95b",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0012,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "visualization"],
  },
  {
    name: "zyloo/qwen3.8-max",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0010,
    capabilities: ["explain", "code_generation", "debugging", "architecture"],
  },
  {
    name: "zyloo/qwen3.7-max",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0009,
    capabilities: ["explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/qwen3.7-flash",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0002,
    capabilities: ["simple_qa", "explain", "hint"],
  },
  {
    name: "zyloo/qwen3.6-plus",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0005,
    capabilities: ["explain", "code_generation"],
  },
  {
    name: "zyloo/qwen3.6-max-preview",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0008,
    capabilities: ["explain", "code_generation", "debugging"],
  },
  {
    name: "zyloo/qwen3.5-flash",
    providerGroup: "Qwen",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.00015,
    capabilities: ["simple_qa", "explain", "hint", "simplify"],
  },

  // ── 6. Moonshot (5 models) ─────────────────────────────────────────────────
  {
    name: "zyloo/kimi-k3",
    providerGroup: "Moonshot",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0018,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive"],
  },
  {
    name: "zyloo/kimi-k2.7-code",
    providerGroup: "Moonshot",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0015,
    capabilities: ["code_generation", "debugging", "architecture", "review"],
  },
  {
    name: "zyloo/kimi-k2.6",
    providerGroup: "Moonshot",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0012,
    capabilities: ["explain", "code_generation", "simple_qa"],
  },
  {
    name: "zyloo/kimi-k2.5",
    providerGroup: "Moonshot",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0010,
    capabilities: ["simple_qa", "explain"],
  },
  {
    name: "zyloo/kimi-k2-thinking",
    providerGroup: "Moonshot",
    maxTokens: 200000,
    contextWindow: 200000,
    costPer1K: 0.0022,
    isThinkingModel: true,
    capabilities: ["explain", "code_generation", "debugging", "reasoning", "deep-dive"],
  },

  // ── 7. 智谱 Zhipu GLM (5 models) ──────────────────────────────────────────
  {
    name: "zyloo/glm-5.3",
    providerGroup: "智谱 Zhipu",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0015,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa"],
  },
  {
    name: "zyloo/glm-5.2",
    providerGroup: "智谱 Zhipu",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0012,
    capabilities: ["explain", "code_generation", "debugging", "simple_qa"],
  },
  {
    name: "zyloo/glm-5.1",
    providerGroup: "智谱 Zhipu",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0009,
    capabilities: ["explain", "code_generation", "simple_qa"],
  },
  {
    name: "zyloo/glm-5",
    providerGroup: "智谱 Zhipu",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0007,
    capabilities: ["simple_qa", "explain"],
  },
  {
    name: "zyloo/glm-4.7",
    providerGroup: "智谱 Zhipu",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0005,
    capabilities: ["simple_qa", "explain", "hint"],
  },

  // ── 8. xAI (4 models) ──────────────────────────────────────────────────────
  {
    name: "zyloo/grok-4.5",
    providerGroup: "xAI",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0025,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "reasoning"],
  },
  {
    name: "zyloo/grok-4.3",
    providerGroup: "xAI",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0018,
    capabilities: ["explain", "code_generation", "debugging", "simple_qa"],
  },
  {
    name: "zyloo/grok-build-0.1",
    providerGroup: "xAI",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0015,
    capabilities: ["code_generation", "debugging", "architecture", "review"],
  },
  {
    name: "zyloo/grok-imagine-image-2.0",
    providerGroup: "xAI",
    maxTokens: 4096,
    contextWindow: 4096,
    costPer1K: 0.04,
    isImageModel: true,
    capabilities: ["visualization", "creative"],
  },

  // ── 9. MiniMax (3 models) ──────────────────────────────────────────────────
  {
    name: "zyloo/minimax-m3",
    providerGroup: "MiniMax",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0012,
    capabilities: ["explain", "code_generation", "debugging", "architecture"],
  },
  {
    name: "zyloo/MiniMax-M2.7",
    providerGroup: "MiniMax",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0009,
    capabilities: ["explain", "code_generation", "simple_qa"],
  },
  {
    name: "zyloo/MiniMax-M2.5",
    providerGroup: "MiniMax",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0006,
    capabilities: ["simple_qa", "explain", "hint"],
  },

  // ── 10. Meta (3 models) ────────────────────────────────────────────────────
  {
    name: "zyloo/llama-3.3-70b-instruct",
    providerGroup: "Meta",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.00059,
    capabilities: ["explain", "code_generation", "debugging", "architecture", "simple_qa"],
  },
  {
    name: "zyloo/llama-3.2-1b-instruct",
    providerGroup: "Meta",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.00008,
    capabilities: ["simple_qa", "explain", "hint", "simplify"],
  },
  {
    name: "zyloo/llama-3.2-90b-vision-instruct",
    providerGroup: "Meta",
    maxTokens: 131072,
    contextWindow: 131072,
    costPer1K: 0.0012,
    capabilities: ["explain", "code_generation", "debugging", "visualization", "simple_qa"],
  },

  // ── 11. Xiaomi (2 models) ──────────────────────────────────────────────────
  {
    name: "zyloo/mimo-v2.5-pro",
    providerGroup: "Xiaomi",
    maxTokens: 65536,
    contextWindow: 65536,
    costPer1K: 0.0008,
    capabilities: ["explain", "code_generation", "debugging", "architecture"],
  },
  {
    name: "zyloo/mimo-v2.5",
    providerGroup: "Xiaomi",
    maxTokens: 65536,
    contextWindow: 65536,
    costPer1K: 0.0004,
    capabilities: ["simple_qa", "explain", "hint"],
  },
];

export const ZYLOO_PROVIDER_CONFIG: AIProviderConfig = {
  name: "zyloo",
  baseUrl: "https://api.zyloo.io/v1",
  apiKey: process.env.ZYLOO_KEY || process.env.ZYLOO_API_KEY || "",
  priority: 1, // High priority given competitive unified pricing and 95+ model access
  models: ZYLOO_MODELS.map((m) => ({
    name: m.name,
    maxTokens: m.maxTokens,
    costPer1K: m.costPer1K,
    capabilities: m.capabilities,
  })),
};

export class ZylooService {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.ZYLOO_KEY || process.env.ZYLOO_API_KEY || "";
    this.baseUrl = baseUrl || "https://api.zyloo.io/v1";
  }

  /**
   * Performs standard or streaming chat completions.
   */
  async chatCompletion(params: {
    model?: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    signal?: AbortSignal;
  }) {
    const {
      model = "zyloo/gemini-3.5-flash",
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      stream = false,
      signal,
    } = params;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
      }),
      signal: signal || AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Zyloo Chat API error ${res.status}: ${errText.substring(0, 500)}`);
    }

    if (stream) {
      return res.body;
    }

    return res.json();
  }

  /**
   * Generates images from text prompts using Zyloo Image Generation API (/v1/images/generations).
   */
  async generateImage(params: ZylooImageGenerationRequest): Promise<ZylooImageGenerationResponse> {
    const {
      model = "zyloo/gpt-image-2",
      prompt,
      n = 1,
      size = "1024x1024",
      response_format = "url",
    } = params;

    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        n,
        size,
        response_format,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`Zyloo Image API error ${res.status}: ${errText.substring(0, 500)}`);
    }

    const json = await res.json();
    return {
      created: json.created || Date.now(),
      data: json.data || [],
      model,
      provider: "zyloo",
    };
  }

  /**
   * Lists all available models categorized by provider.
   */
  getModels() {
    return ZYLOO_MODELS;
  }

  /**
   * Filters models by provider name (e.g. "Google", "OpenAI", "Anthropic", "DeepSeek", "Qwen", "xAI").
   */
  getModelsByProvider(providerGroup: ZylooModelMetadata["providerGroup"]) {
    return ZYLOO_MODELS.filter((m) => m.providerGroup === providerGroup);
  }

  /**
   * Retrieves all image-capable models.
   */
  getImageModels() {
    return ZYLOO_MODELS.filter((m) => m.isImageModel);
  }
}

export const zylooService = new ZylooService();

export function createZylooAdapter(
  provider: AIProviderConfig,
  dependencies: ProviderAdapterDependencies
) {
  return createProviderAdapter(provider, dependencies);
}
