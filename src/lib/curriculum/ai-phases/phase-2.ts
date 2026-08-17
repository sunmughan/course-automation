// Phase 2: Transformer Architecture & Large Language Models Deep Dive
export const aiPhase2 = {
  title: "Phase 2: Transformer Architecture & Large Language Models Deep Dive",
  description: "Master Scaled Dot-Product Attention, Multi-Head Attention, Feed-Forward Networks, Decoder-Only Architectures, KV-Caching, and the modern open/closed LLM Zoo.",
  slug: "phase-2-transformer-llm-deep-dive",
  topics: [
    {
      title: "Attention Mechanisms & Scaled Dot-Product Attention",
      description: "Deconstruct Queries (Q), Keys (K), and Values (V), attention scaling, softmax normalization, and causal masking.",
      slug: "scaled-dot-product-attention",
      difficulty: 3,
      prerequisites: [0, 1, 2, 3],
      concepts: [
        {
          title: "Queries, Keys & Values (Q, K, V) Analogy",
          description: "Think of a search engine or database: Query (Q) is what you are searching for. Key (K) is the title/tags of every entry in the database. Value (V) is the actual content. Attention calculates the match between Query and all Keys, producing weights to take a weighted sum of all Values.",
        },
        {
          title: "The Attention Equation & Temperature Scaling",
          description: "Attention(Q, K, V) = softmax((Q · K^T) / sqrt(d_k)) · V. Dividing by sqrt(d_k) prevents dot products from growing excessively large for high dimensions, which would cause softmax gradients to vanish.",
        },
        {
          title: "Causal (Autoregressive) Masking",
          description: "In decoder models like GPT and Llama, future tokens must be masked out during training so the model cannot 'cheat' by looking ahead. The upper triangular matrix of attention logits is set to -∞ before applying softmax.",
        },
      ],
      examples: [
        {
          title: "Scaled Dot-Product Attention with Causal Mask in Python",
          description: "Complete numerical implementation of masked multi-token self-attention with NumPy",
          starterCode: `import numpy as np

def scaled_dot_product_attention(Q, K, V, is_causal=True):
    # Calculate attention scores, apply mask if causal, softmax, and weighted sum
    pass`,
          solutionCode: `import numpy as np

def softmax(x, axis=-1):
    exp_x = np.exp(x - np.max(x, axis=axis, keepdims=True))
    return exp_x / np.sum(exp_x, axis=axis, keepdims=True)

def scaled_dot_product_attention(Q, K, V, is_causal=True):
    seq_len, d_k = Q.shape
    # 1. Compute raw affinity scores
    scores = np.dot(Q, K.T) / np.sqrt(d_k)
    
    # 2. Apply causal mask (set upper triangle to -infinity)
    if is_causal:
        mask = np.triu(np.ones((seq_len, seq_len)), k=1)
        scores = np.where(mask == 1, -1e9, scores)
        
    # 3. Softmax along key dimension
    weights = softmax(scores, axis=-1)
    
    # 4. Weighted combination of values
    output = np.dot(weights, V)
    return output, weights

# Demo with 4 tokens, dimension 8
Q = np.random.randn(4, 8)
K = np.random.randn(4, 8)
V = np.random.randn(4, 8)
out, attn_matrix = scaled_dot_product_attention(Q, K, V, is_causal=True)

print("Causal Attention Matrix (lower triangular weights):\\n", np.round(attn_matrix, 3))
print("Output Shape:", out.shape)`,
        },
      ],
      exercises: [
        {
          title: "Verify Causal Attention Non-Leakage",
          description: "Write a test function to verify that modifying future tokens does NOT change past attention outputs",
          instructions: "Compute attention output for sequence S1. Change the last token to make sequence S2. Assert that attention outputs for token 0 and 1 remain identical.",
          starterCode: `def verify_causal_invariance(attention_fn):
    # Test that past tokens are unaffected by future token changes
    pass`,
          solutionCode: `import numpy as np

def verify_causal_invariance(attention_fn):
    seq_len, d = 4, 8
    Q1 = np.random.randn(seq_len, d)
    K1 = np.random.randn(seq_len, d)
    V1 = np.random.randn(seq_len, d)
    
    out1, _ = attention_fn(Q1, K1, V1, is_causal=True)
    
    # Modify the 4th token in Q, K, V
    Q2, K2, V2 = Q1.copy(), K1.copy(), V1.copy()
    Q2[3] = np.random.randn(d)
    K2[3] = np.random.randn(d)
    V2[3] = np.random.randn(d)
    
    out2, _ = attention_fn(Q2, K2, V2, is_causal=True)
    
    # First 3 tokens must be exactly equal
    diff = np.max(np.abs(out1[:3] - out2[:3]))
    return bool(diff < 1e-6)

print("Causal invariance holds:", verify_causal_invariance(scaled_dot_product_attention))`,
          testCases: "Causal invariance passes with 0 tolerance; Future token alterations do not leak to prior positions",
          hints: "Check that out1[0:3] matches out2[0:3] when only token index 3 is altered in the sequence.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Scaled Dot-Product Attention Pipeline",
          config: JSON.stringify({
            nodes: [
              { id: "q", label: "Query Q", x: 80, y: 50 },
              { id: "k", label: "Key K", x: 80, y: 150 },
              { id: "matmul", label: "Q · K^T\nRaw Scores", x: 230, y: 100 },
              { id: "scale", label: "Scale / √d_k\n+ Causal Mask", x: 380, y: 100 },
              { id: "sm", label: "Softmax\nAttn Weights", x: 530, y: 100 },
              { id: "v", label: "Value V", x: 530, y: 220 },
              { id: "out", label: "Context Output\nWeights · V", x: 680, y: 160 },
            ],
            edges: [
              { from: "q", to: "matmul", label: "matrix mult" },
              { from: "k", to: "matmul", label: "transpose" },
              { from: "matmul", to: "scale", label: "scale & mask" },
              { from: "scale", to: "sm", label: "normalize" },
              { from: "sm", to: "out", label: "weighted sum" },
              { from: "v", to: "out", label: "values" },
            ],
            steps: [
              { id: "1", activeNodes: ["q", "k", "matmul"], description: "Queries and Keys projected and multiplied to measure pairwise token affinities" },
              { id: "2", activeNodes: ["scale", "sm"], description: "Scores scaled by 1/√d_k and masked causally, then normalized with Softmax" },
              { id: "3", activeNodes: ["v", "out"], description: "Attention weights dynamically pull relevant information from Value vectors" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Attention Mechanisms & Scaled Dot-Product Attention",
        content: `## Scaled Dot-Product Attention Deep Dive

Attention is the mathematical engine behind all modern Large Language Models.

### 1. The Core Formulation
**Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) + M ) * V**

Where:
- **Q = X * W_Q** (Query matrix: what tokens are looking for)
- **K = X * W_K** (Key matrix: what tokens contain)
- **V = X * W_V** (Value matrix: the actual payload information)
- **M**: Causal attention mask (prevents attending to future tokens)

### 2. Why Divide by sqrt(d_k)?
If components of q and k are independent random variables with mean 0 and variance 1, their dot product has variance d_k.
For large d_k (e.g. 128), dot products would become very large, pushing softmax into regions of near-zero gradients (vanishing gradient problem). Scaling by 1 / sqrt(d_k) preserves stable unit variance!`,
        explanation: "Master the mathematical and implementation mechanics of Q, K, V projections and scaled causal self-attention.",
      },
    },
    {
      title: "Multi-Head Attention (MHA) & Grouped-Query Attention (GQA)",
      description: "Understand Multi-Head Attention, Multi-Query Attention (MQA), and Grouped-Query Attention (GQA) used in Llama 3 and Mistral.",
      slug: "multi-head-grouped-query-attention",
      difficulty: 3,
      prerequisites: [0, 1, 2, 3, 4],
      concepts: [
        {
          title: "Multi-Head Attention (MHA)",
          description: "Rather than a single attention function, MHA linearly projects Q, K, V into $h$ different subspaces with smaller dimensions ($d_k = d_{model} / h$). Each head specializes in a different linguistic relationship (e.g. grammar, subject-verb agreement, semantic coreference).",
        },
        {
          title: "Grouped-Query Attention (GQA)",
          description: "MHA requires storing full K and V caches for every head during generation. Multi-Query Attention (MQA) shares a single K, V pair across all Q heads. Grouped-Query Attention (GQA) groups Q heads into $g$ groups (e.g., 8 groups for 32 heads), drastically reducing memory bandwidth while preserving model quality.",
        },
        {
          title: "Linear Output Projection W_O",
          description: "After all heads compute their outputs, they are concatenated horizontally and projected back to model dimension via $W_O \\in \\mathbb{R}^{d_{model} \\times d_{model}}$, blending multi-faceted features.",
        },
      ],
      examples: [
        {
          title: "Multi-Head Attention Implementation in Python",
          description: "Implementing Multi-Head Attention splitting, parallel attention, and output projection",
          starterCode: `import numpy as np

class MultiHeadAttention:
    def __init__(self, d_model=64, num_heads=4):
        # Initialize projections
        pass
        
    def forward(self, X):
        pass`,
          solutionCode: `import numpy as np

class MultiHeadAttention:
    def __init__(self, d_model=64, num_heads=4):
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        # Projection matrices
        self.W_q = np.random.randn(d_model, d_model) * 0.1
        self.W_k = np.random.randn(d_model, d_model) * 0.1
        self.W_v = np.random.randn(d_model, d_model) * 0.1
        self.W_o = np.random.randn(d_model, d_model) * 0.1
        
    def forward(self, X):
        seq_len, _ = X.shape
        # 1. Project Q, K, V
        Q = np.dot(X, self.W_q).reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)
        K = np.dot(X, self.W_k).reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)
        V = np.dot(X, self.W_v).reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)
        
        # 2. Compute attention per head
        scores = np.matmul(Q, K.transpose(0, 2, 1)) / np.sqrt(self.d_k)
        mask = np.triu(np.ones((seq_len, seq_len)), k=1)
        scores = np.where(mask == 1, -1e9, scores)
        
        exp_s = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        weights = exp_s / np.sum(exp_s, axis=-1, keepdims=True)
        
        head_outputs = np.matmul(weights, V) # [num_heads, seq_len, d_k]
        
        # 3. Concatenate and project
        concat = head_outputs.transpose(1, 0, 2).reshape(seq_len, self.d_model)
        output = np.dot(concat, self.W_o)
        return output

mha = MultiHeadAttention(d_model=64, num_heads=4)
tokens = np.random.randn(6, 64) # 6 tokens
out = mha.forward(tokens)
print("MHA Output Shape:", out.shape)`,
        },
      ],
      exercises: [
        {
          title: "Calculate KV-Cache Memory Savings of GQA",
          description: "Write a function calculating KV-Cache memory consumption in GB for MHA vs MQA vs GQA",
          instructions: "Given batch_size, seq_len, layers, num_q_heads, num_kv_heads, and d_k, compute total KV cache memory in gigabytes (assuming FP16 / 2 bytes per element).",
          starterCode: `def calculate_kv_cache_gb(batch_size, seq_len, layers, num_kv_heads, d_k, bytes_per_elem=2):
    # Return memory in GB
    pass`,
          solutionCode: `def calculate_kv_cache_gb(batch_size, seq_len, layers, num_kv_heads, d_k, bytes_per_elem=2):
    # Total elements = 2 (for K and V) * batch_size * seq_len * layers * num_kv_heads * d_k
    total_elements = 2 * batch_size * seq_len * layers * num_kv_heads * d_k
    total_bytes = total_elements * bytes_per_elem
    return total_bytes / (1024 ** 3)

# Compare Llama-3 70B MHA (64 heads) vs GQA (8 heads) for 8k context, batch 16, 80 layers, d_k 128
mha_gb = calculate_kv_cache_gb(16, 8192, 80, 64, 128)
gqa_gb = calculate_kv_cache_gb(16, 8192, 80, 8, 128)

print(f"MHA KV Cache: {mha_gb:.2f} GB")
print(f"GQA KV Cache: {gqa_gb:.2f} GB (8x reduction!)")`,
          testCases: "Correct calculation for FP16 memory; GQA yields exact proportional savings compared to MHA",
          hints: "Memory = 2 (K and V) * batch * seq_len * layers * num_kv_heads * d_k * 2 bytes, divided by 1024^3 for GB.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "MHA vs GQA Architecture Comparison",
          config: JSON.stringify({
            nodes: [
              { id: "q", label: "Query Heads\n[Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8]", x: 120, y: 60 },
              { id: "gqa", label: "GQA Grouping\nGroup 1: Q1-Q4 → KV1\nGroup 2: Q5-Q8 → KV2", x: 380, y: 60 },
              { id: "kv", label: "Reduced KV Cache\nOnly 2 KV heads in VRAM", x: 380, y: 180 },
              { id: "out", label: "Full Capacity Output\n8x Throughput Speedup", x: 620, y: 120 },
            ],
            edges: [
              { from: "q", to: "gqa", label: "assign groups" },
              { from: "kv", to: "gqa", label: "shared keys/values" },
              { from: "gqa", to: "out", label: "concatenate & project" },
            ],
            steps: [
              { id: "1", activeNodes: ["q", "gqa"], description: "Multiple query heads attend to clustered key-value groups" },
              { id: "2", activeNodes: ["kv", "gqa"], description: "KV-cache memory footprint reduced by 4x to 8x in GPU VRAM" },
              { id: "3", activeNodes: ["gqa", "out"], description: "Maintains strong reasoning benchmarks while enabling long context windows" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Multi-Head Attention & Grouped-Query Attention",
        content: `## Multi-Head & Grouped-Query Attention (GQA)

### 1. Multi-Head Attention (MHA)
**MHA(Q, K, V) = Concat(head_1, ..., head_h) * W_O**
**where head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)**

### 2. The KV-Cache Bottleneck in Production
During autoregressive token generation, the model must re-attend to all previous tokens. Storing Key and Value matrices for every layer and head quickly fills GPU VRAM.

### 3. Comparison of Attention Variants
| Type | Query Heads | Key/Value Heads | Memory Footprint | Used In |
|---|---|---|---|---|
| **MHA** | H | H | 100% (High) | GPT-4, original Transformer |
| **MQA** | H | 1 | ~12.5% (Very Low) | PaLM, StarCoder |
| **GQA** | H | G (e.g. H/8) | ~25% (Optimal) | **Llama 3, Mistral, DeepSeek** |`,
        explanation: "Understand why modern LLMs use Grouped-Query Attention to drastically accelerate inference throughput while minimizing GPU VRAM usage.",
      },
    },
    {
      title: "KV-Caching & Autoregressive Inference Optimization",
      description: "Learn how Large Language Models generate text token-by-token and why KV-Caching is the most critical inference optimization.",
      slug: "kv-caching-autoregressive-inference",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4, 5],
      concepts: [
        {
          title: "The Prefill vs Decode Phases",
          description: "Prefill Phase: Model processes the entire prompt in parallel (compute-bound, high GPU compute utilization). Decode Phase: Model generates tokens one-by-one autoregressively (memory-bandwidth bound, reading weights & KV cache on every single token step).",
        },
        {
          title: "How KV-Caching Works",
          description: "Without KV-caching, generating token N requires recomputing attention over all N-1 past tokens, leading to O(N^2) complexity per token. With KV-caching, past K and V projections are stored in memory; only the new token's Q, K, V are computed and appended in O(1) time.",
        },
        {
          title: "PagedAttention & vLLM Memory Management",
          description: "Traditional KV caches suffer from 60-80% memory fragmentation because sequences have dynamic lengths. PagedAttention (used in vLLM) treats KV cache memory like virtual memory pages, eliminating internal fragmentation and enabling massive batching.",
        },
      ],
      examples: [
        {
          title: "Autoregressive Generation with and without KV-Cache",
          description: "Simulating step-by-step KV cache updates during generation in Python",
          starterCode: `class KVCacheSimulator:
    def __init__(self):
        self.k_cache = []
        self.v_cache = []
        
    def step(self, new_q, new_k, new_v):
        # Append new_k and new_v to cache and compute attention for single new_q
        pass`,
          solutionCode: `import numpy as np

class KVCacheSimulator:
    def __init__(self, d_k=8):
        self.d_k = d_k
        self.k_cache = None
        self.v_cache = None
        
    def step(self, new_q, new_k, new_v):
        # new_q: [1, d_k], new_k: [1, d_k], new_v: [1, d_k]
        if self.k_cache is None:
            self.k_cache = new_k
            self.v_cache = new_v
        else:
            self.k_cache = np.concatenate([self.k_cache, new_k], axis=0)
            self.v_cache = np.concatenate([self.v_cache, new_v], axis=0)
            
        # Compute attention against cached history: [1, seq_len]
        scores = np.dot(new_q, self.k_cache.T) / np.sqrt(self.d_k)
        exp_s = np.exp(scores - np.max(scores))
        weights = exp_s / np.sum(exp_s)
        
        output = np.dot(weights, self.v_cache)
        return output, self.k_cache.shape[0]

sim = KVCacheSimulator(d_k=4)
# Simulate 5 consecutive token generation steps
for step_idx in range(5):
    q = np.random.randn(1, 4)
    k = np.random.randn(1, 4)
    v = np.random.randn(1, 4)
    out, current_context_len = sim.step(q, k, v)
    print(f"Step {step_idx+1}: Context length in KV cache = {current_context_len}, Output shape = {out.shape}")`,
        },
      ],
      exercises: [
        {
          title: "Implement Rolling Context Window Eviction in KV-Cache",
          description: "Write a KV-cache with a sliding window that evicts oldest tokens when exceeding max_tokens",
          instructions: "Implement step(new_q, new_k, new_v) such that if cached tokens > max_tokens, the oldest tokens are discarded while maintaining the latest tokens.",
          starterCode: `class SlidingWindowKVCache:
    def __init__(self, max_tokens=4, d_k=8):
        self.max_tokens = max_tokens
        self.d_k = d_k
        # Initialize cache
        pass`,
          solutionCode: `import numpy as np

class SlidingWindowKVCache:
    def __init__(self, max_tokens=4, d_k=8):
        self.max_tokens = max_tokens
        self.d_k = d_k
        self.k_cache = np.empty((0, d_k))
        self.v_cache = np.empty((0, d_k))
        
    def step(self, new_q, new_k, new_v):
        self.k_cache = np.vstack([self.k_cache, new_k])
        self.v_cache = np.vstack([self.v_cache, new_v])
        
        # Evict oldest if exceeding sliding window limit
        if len(self.k_cache) > self.max_tokens:
            self.k_cache = self.k_cache[-self.max_tokens:]
            self.v_cache = self.v_cache[-self.max_tokens:]
            
        scores = np.dot(new_q, self.k_cache.T) / np.sqrt(self.d_k)
        weights = np.exp(scores - np.max(scores)) / np.sum(np.exp(scores - np.max(scores)))
        return np.dot(weights, self.v_cache), len(self.k_cache)

cache = SlidingWindowKVCache(max_tokens=3, d_k=4)
for i in range(6):
    _, sz = cache.step(np.random.randn(1, 4), np.random.randn(1, 4), np.random.randn(1, 4))
    print(f"Token {i+1} added: Cache size capped at {sz}")`,
          testCases: "Cache size never exceeds max_tokens; Preserves most recent tokens; Calculates valid attention",
          hints: "Slice self.k_cache[-self.max_tokens:] whenever the array length exceeds max_tokens.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Autoregressive Generation with KV-Cache",
          config: JSON.stringify({
            nodes: [
              { id: "token", label: "New Token N\n(Prompt or Generated)", x: 80, y: 60 },
              { id: "proj", label: "Compute Q_N, K_N, V_N\nOnly for single token", x: 260, y: 60 },
              { id: "cache", label: "KV-Cache Table\n[K_1..N-1, V_1..N-1]", x: 260, y: 180 },
              { id: "attn", label: "Attend Q_N to [K_cache, K_N]\nO(1) Compute", x: 470, y: 120 },
              { id: "next", label: "Sample Next Token N+1\nAppend to sequence", x: 670, y: 120 },
            ],
            edges: [
              { from: "token", to: "proj", label: "input" },
              { from: "proj", to: "cache", label: "append K_N, V_N" },
              { from: "proj", to: "attn", label: "Q_N" },
              { from: "cache", to: "attn", label: "all past K, V" },
              { from: "attn", to: "next", label: "logits → sample" },
              { from: "next", to: "token", label: "loop to next step" },
            ],
            steps: [
              { id: "1", activeNodes: ["token", "proj"], description: "New token projected to Query, Key, and Value vectors" },
              { id: "2", activeNodes: ["proj", "cache"], description: "Key and Value appended directly to GPU VRAM KV-Cache" },
              { id: "3", activeNodes: ["attn", "next"], description: "Attention computed against cached history in O(1) time and next token sampled" },
            ],
          }),
        },
      ],
      lesson: {
        title: "KV-Caching & Autoregressive Inference Optimization",
        content: `## KV-Caching & Autoregressive Inference Optimization

### 1. The Inference Asymmetry
- **Prefill (Prompt Processing)**: Parallel matrix-matrix multiplication ($Q, K, V$ for all prompt tokens simultaneously). Fast and compute-heavy.
- **Decoding (Token Generation)**: Sequential token-by-token generation. Memory-bandwidth bound.

### 2. Time Complexity: Without Cache vs With Cache
- **Without KV Cache**: $\\mathcal{O}(N^2)$ calculations per step, recalculating all past tokens. Total time for $N$ tokens = $\\mathcal{O}(N^3)$.
- **With KV Cache**: $\\mathcal{O}(N)$ calculations per step (attending $Q_{\\text{current}}$ to cached $K$). Total time for $N$ tokens = $\\mathcal{O}(N^2)$.

### 3. PagedAttention
vLLM introduced **PagedAttention**, dividing the KV cache into fixed-size physical blocks (pages), allowing non-contiguous allocation in VRAM, eliminating fragmentation and boosting concurrency by 2x-4x.`,
        explanation: "Master the mechanics of KV caching, why text generation is memory-bandwidth bound, and how modern engines optimize inference.",
      },
    },
  ],
};
