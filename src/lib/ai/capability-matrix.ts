export type TaskCapability =
  | "explain"
  | "code_generation"
  | "debugging"
  | "architecture"
  | "visualization"
  | "simple_qa"
  | "deep-dive"
  | "compare"
  | "review"
  | "socratic"
  | "hint"
  | "simplify"
  | "practice"
  | "interview"
  | "reasoning"
  | "math"
  | "creative"
  | "coding_react"
  | "coding_node"
  | "coding_python"
  | "coding_laravel"
  | "coding_sql"
  | "coding_mobile"
  | "data_science"
  | "explain_ml"
  | "explain_nlp"
  | "explain_cv"
  | "prompt_engineering"
  | "agent_design"
  | "system_prompt";

export interface CapabilityScore {
  task: TaskCapability;
  quality: number;
  latency: number;
  cost: number;
  contextWindow: number;
  reliability: number;
}

export interface ModelCapabilityProfile {
  modelName: string;
  providerName: string;
  scores: Partial<Record<TaskCapability, CapabilityScore>>;
  defaultScore: CapabilityScore;
  maxContextTokens: number;
  maxOutputTokens: number;
  costPer1KInput: number;
  costPer1KOutput: number;
  strengths: TaskCapability[];
  weaknesses: TaskCapability[];
  supportedLanguages: string[];
  fineTuned: boolean;
  recommendedFor: string[];
}

const DEFAULT_CAPABILITY_SCORE: CapabilityScore = {
  task: "explain",
  quality: 0.7,
  latency: 0.7,
  cost: 0.7,
  contextWindow: 128000,
  reliability: 0.85,
};

function score(
  overrides: Partial<CapabilityScore> = {}
): CapabilityScore {
  return { ...DEFAULT_CAPABILITY_SCORE, ...overrides };
}

function taskScore(
  task: TaskCapability,
  quality: number,
  latency: number,
  cost: number,
  reliability = 0.9
): CapabilityScore {
  return {
    task,
    quality,
    latency,
    cost,
    contextWindow: 128000,
    reliability,
  };
}

