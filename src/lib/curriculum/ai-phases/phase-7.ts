// Phase 7: Production AI Engineering, vLLM & Deployment
export const aiPhase7 = {
  title: "Phase 7: Production AI Engineering & Deployment",
  description: "Deploy scalable AI systems: vLLM & Ollama serving, continuous batching, semantic caching, intelligent model routers, OpenTelemetry tracing, and latency/cost optimization.",
  slug: "phase-7-production-ai-deployment",
  topics: [
    {
      title: "High-Throughput LLM Serving: vLLM, Ollama & Continuous Batching",
      description: "Learn high-throughput inference engines: vLLM, TensorRT-LLM, Ollama, PagedAttention, Continuous (Iteration-Level) Batching, and Speculative Decoding.",
      slug: "vllm-ollama-continuous-batching",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4, 5, 6],
      concepts: [
        {
          title: "Static vs Continuous (Iteration-Level) Batching",
          description: "Static batching waits for all requests in a batch to finish, leaving GPUs idle when sequences have varying lengths. Continuous batching dynamically inserts new incoming requests into the decode iteration as soon as existing requests emit an EOS token, boosting GPU throughput by 5x-10x.",
        },
        {
          title: "Speculative Decoding",
          description: "A small draft model (e.g. 1B) quickly generates 4-8 candidate tokens, and the large target model (e.g. 70B) verifies all candidate tokens in parallel in a single forward pass, providing 2x-3x speedup with 0 loss in mathematical accuracy.",
        },
        {
          title: "Ollama for Local Prototyping & Edge Inference",
          description: "Ollama packages model weights, GGUF quantization, and inference runtime into a unified CLI (ollama run llama3:8b) with an OpenAI-compatible REST API (/v1/chat/completions).",
        },
      ],
      examples: [
        {
          title: "Speculative Decoding Simulation in Python",
          description: "Simulating draft model generation and parallel target model verification",
          starterCode: `def speculative_decode_step(draft_model, target_model, prompt, k_spec=3):
    # Generate k draft tokens, verify in parallel with target model
    pass`,
          solutionCode: `import numpy as np

def speculative_decode_step(prompt_tokens, draft_tokens, target_accepted_mask):
    # draft_tokens: list of proposed tokens from fast 1B model
    # target_accepted_mask: bool list indicating if 70B target model verified each token
    accepted_tokens = []
    for token, accepted in zip(draft_tokens, target_accepted_mask):
        if accepted:
            accepted_tokens.append(token)
        else:
            # Rejection: stop at first failure and resample from target model
            break
            
    return accepted_tokens

# Demo: draft proposes 4 tokens: ['The', 'quick', 'brown', 'fox']
draft = ["The", "quick", "brown", "fox"]
# Target model verifies first 3, rejects 4th
verified = [True, True, True, False]

accepted = speculative_decode_step("Prompt: ...", draft, verified)
print(f"Draft proposed {len(draft)} tokens. Target accepted {len(accepted)} tokens: {accepted}")
print(f"Accelerated generation throughput: {len(accepted)} tokens generated in 1 target model step!")`,
        },
      ],
      exercises: [
        {
          title: "Calculate Continuous Batching Throughput Speedup",
          description: "Write a function calculating theoretical throughput in tokens/second for static vs continuous batching",
          instructions: "Given request lengths, compute total latency under static batching vs continuous batching.",
          starterCode: `def compare_batching_efficiency(request_lengths, ms_per_token=20):
    # Return dict with static_time_ms, continuous_time_ms, and speedup
    pass`,
          solutionCode: `def compare_batching_efficiency(request_lengths, ms_per_token=20):
    # Static batch time is determined by longest request * batch_size
    max_len = max(request_lengths)
    static_time_ms = max_len * len(request_lengths) * ms_per_token
    
    # Continuous batch time is sum of all tokens processed in parallel
    total_tokens = sum(request_lengths)
    continuous_time_ms = total_tokens * ms_per_token
    
    speedup = static_time_ms / continuous_time_ms if continuous_time_ms else 1.0
    return {
        "static_time_ms": static_time_ms,
        "continuous_time_ms": continuous_time_ms,
        "speedup_ratio": round(speedup, 2)
    }

requests = [10, 50, 12, 100, 25] # Heterogeneous lengths
res = compare_batching_efficiency(requests)
print("Batching Comparison:", res)`,
          testCases: "Correctly identifies static batch bottleneck by max length; Computes correct speedup ratio",
          hints: "Static batching processes batch_size * max_length tokens; continuous batching processes exactly sum(lengths).",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Continuous (Iteration-Level) Batching Workflow",
          config: JSON.stringify({
            nodes: [
              { id: "queue", label: "Incoming Request Queue\n[Req A (100t), Req B (20t), Req C (50t)]", x: 80, y: 120 },
              { id: "engine", label: "vLLM Engine\nPagedAttention Memory Blocks", x: 280, y: 120 },
              { id: "batch", label: "Dynamic Iteration Step\nReq B finishes → Slot Freed immediately", x: 480, y: 120 },
              { id: "stream", label: "Zero-Latency Stream\n5x-10x Throughput Boost", x: 670, y: 120 },
            ],
            edges: [
              { from: "queue", to: "engine", label: "stream in" },
              { from: "engine", to: "batch", label: "allocate pages" },
              { from: "batch", to: "stream", label: "emit tokens" },
            ],
            steps: [
              { id: "1", activeNodes: ["queue", "engine"], description: "Heterogeneous requests allocated non-contiguous virtual VRAM pages via PagedAttention" },
              { id: "2", activeNodes: ["engine", "batch"], description: "Continuous batching schedules decode steps per iteration rather than waiting for slowest request" },
              { id: "3", activeNodes: ["batch", "stream"], description: "Completed slots dynamically replaced with incoming queries, saturating GPU compute" },
            ],
          }),
        },
      ],
      lesson: {
        title: "High-Throughput LLM Serving: vLLM, Ollama & Continuous Batching",
        content: `## Production LLM Serving Engines

### 1. The Serving Stack
- **vLLM**: The industry gold standard for high-throughput enterprise serving. Implements PagedAttention, Continuous Batching, and Chunked Prefill.
- **Ollama / llama.cpp**: Highly optimized CPU/GPU GGUF engine for local, edge, and developer workstation inference.
- **TensorRT-LLM**: NVIDIA's compiled kernel engine for maximum FP8 / INT4 throughput on H100/A100 clusters.

### 2. Speculative Decoding
**Throughput Speedup = (1 + gamma * alpha) / (1 + c)**

Where gamma is draft lookahead count, alpha is acceptance rate (~70-80%), and c is relative draft model execution cost.`,
        explanation: "Master the mechanics of high-throughput production LLM inference engines and serving infrastructure.",
      },
    },
    {
      title: "Semantic Caching, Model Cascading & AI Observability",
      description: "Build semantic embedding caches (GPTCache, Redis), multi-model cascade routers, and OpenTelemetry / LangSmith observability pipelines.",
      slug: "semantic-caching-routing-observability",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4, 5, 6, 7],
      concepts: [
        {
          title: "Semantic Caching with Vector Distance",
          description: "Traditional key-value caches require exact character matches. Semantic caching embeds the incoming query and checks if cosine distance to a cached query is below a strict threshold (e.g. cosine similarity > 0.95), returning cached responses in <5ms with 0 token cost.",
        },
        {
          title: "Model Cascading & Complexity Routing",
          description: "80% of enterprise queries are simple queries that can be answered by lightweight 8B models (Gemini Flash, Llama 3 8B, GPT-4o-mini). A classifier routes simple tasks to fast models ($0.0001/1k) and reserves heavy reasoning models (Claude 3.7 Sonnet, DeepSeek-R1) for complex coding/architecture tasks.",
        },
        {
          title: "AI Observability & Tracing",
          description: "Track Latency (Time to First Token - TTFT, Inter-Token Latency - ITL), Token Utilization, Cost per Session, and Hallucination/Refusal Rates using OpenTelemetry, LangSmith, and Helicone.",
        },
      ],
      examples: [
        {
          title: "Semantic Cache with Distance Threshold in Python",
          description: "An in-memory semantic cache using vector embeddings and cosine similarity",
          starterCode: `class SemanticCache:
    def __init__(self, similarity_threshold=0.92):
        self.cache = []
        
    def get(self, query_vector):
        pass
        
    def set(self, query_text, query_vector, response_text):
        pass`,
          solutionCode: `import numpy as np

class SemanticCache:
    def __init__(self, similarity_threshold=0.92):
        self.threshold = similarity_threshold
        self.entries = [] # list of (query_text, query_vector, response)
        
    def get(self, query_vector):
        q_norm = query_vector / np.linalg.norm(query_vector)
        for text, vec, response in self.entries:
            v_norm = vec / np.linalg.norm(vec)
            sim = float(np.dot(q_norm, v_norm))
            if sim >= self.threshold:
                return {"hit": True, "similarity": round(sim, 4), "response": response, "matched_query": text}
        return {"hit": False, "response": None}
        
    def set(self, query_text, query_vector, response_text):
        self.entries.append((query_text, query_vector, response_text))

cache = SemanticCache(similarity_threshold=0.90)
# Seed cache with answer
cache.set("What is the capital of France?", np.array([0.9, 0.1]), "Paris is the capital of France.")

# Query with paraphrased vector
query_vec = np.array([0.88, 0.12]) # very close to [0.9, 0.1]
hit_result = cache.get(query_vec)
print("Semantic Cache Result:", hit_result)`,
        },
      ],
      exercises: [
        {
          title: "Build a Cost & Latency Model Cascade Router",
          description: "Write a router function that predicts query complexity and assigns optimal model tier (lightweight, standard, reasoning)",
          instructions: "Implement route_query(prompt, budget_remaining) that evaluates length, keywords, and code presence, returning model identifier.",
          starterCode: `def route_query(prompt, budget_remaining):
    # Classify complexity and return selected model
    pass`,
          solutionCode: `def route_query(prompt, budget_remaining):
    p_lower = prompt.lower()
    has_code = "'''" in prompt or "def " in prompt or "class " in prompt or "function" in p_lower
    is_complex_reasoning = any(k in p_lower for k in ["architect", "analyze", "evaluate", "compare", "proof", "step by step"])
    
    if budget_remaining < 0.05:
        # Fallback to ultra low-cost model under budget constraint
        return "gemini-3.5-flash-lite"
        
    if has_code or is_complex_reasoning or len(prompt) > 500:
        return "deepseek-r1" # High capability reasoning model
    elif len(prompt) > 100:
        return "gemini-3.5-flash" # Standard fast model
    else:
        return "gemini-3.5-flash-lite" # Simple quick query

print("Complex coding:", route_query("def solve(): optimize this dynamic programming algorithm", budget_remaining=1.0))
print("Simple greeting:", route_query("Hello, what is your name?", budget_remaining=1.0))
print("Budget depleted:", route_query("Design a scalable microservices architecture", budget_remaining=0.01))`,
          testCases: "Selects reasoning tier for coding prompts; Selects low-cost tier for short queries; Respects budget limits",
          hints: "Inspect prompt for code markers and reasoning keywords, checking budget threshold first.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Semantic Caching & Model Cascading Architecture",
          config: JSON.stringify({
            nodes: [
              { id: "req", label: "User Prompt Request", x: 80, y: 120 },
              { id: "cache", label: "Semantic Cache\nVector Similarity > 0.95?", x: 260, y: 120 },
              { id: "hit", label: "Instant 5ms Cache Hit\n$0.00 Cost", x: 440, y: 40 },
              { id: "router", label: "Cascade Router\nClassify Task Complexity", x: 440, y: 180 },
              { id: "small", label: "Fast Model (Flash / 8B)\n$0.0001 / 1k tokens", x: 630, y: 120 },
              { id: "large", label: "Reasoning Model (R1 / Sonnet)\nDeep Thinking Engine", x: 630, y: 220 },
            ],
            edges: [
              { from: "req", to: "cache", label: "query" },
              { from: "cache", to: "hit", label: "cache hit" },
              { from: "cache", to: "router", label: "cache miss" },
              { from: "router", to: "small", label: "simple task" },
              { from: "router", to: "large", label: "complex logic" },
            ],
            steps: [
              { id: "1", activeNodes: ["req", "cache"], description: "User query checked against semantic embedding cache" },
              { id: "2", activeNodes: ["cache", "hit"], description: "Semantically equivalent past questions answered instantly with 0 API cost" },
              { id: "3", activeNodes: ["cache", "router", "small", "large"], description: "Cache misses routed to optimal model tier based on task complexity" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Semantic Caching, Model Cascading & AI Observability",
        content: `## Production AI Architecture & Observability

### 1. Semantic Caching
Why pay for identical or paraphrased queries repeatedly?
Semantic caching computes cosine similarity between incoming query embedding and cached embeddings:
**Sim(e_new, e_cached) = (e_new · e_cached) / (||e_new|| ||e_cached||) >= tau**

If similarity exceeds threshold tau ~ 0.95, the cached completion is returned in **<5ms** with zero LLM API cost.

### 2. Model Cascading
- **Tier 1 (Fast / Edge)**: Gemini 3.5 Flash Lite, Llama 3 8B, GPT-4o-mini (handles ~70% of traffic).
- **Tier 2 (Standard Enterprise)**: Gemini 3.5 Flash, Claude 3.5 Haiku.
- **Tier 3 (Deep Reasoning & Architecture)**: DeepSeek-R1, Claude 3.7 Sonnet, GPT-4o.

This cascade strategy routinely slashes enterprise AI API bills by **60%–80%** while reducing average latency!`,
        explanation: "Master the enterprise deployment architecture: semantic vector caching, intelligent model cascading, and full telemetry observability.",
      },
    },
  ],
};