export const MODEL_CAPABILITY_MATRIX: Record<string, ModelCapabilityProfile> = {
  "nvidia/meta/llama-3.3-70b-instruct": {
    modelName: "meta/llama-3.3-70b-instruct",
    providerName: "nvidia",
    maxContextTokens: 131072,
    maxOutputTokens: 8192,
    costPer1KInput: 0.00059,
    costPer1KOutput: 0.00059,
    strengths: ["explain", "simple_qa", "code_generation", "coding_python", "coding_node"],
    weaknesses: ["deep-dive", "reasoning", "creative", "visualization"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["quick_queries", "simple_explanations", "basic_code"],
    defaultScore: score({ quality: 0.75, latency: 0.9, cost: 0.95 }),
    scores: {
      explain: taskScore("explain", 0.78, 0.9, 0.95),
      code_generation: taskScore("code_generation", 0.72, 0.85, 0.95),
      debugging: taskScore("debugging", 0.65, 0.85, 0.95),
      architecture: taskScore("architecture", 0.6, 0.85, 0.95),
      simple_qa: taskScore("simple_qa", 0.85, 0.95, 0.95),
      hint: taskScore("hint", 0.75, 0.9, 0.95),
      simplify: taskScore("simplify", 0.8, 0.9, 0.95),
      coding_python: taskScore("coding_python", 0.7, 0.85, 0.95),
      coding_node: taskScore("coding_node", 0.7, 0.85, 0.95),
      coding_sql: taskScore("coding_sql", 0.65, 0.85, 0.95),
    },
  },

  "nvidia/deepseek-ai/deepseek-r1": {
    modelName: "deepseek-ai/deepseek-r1",
    providerName: "nvidia",
    maxContextTokens: 131072,
    maxOutputTokens: 8192,
    costPer1KInput: 0.0035,
    costPer1KOutput: 0.0035,
    strengths: ["reasoning", "deep-dive", "architecture", "debugging", "math"],
    weaknesses: ["simple_qa", "creative", "visualization", "hint"],
    supportedLanguages: ["en", "code"],
    fineTuned: true,
    recommendedFor: ["complex_reasoning", "architecture_design", "deep_analysis"],
    defaultScore: score({ quality: 0.92, latency: 0.55, cost: 0.4 }),
    scores: {
      explain: taskScore("explain", 0.88, 0.55, 0.4),
      code_generation: taskScore("code_generation", 0.85, 0.55, 0.4),
      debugging: taskScore("debugging", 0.9, 0.55, 0.4),
      architecture: taskScore("architecture", 0.92, 0.55, 0.4),
      "deep-dive": taskScore("deep-dive", 0.95, 0.5, 0.4),
      compare: taskScore("compare", 0.9, 0.55, 0.4),
      review: taskScore("review", 0.88, 0.55, 0.4),
      socratic: taskScore("socratic", 0.85, 0.55, 0.4),
      reasoning: taskScore("reasoning", 0.95, 0.5, 0.4),
      math: taskScore("math", 0.92, 0.55, 0.4),
      coding_python: taskScore("coding_python", 0.85, 0.55, 0.4),
      coding_node: taskScore("coding_node", 0.82, 0.55, 0.4),
      coding_laravel: taskScore("coding_laravel", 0.8, 0.55, 0.4),
      data_science: taskScore("data_science", 0.85, 0.55, 0.4),
      explain_ml: taskScore("explain_ml", 0.88, 0.55, 0.4),
      prompt_engineering: taskScore("prompt_engineering", 0.85, 0.55, 0.4),
      agent_design: taskScore("agent_design", 0.85, 0.55, 0.4),
    },
  },

  "nvidia/qwen/qwen3-235b-a22b": {
    modelName: "qwen/qwen3-235b-a22b",
    providerName: "nvidia",
    maxContextTokens: 131072,
    maxOutputTokens: 8192,
    costPer1KInput: 0.00089,
    costPer1KOutput: 0.00089,
    strengths: ["explain", "code_generation", "visualization", "coding_react", "coding_mobile"],
    weaknesses: ["deep-dive", "reasoning", "math"],
    supportedLanguages: ["en", "zh", "code"],
    fineTuned: false,
    recommendedFor: ["explanations", "visual_guides", "frontend_code", "mobile_code"],
    defaultScore: score({ quality: 0.8, latency: 0.75, cost: 0.8 }),
    scores: {
      explain: taskScore("explain", 0.82, 0.75, 0.8),
      code_generation: taskScore("code_generation", 0.8, 0.75, 0.8),
      debugging: taskScore("debugging", 0.75, 0.75, 0.8),
      architecture: taskScore("architecture", 0.78, 0.75, 0.8),
      visualization: taskScore("visualization", 0.85, 0.7, 0.8),
      simple_qa: taskScore("simple_qa", 0.8, 0.8, 0.8),
      coding_react: taskScore("coding_react", 0.78, 0.75, 0.8),
      coding_node: taskScore("coding_node", 0.75, 0.75, 0.8),
      coding_python: taskScore("coding_python", 0.75, 0.75, 0.8),
      coding_mobile: taskScore("coding_mobile", 0.78, 0.75, 0.8),
      coding_sql: taskScore("coding_sql", 0.72, 0.75, 0.8),
      prompt_engineering: taskScore("prompt_engineering", 0.78, 0.75, 0.8),
      system_prompt: taskScore("system_prompt", 0.78, 0.75, 0.8),
    },
  },

  "nvidia/nvidia/llama-3.1-nemotron-ultra-253b-v1": {
    modelName: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    providerName: "nvidia",
    maxContextTokens: 131072,
    maxOutputTokens: 8192,
    costPer1KInput: 0.00125,
    costPer1KOutput: 0.00125,
    strengths: ["explain", "deep-dive", "socratic", "compare", "reasoning"],
    weaknesses: ["simple_qa", "hint", "visualization"],
    supportedLanguages: ["en", "code"],
    fineTuned: true,
    recommendedFor: ["deep_explanations", "socratic_tutoring", "comparative_analysis"],
    defaultScore: score({ quality: 0.88, latency: 0.6, cost: 0.55 }),
    scores: {
      explain: taskScore("explain", 0.9, 0.6, 0.55),
      code_generation: taskScore("code_generation", 0.85, 0.6, 0.55),
      debugging: taskScore("debugging", 0.85, 0.6, 0.55),
      architecture: taskScore("architecture", 0.88, 0.6, 0.55),
      "deep-dive": taskScore("deep-dive", 0.92, 0.55, 0.55),
      compare: taskScore("compare", 0.9, 0.6, 0.55),
      review: taskScore("review", 0.88, 0.6, 0.55),
      socratic: taskScore("socratic", 0.92, 0.6, 0.55),
      reasoning: taskScore("reasoning", 0.88, 0.55, 0.55),
      practice: taskScore("practice", 0.85, 0.6, 0.55),
      interview: taskScore("interview", 0.85, 0.6, 0.55),
      coding_python: taskScore("coding_python", 0.82, 0.6, 0.55),
      coding_laravel: taskScore("coding_laravel", 0.8, 0.6, 0.55),
      data_science: taskScore("data_science", 0.85, 0.6, 0.55),
      explain_ml: taskScore("explain_ml", 0.88, 0.6, 0.55),
      explain_nlp: taskScore("explain_nlp", 0.85, 0.6, 0.55),
      prompt_engineering: taskScore("prompt_engineering", 0.85, 0.6, 0.55),
      agent_design: taskScore("agent_design", 0.85, 0.6, 0.55),
    },
  },

  "gemini/gemini-2.5-pro": {
    modelName: "gemini-2.5-pro",
    providerName: "gemini",
    maxContextTokens: 1048576,
    maxOutputTokens: 65536,
    costPer1KInput: 0.00125,
    costPer1KOutput: 0.005,
    strengths: ["explain", "code_generation", "architecture", "deep-dive", "visualization", "creative", "coding_react", "coding_python", "data_science", "explain_ml", "agent_design"],
    weaknesses: ["simple_qa"],
    supportedLanguages: ["en", "code", "multi"],
    fineTuned: false,
    recommendedFor: ["comprehensive_explanations", "visual_guides", "creative_tasks", "data_science"],
    defaultScore: score({ quality: 0.9, latency: 0.7, cost: 0.65 }),
    scores: {
      explain: taskScore("explain", 0.92, 0.7, 0.65),
      code_generation: taskScore("code_generation", 0.88, 0.7, 0.65),
      debugging: taskScore("debugging", 0.88, 0.7, 0.65),
      architecture: taskScore("architecture", 0.9, 0.7, 0.65),
      visualization: taskScore("visualization", 0.92, 0.65, 0.65),
      simple_qa: taskScore("simple_qa", 0.8, 0.75, 0.65),
      "deep-dive": taskScore("deep-dive", 0.92, 0.65, 0.65),
      compare: taskScore("compare", 0.9, 0.7, 0.65),
      review: taskScore("review", 0.9, 0.7, 0.65),
      socratic: taskScore("socratic", 0.9, 0.7, 0.65),
      practice: taskScore("practice", 0.88, 0.7, 0.65),
      interview: taskScore("interview", 0.88, 0.7, 0.65),
      creative: taskScore("creative", 0.92, 0.7, 0.65),
      coding_react: taskScore("coding_react", 0.85, 0.7, 0.65),
      coding_node: taskScore("coding_node", 0.85, 0.7, 0.65),
      coding_python: taskScore("coding_python", 0.88, 0.7, 0.65),
      coding_laravel: taskScore("coding_laravel", 0.85, 0.7, 0.65),
      coding_sql: taskScore("coding_sql", 0.85, 0.7, 0.65),
      coding_mobile: taskScore("coding_mobile", 0.85, 0.7, 0.65),
      data_science: taskScore("data_science", 0.88, 0.7, 0.65),
      explain_ml: taskScore("explain_ml", 0.9, 0.7, 0.65),
      explain_nlp: taskScore("explain_nlp", 0.88, 0.7, 0.65),
      explain_cv: taskScore("explain_cv", 0.85, 0.7, 0.65),
      prompt_engineering: taskScore("prompt_engineering", 0.88, 0.7, 0.65),
      agent_design: taskScore("agent_design", 0.88, 0.7, 0.65),
      system_prompt: taskScore("system_prompt", 0.88, 0.7, 0.65),
    },
  },

  "gemini/gemini-2.5-flash": {
    modelName: "gemini-2.5-flash",
    providerName: "gemini",
    maxContextTokens: 1048576,
    maxOutputTokens: 8192,
    costPer1KInput: 0.00015,
    costPer1KOutput: 0.0006,
    strengths: ["simple_qa", "explain", "hint", "simplify", "code_generation"],
    weaknesses: ["deep-dive", "architecture", "reasoning", "interview"],
    supportedLanguages: ["en", "code", "multi"],
    fineTuned: false,
    recommendedFor: ["quick_queries", "simple_tasks", "high_volume", "budget_conscious"],
    defaultScore: score({ quality: 0.72, latency: 0.95, cost: 0.98 }),
    scores: {
      explain: taskScore("explain", 0.75, 0.95, 0.98),
      code_generation: taskScore("code_generation", 0.7, 0.92, 0.98),
      debugging: taskScore("debugging", 0.68, 0.92, 0.98),
      simple_qa: taskScore("simple_qa", 0.82, 0.98, 0.98),
      hint: taskScore("hint", 0.78, 0.95, 0.98),
      simplify: taskScore("simplify", 0.8, 0.95, 0.98),
      coding_python: taskScore("coding_python", 0.68, 0.92, 0.98),
      coding_node: taskScore("coding_node", 0.68, 0.92, 0.98),
      coding_sql: taskScore("coding_sql", 0.65, 0.92, 0.98),
    },
  },

  "gemini/gemini-2.5-flash-lite": {
    modelName: "gemini-2.5-flash-lite",
    providerName: "gemini",
    maxContextTokens: 1048576,
    maxOutputTokens: 8192,
    costPer1KInput: 0.000075,
    costPer1KOutput: 0.0003,
    strengths: ["simple_qa", "explain", "hint", "simplify"],
    weaknesses: ["code_generation", "debugging", "architecture", "deep-dive", "review", "reasoning"],
    supportedLanguages: ["en", "multi"],
    fineTuned: false,
    recommendedFor: ["ultra_budget", "simple_qa", "classifications"],
    defaultScore: score({ quality: 0.6, latency: 0.98, cost: 1.0 }),
    scores: {
      explain: taskScore("explain", 0.65, 0.98, 1.0),
      simple_qa: taskScore("simple_qa", 0.75, 0.98, 1.0),
      hint: taskScore("hint", 0.7, 0.98, 1.0),
      simplify: taskScore("simplify", 0.72, 0.98, 1.0),
    },
  },

  "agentrouter/claude-sonnet-4-5-20250929": {
    modelName: "claude-sonnet-4-5-20250929",
    providerName: "agentrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.003,
    costPer1KOutput: 0.015,
    strengths: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "review", "reasoning", "coding_react", "coding_node", "coding_python", "agent_design"],
    weaknesses: ["simple_qa", "visualization"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["complex_code", "architecture_review", "deep_analysis", "agent_design"],
    defaultScore: score({ quality: 0.93, latency: 0.65, cost: 0.3 }),
    scores: {
      explain: taskScore("explain", 0.92, 0.65, 0.3),
      code_generation: taskScore("code_generation", 0.93, 0.65, 0.3),
      debugging: taskScore("debugging", 0.92, 0.65, 0.3),
      architecture: taskScore("architecture", 0.94, 0.65, 0.3),
      "deep-dive": taskScore("deep-dive", 0.93, 0.6, 0.3),
      compare: taskScore("compare", 0.92, 0.65, 0.3),
      review: taskScore("review", 0.94, 0.65, 0.3),
      socratic: taskScore("socratic", 0.9, 0.65, 0.3),
      practice: taskScore("practice", 0.9, 0.65, 0.3),
      interview: taskScore("interview", 0.9, 0.65, 0.3),
      reasoning: taskScore("reasoning", 0.93, 0.6, 0.3),
      math: taskScore("math", 0.9, 0.65, 0.3),
      coding_react: taskScore("coding_react", 0.92, 0.65, 0.3),
      coding_node: taskScore("coding_node", 0.92, 0.65, 0.3),
      coding_python: taskScore("coding_python", 0.92, 0.65, 0.3),
      coding_laravel: taskScore("coding_laravel", 0.88, 0.65, 0.3),
      coding_sql: taskScore("coding_sql", 0.9, 0.65, 0.3),
      coding_mobile: taskScore("coding_mobile", 0.88, 0.65, 0.3),
      data_science: taskScore("data_science", 0.88, 0.65, 0.3),
      explain_ml: taskScore("explain_ml", 0.9, 0.65, 0.3),
      prompt_engineering: taskScore("prompt_engineering", 0.9, 0.65, 0.3),
      agent_design: taskScore("agent_design", 0.92, 0.65, 0.3),
      system_prompt: taskScore("system_prompt", 0.92, 0.65, 0.3),
    },
  },

  "agentrouter/claude-haiku-4-5-20251001": {
    modelName: "claude-haiku-4-5-20251001",
    providerName: "agentrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.0008,
    costPer1KOutput: 0.004,
    strengths: ["simple_qa", "explain", "hint", "simplify", "code_generation"],
    weaknesses: ["deep-dive", "architecture", "reasoning", "interview"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["quick_tasks", "simple_code", "high_volume"],
    defaultScore: score({ quality: 0.75, latency: 0.9, cost: 0.7 }),
    scores: {
      explain: taskScore("explain", 0.78, 0.9, 0.7),
      code_generation: taskScore("code_generation", 0.75, 0.88, 0.7),
      debugging: taskScore("debugging", 0.72, 0.88, 0.7),
      simple_qa: taskScore("simple_qa", 0.82, 0.92, 0.7),
      hint: taskScore("hint", 0.8, 0.9, 0.7),
      simplify: taskScore("simplify", 0.82, 0.9, 0.7),
      coding_python: taskScore("coding_python", 0.72, 0.88, 0.7),
      coding_node: taskScore("coding_node", 0.72, 0.88, 0.7),
      coding_sql: taskScore("coding_sql", 0.7, 0.88, 0.7),
    },
  },

  "agentrouter/gpt-5": {
    modelName: "gpt-5",
    providerName: "agentrouter",
    maxContextTokens: 128000,
    maxOutputTokens: 16384,
    costPer1KInput: 0.0025,
    costPer1KOutput: 0.01,
    strengths: ["explain", "code_generation", "architecture", "reasoning", "math", "data_science", "creative", "agent_design"],
    weaknesses: ["simple_qa", "visualization"],
    supportedLanguages: ["en", "code", "multi"],
    fineTuned: false,
    recommendedFor: ["complex_problems", "math", "creative_writing", "data_science"],
    defaultScore: score({ quality: 0.9, latency: 0.6, cost: 0.35 }),
    scores: {
      explain: taskScore("explain", 0.9, 0.6, 0.35),
      code_generation: taskScore("code_generation", 0.88, 0.6, 0.35),
      debugging: taskScore("debugging", 0.88, 0.6, 0.35),
      architecture: taskScore("architecture", 0.9, 0.6, 0.35),
      "deep-dive": taskScore("deep-dive", 0.9, 0.55, 0.35),
      compare: taskScore("compare", 0.9, 0.6, 0.35),
      review: taskScore("review", 0.9, 0.6, 0.35),
      socratic: taskScore("socratic", 0.88, 0.6, 0.35),
      practice: taskScore("practice", 0.88, 0.6, 0.35),
      interview: taskScore("interview", 0.88, 0.6, 0.35),
      reasoning: taskScore("reasoning", 0.92, 0.55, 0.35),
      math: taskScore("math", 0.93, 0.55, 0.35),
      creative: taskScore("creative", 0.9, 0.6, 0.35),
      coding_react: taskScore("coding_react", 0.85, 0.6, 0.35),
      coding_node: taskScore("coding_node", 0.85, 0.6, 0.35),
      coding_python: taskScore("coding_python", 0.88, 0.6, 0.35),
      coding_laravel: taskScore("coding_laravel", 0.85, 0.6, 0.35),
      coding_sql: taskScore("coding_sql", 0.85, 0.6, 0.35),
      coding_mobile: taskScore("coding_mobile", 0.85, 0.6, 0.35),
      data_science: taskScore("data_science", 0.9, 0.6, 0.35),
      explain_ml: taskScore("explain_ml", 0.9, 0.6, 0.35),
      explain_nlp: taskScore("explain_nlp", 0.88, 0.6, 0.35),
      explain_cv: taskScore("explain_cv", 0.85, 0.6, 0.35),
      prompt_engineering: taskScore("prompt_engineering", 0.88, 0.6, 0.35),
      agent_design: taskScore("agent_design", 0.88, 0.6, 0.35),
      system_prompt: taskScore("system_prompt", 0.88, 0.6, 0.35),
    },
  },

  "agentrouter/deepseek-chat": {
    modelName: "deepseek-chat",
    providerName: "agentrouter",
    maxContextTokens: 65536,
    maxOutputTokens: 8192,
    costPer1KInput: 0.00027,
    costPer1KOutput: 0.0011,
    strengths: ["explain", "code_generation", "debugging", "simple_qa", "review"],
    weaknesses: ["deep-dive", "creative", "reasoning", "interview"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["budget_coding", "simple_reviews", "high_volume"],
    defaultScore: score({ quality: 0.75, latency: 0.8, cost: 0.85 }),
    scores: {
      explain: taskScore("explain", 0.78, 0.8, 0.85),
      code_generation: taskScore("code_generation", 0.75, 0.78, 0.85),
      debugging: taskScore("debugging", 0.72, 0.78, 0.85),
      architecture: taskScore("architecture", 0.7, 0.8, 0.85),
      simple_qa: taskScore("simple_qa", 0.8, 0.85, 0.85),
      review: taskScore("review", 0.75, 0.8, 0.85),
      coding_python: taskScore("coding_python", 0.72, 0.78, 0.85),
      coding_node: taskScore("coding_node", 0.72, 0.78, 0.85),
      coding_sql: taskScore("coding_sql", 0.7, 0.78, 0.85),
    },
  },

  "agentrouter/gemini-2.5-pro": {
    modelName: "gemini-2.5-pro",
    providerName: "agentrouter",
    maxContextTokens: 1048576,
    maxOutputTokens: 65536,
    costPer1KInput: 0.00125,
    costPer1KOutput: 0.005,
    strengths: ["explain", "code_generation", "architecture", "deep-dive", "visualization", "creative"],
    weaknesses: ["simple_qa"],
    supportedLanguages: ["en", "code", "multi"],
    fineTuned: false,
    recommendedFor: ["comprehensive_explanations", "visual_guides", "creative_tasks"],
    defaultScore: score({ quality: 0.9, latency: 0.7, cost: 0.65 }),
    scores: {
      explain: taskScore("explain", 0.92, 0.7, 0.65),
      code_generation: taskScore("code_generation", 0.88, 0.7, 0.65),
      architecture: taskScore("architecture", 0.9, 0.7, 0.65),
      "deep-dive": taskScore("deep-dive", 0.92, 0.65, 0.65),
      visualization: taskScore("visualization", 0.92, 0.65, 0.65),
      creative: taskScore("creative", 0.92, 0.7, 0.65),
      coding_react: taskScore("coding_react", 0.85, 0.7, 0.65),
      coding_python: taskScore("coding_python", 0.88, 0.7, 0.65),
      data_science: taskScore("data_science", 0.88, 0.7, 0.65),
      explain_ml: taskScore("explain_ml", 0.9, 0.7, 0.65),
    },
  },

  "tokenrouter/auto:balance": {
    modelName: "auto:balance",
    providerName: "tokenrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.0015,
    costPer1KOutput: 0.006,
    strengths: ["explain", "code_generation", "debugging", "architecture", "deep-dive", "review", "socratic"],
    weaknesses: ["simple_qa", "hint", "simplify"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["balanced_tasks", "general_purpose"],
    defaultScore: score({ quality: 0.85, latency: 0.75, cost: 0.5 }),
    scores: {
      explain: taskScore("explain", 0.85, 0.75, 0.5),
      code_generation: taskScore("code_generation", 0.82, 0.75, 0.5),
      debugging: taskScore("debugging", 0.8, 0.75, 0.5),
      architecture: taskScore("architecture", 0.85, 0.75, 0.5),
      "deep-dive": taskScore("deep-dive", 0.85, 0.7, 0.5),
      compare: taskScore("compare", 0.85, 0.75, 0.5),
      review: taskScore("review", 0.85, 0.75, 0.5),
      socratic: taskScore("socratic", 0.85, 0.75, 0.5),
      practice: taskScore("practice", 0.82, 0.75, 0.5),
      interview: taskScore("interview", 0.82, 0.75, 0.5),
    },
  },

  "tokenrouter/auto:cost": {
    modelName: "auto:cost",
    providerName: "tokenrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.0005,
    costPer1KOutput: 0.002,
    strengths: ["simple_qa", "explain", "hint", "simplify", "code_generation"],
    weaknesses: ["deep-dive", "architecture", "reasoning", "interview"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["budget_conscious", "high_volume", "simple_tasks"],
    defaultScore: score({ quality: 0.7, latency: 0.85, cost: 0.95 }),
    scores: {
      explain: taskScore("explain", 0.72, 0.85, 0.95),
      code_generation: taskScore("code_generation", 0.68, 0.82, 0.95),
      debugging: taskScore("debugging", 0.65, 0.82, 0.95),
      simple_qa: taskScore("simple_qa", 0.78, 0.9, 0.95),
      hint: taskScore("hint", 0.75, 0.85, 0.95),
      simplify: taskScore("simplify", 0.78, 0.85, 0.95),
    },
  },

  "tokenrouter/auto:quality": {
    modelName: "auto:quality",
    providerName: "tokenrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.003,
    costPer1KOutput: 0.012,
    strengths: ["explain", "code_generation", "architecture", "deep-dive", "reasoning", "review", "interview"],
    weaknesses: ["simple_qa", "hint", "simplify"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["high_quality_tasks", "complex_analysis", "critical_code"],
    defaultScore: score({ quality: 0.92, latency: 0.6, cost: 0.2 }),
    scores: {
      explain: taskScore("explain", 0.92, 0.6, 0.2),
      code_generation: taskScore("code_generation", 0.9, 0.6, 0.2),
      debugging: taskScore("debugging", 0.9, 0.6, 0.2),
      architecture: taskScore("architecture", 0.92, 0.6, 0.2),
      "deep-dive": taskScore("deep-dive", 0.93, 0.55, 0.2),
      compare: taskScore("compare", 0.92, 0.6, 0.2),
      review: taskScore("review", 0.92, 0.6, 0.2),
      socratic: taskScore("socratic", 0.9, 0.6, 0.2),
      practice: taskScore("practice", 0.9, 0.6, 0.2),
      interview: taskScore("interview", 0.92, 0.6, 0.2),
      reasoning: taskScore("reasoning", 0.93, 0.55, 0.2),
      coding_python: taskScore("coding_python", 0.9, 0.6, 0.2),
      coding_node: taskScore("coding_node", 0.88, 0.6, 0.2),
      coding_laravel: taskScore("coding_laravel", 0.85, 0.6, 0.2),
      agent_design: taskScore("agent_design", 0.9, 0.6, 0.2),
    },
  },

  "tokenrouter/auto:latency": {
    modelName: "auto:latency",
    providerName: "tokenrouter",
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    costPer1KInput: 0.001,
    costPer1KOutput: 0.004,
    strengths: ["simple_qa", "explain", "hint", "simplify"],
    weaknesses: ["deep-dive", "architecture", "reasoning", "code_generation"],
    supportedLanguages: ["en", "code"],
    fineTuned: false,
    recommendedFor: ["real_time", "low_latency", "quick_responses"],
    defaultScore: score({ quality: 0.65, latency: 0.98, cost: 0.75 }),
    scores: {
      explain: taskScore("explain", 0.68, 0.98, 0.75),
      simple_qa: taskScore("simple_qa", 0.75, 0.98, 0.75),
      hint: taskScore("hint", 0.72, 0.98, 0.75),
      simplify: taskScore("simplify", 0.72, 0.98, 0.75),
    },
  },
};

export function getCapabilityProfile(
  providerName: string,
  modelName: string
): ModelCapabilityProfile | undefined {
  const key = `${providerName}/${modelName}`;
  return MODEL_CAPABILITY_MATRIX[key];
}

export function getCapabilityScore(
  providerName: string,
  modelName: string,
  task: TaskCapability
): CapabilityScore {
  const profile = getCapabilityProfile(providerName, modelName);
  if (!profile) return { ...DEFAULT_CAPABILITY_SCORE, task };
  return profile.scores[task] || { ...profile.defaultScore, task };
}

export function modelSupportsTask(
  providerName: string,
  modelName: string,
  task: TaskCapability
): boolean {
  const profile = getCapabilityProfile(providerName, modelName);
  if (!profile) return false;
  return task in (profile.scores || {}) || !profile.weaknesses.includes(task);
}

export function getModelsForTask(
  task: TaskCapability,
  minQuality = 0
): ModelCapabilityProfile[] {
  return Object.values(MODEL_CAPABILITY_MATRIX)
    .filter((profile) => {
      const score = profile.scores[task] || profile.defaultScore;
      return score.quality >= minQuality && !profile.weaknesses.includes(task);
    })
    .sort((a, b) => {
      const scoreA = a.scores[task]?.quality || a.defaultScore.quality;
      const scoreB = b.scores[task]?.quality || b.defaultScore.quality;
      return scoreB - scoreA;
    });
}

export function getBestModelForTask(
  task: TaskCapability,
  complexity: "low" | "medium" | "high",
  priority: "quality" | "cost" | "latency" = "quality"
): ModelCapabilityProfile | null {
  const candidates = getModelsForTask(task, 0.5);
  if (candidates.length === 0) return null;

  const scored = candidates.map((profile) => {
    const score = profile.scores[task] || profile.defaultScore;
    let composite = 0;
    switch (priority) {
      case "quality":
        composite = score.quality * 0.5 + score.cost * 0.25 + score.latency * 0.25;
        break;
      case "cost":
        composite = score.cost * 0.5 + score.quality * 0.3 + score.latency * 0.2;
        break;
      case "latency":
        composite = score.latency * 0.5 + score.quality * 0.3 + score.cost * 0.2;
        break;
    }
    if (complexity === "high") composite += 0.1;
    if (complexity === "low") composite -= 0.1;
    return { profile, composite };
  });

  scored.sort((a, b) => b.composite - a.composite);
  return scored[0].profile;
}

export function checkContextWindow(
  providerName: string,
  modelName: string,
  estimatedTokens: number
): boolean {
  const profile = getCapabilityProfile(providerName, modelName);
  if (!profile) return false;
  return estimatedTokens <= profile.maxContextTokens;
}

export function getContextWindowUtilization(
  providerName: string,
  modelName: string,
  estimatedTokens: number
): number {
  const profile = getCapabilityProfile(providerName, modelName);
  if (!profile || profile.maxContextTokens === 0) return 0;
  return Math.min(estimatedTokens / profile.maxContextTokens, 1);
}