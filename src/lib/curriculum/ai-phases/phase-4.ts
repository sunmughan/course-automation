// Phase 4: Retrieval-Augmented Generation (RAG) Architecture
export const aiPhase4 = {
  title: "Phase 4: Retrieval-Augmented Generation (RAG) Architecture",
  description: "Master document ingestion, semantic chunking, dense vector databases, hybrid search (BM25 + Dense), cross-encoder re-ranking, and modular/agentic RAG pipelines.",
  slug: "phase-4-rag-architecture",
  topics: [
    {
      title: "Document Ingestion & Semantic Chunking Strategies",
      description: "Learn recursive character splitting, semantic similarity chunking, document hierarchy preservation, and metadata enrichment.",
      slug: "document-ingestion-semantic-chunking",
      difficulty: 3,
      prerequisites: [0, 1, 2],
      concepts: [
        {
          title: "The Chunking Dilemma (Granularity vs Context)",
          description: "Chunks too small lose context and semantic nuance. Chunks too large introduce irrelevant noise and dilute retrieval precision. Overlap (typically 10-20%) ensures sentences split across boundaries are not severed.",
        },
        {
          title: "Recursive Character vs Semantic Chunking",
          description: "Recursive splitting tries paragraph breaks (\n\n), then line breaks (\n), then spaces ( ), then characters. Semantic chunking computes embedding differences between adjacent sentences and splits when semantic distance exceeds a threshold.",
        },
        {
          title: "Contextual Metadata Enrichment",
          description: "Attaching metadata (source file, section header, creation date, summary keywords) to each chunk enables hybrid filtering and improves retrieval relevance.",
        },
      ],
      examples: [
        {
          title: "Semantic Distance Sentence Chunker in Python",
          description: "Splitting text into chunks based on embedding similarity drops between adjacent sentences",
          starterCode: `import numpy as np

def semantic_chunk_text(sentences, embeddings, similarity_threshold=0.6):
    # Group sentences whose consecutive cosine similarity stays above threshold
    pass`,
          solutionCode: `import numpy as np

def cosine_sim(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def semantic_chunk_text(sentences, embeddings, similarity_threshold=0.6):
    chunks = []
    current_chunk = [sentences[0]]
    
    for i in range(len(sentences) - 1):
        sim = cosine_sim(embeddings[i], embeddings[i + 1])
        if sim >= similarity_threshold:
            current_chunk.append(sentences[i + 1])
        else:
            # Semantic topic shift detected -> start new chunk
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentences[i + 1]]
            
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks

# Test
sents = [
    "Python is a versatile programming language.",
    "It is widely used in data science and machine learning.",
    "The solar system consists of eight major planets.",
    "Jupiter is the largest planet in our solar system.",
]
# Mock embeddings (sentences 0,1 are tech; 2,3 are astronomy)
embeds = [
    np.array([0.9, 0.1, 0.0]),
    np.array([0.88, 0.12, 0.05]),
    np.array([0.0, 0.85, 0.2]),
    np.array([0.05, 0.9, 0.15]),
]
result_chunks = semantic_chunk_text(sents, embeds, similarity_threshold=0.5)
print("Generated Semantic Chunks:\\n", result_chunks)`,
        },
      ],
      exercises: [
        {
          title: "Implement Sliding Window Chunker with Token Overlap",
          description: "Write a token-aware sliding window chunker with configurable chunk_size and chunk_overlap",
          instructions: "Create sliding_window_chunk(text, chunk_size=100, chunk_overlap=20) that returns a list of overlapping text chunks.",
          starterCode: `def sliding_window_chunk(text, chunk_size=10, chunk_overlap=2):
    # Split by whitespace into words and return sliding windows
    pass`,
          solutionCode: `def sliding_window_chunk(text, chunk_size=10, chunk_overlap=2):
    words = text.split()
    if not words:
        return []
    step = chunk_size - chunk_overlap
    if step <= 0:
        raise ValueError("chunk_overlap must be less than chunk_size")
        
    chunks = []
    for i in range(0, len(words), step):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        if i + chunk_size >= len(words):
            break
    return chunks

sample_text = "The quick brown fox jumps over the lazy dog and runs through the forest with great speed and energy."
chunks = sliding_window_chunk(sample_text, chunk_size=8, chunk_overlap=2)
for idx, c in enumerate(chunks):
    print(f"Chunk {idx+1}: {c}")`,
          testCases: "Chunks overlap by exact word count; Last chunk captures remaining text; Handles empty input safely",
          hints: "Step forward by chunk_size - chunk_overlap on each iteration.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Semantic Chunking & Metadata Pipeline",
          config: JSON.stringify({
            nodes: [
              { id: "doc", label: "Raw Document\n(PDF / Markdown / HTML)", x: 80, y: 100 },
              { id: "split", label: "Semantic Splitter\nDetects topic boundaries", x: 260, y: 100 },
              { id: "meta", label: "Metadata Enrichment\n{file, section, timestamp}", x: 440, y: 100 },
              { id: "chunks", label: "Optimized Chunks\nReady for Vector Store", x: 620, y: 100 },
            ],
            edges: [
              { from: "doc", to: "split", label: "clean text" },
              { from: "split", to: "meta", label: "coherent passages" },
              { from: "meta", to: "chunks", label: "payloads" },
            ],
            steps: [
              { id: "1", activeNodes: ["doc", "split"], description: "Raw documents ingested and parsed into clean paragraphs" },
              { id: "2", activeNodes: ["split", "meta"], description: "Semantic boundary analysis groups related sentences and avoids abrupt cuts" },
              { id: "3", activeNodes: ["meta", "chunks"], description: "Chunks tagged with rich metadata for downstream hybrid search" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Document Ingestion & Semantic Chunking Strategies",
        content: `## Ingestion & Chunking Strategies in RAG

A RAG system is only as good as the chunks it retrieves.

### 1. Common Chunking Strategies
- **Fixed-Size Chunking**: Simple token windows with overlap.
- **Recursive Character Splitting**: Respects markdown headings and paragraph boundaries.
- **Semantic Chunking**: Computes moving average embeddings and cuts when distance spikes.
- **Document-Aware Chunking**: Preserves tables, code blocks, and hierarchical trees.

### 2. Contextual Retrieval (Anthropic Strategy)
Before vectorizing, prepend each chunk with a 50-word AI-generated summary of its place within the full document. This prevents isolated chunks from losing their parent subject context!`,
        explanation: "Master the algorithms and data preparation techniques that determine the quality of RAG knowledge bases.",
      },
    },
    {
      title: "Vector Databases, HNSW Indexing & Hybrid Search (BM25 + Dense)",
      description: "Explore Hierarchical Navigable Small World (HNSW) graphs, IVF-PQ, Pinecone, Chroma, pgvector, and Hybrid Search with Reciprocal Rank Fusion (RRF).",
      slug: "vector-databases-hybrid-search-rrf",
      difficulty: 3,
      prerequisites: [0, 1, 2, 3],
      concepts: [
        {
          title: "Approximate Nearest Neighbor (ANN) & HNSW",
          description: "Exact brute-force search is O(N * D), which is too slow for millions of vectors. HNSW constructs multi-layer proximity graphs where top layers take long exploratory leaps and bottom layers fine-tune local search in O(log N) time.",
        },
        {
          title: "Dense vs Sparse Retrieval (BM25)",
          description: "Dense Embeddings excel at conceptual/semantic intent ('how to fix car engine'). Sparse BM25 keyword search excels at exact keywords, SKU codes, acronyms, and error codes ('Error 0x80070005').",
        },
        {
          title: "Reciprocal Rank Fusion (RRF)",
          description: "RRF merges ranked results from dense vector search and sparse BM25: Score(d) = ∑ (1 / (k + rank_i(d))), typically with k=60. It normalizes distinct score scales without fragile hyperparameter tuning.",
        },
      ],
      examples: [
        {
          title: "Reciprocal Rank Fusion (RRF) Hybrid Search in Python",
          description: "Fusing dense semantic search results with sparse keyword results",
          starterCode: `def reciprocal_rank_fusion(dense_rankings, sparse_rankings, k=60):
    # Combine ranks using RRF formula
    pass`,
          solutionCode: `from collections import defaultdict

def reciprocal_rank_fusion(dense_rankings, sparse_rankings, k=60):
    # dense_rankings: list of doc_ids in ranked order
    # sparse_rankings: list of doc_ids in ranked order
    rrf_scores = defaultdict(float)
    
    for rank, doc_id in enumerate(dense_rankings):
        rrf_scores[doc_id] += 1.0 / (k + rank + 1)
        
    for rank, doc_id in enumerate(sparse_rankings):
        rrf_scores[doc_id] += 1.0 / (k + rank + 1)
        
    # Sort by descending RRF score
    sorted_docs = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    return sorted_docs

# Test hybrid rankings
dense_results = ["doc_A", "doc_B", "doc_C", "doc_D"]
sparse_results = ["doc_C", "doc_A", "doc_E", "doc_B"]

fused = reciprocal_rank_fusion(dense_results, sparse_results, k=60)
print("Hybrid RRF Rankings:")
for doc, score in fused:
    print(f"  {doc}: {score:.4f}")`,
        },
      ],
      exercises: [
        {
          title: "Implement In-Memory Vector Store with Cosine Search",
          description: "Build an in-memory vector database supporting insert and top-k query with metadata filtering",
          instructions: "Create class VectorStore with add(id, vector, metadata) and query(query_vector, top_k=2, filter_dict=None).",
          starterCode: `import numpy as np

class VectorStore:
    def __init__(self):
        self.vectors = {}
        self.metadata = {}
        
    def add(self, doc_id, vector, meta=None):
        pass
        
    def query(self, query_vec, top_k=2, filter_meta=None):
        pass`,
          solutionCode: `import numpy as np

class VectorStore:
    def __init__(self):
        self.vectors = {}
        self.metadata = {}
        
    def add(self, doc_id, vector, meta=None):
        self.vectors[doc_id] = vector / np.linalg.norm(vector)
        self.metadata[doc_id] = meta or {}
        
    def query(self, query_vec, top_k=2, filter_meta=None):
        q_norm = query_vec / np.linalg.norm(query_vec)
        results = []
        for doc_id, v in self.vectors.items():
            # Check metadata filter if provided
            if filter_meta:
                match = all(self.metadata[doc_id].get(k) == v for k, v in filter_meta.items())
                if not match:
                    continue
            sim = float(np.dot(q_norm, v))
            results.append((doc_id, sim, self.metadata[doc_id]))
            
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

db = VectorStore()
db.add("1", np.array([1.0, 0.0]), {"topic": "AI"})
db.add("2", np.array([0.0, 1.0]), {"topic": "Web"})
db.add("3", np.array([0.8, 0.2]), {"topic": "AI"})

print("Top AI matches:", db.query(np.array([1.0, 0.1]), top_k=2, filter_meta={"topic": "AI"}))`,
          testCases: "Normalizes vectors; Applies metadata filter; Returns top_k highest cosine similarity items",
          hints: "Iterate through items, verify metadata matches, compute dot product, and sort descending.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Hybrid Search (Dense + Sparse) & RRF Fusion",
          config: JSON.stringify({
            nodes: [
              { id: "q", label: "User Query", x: 80, y: 110 },
              { id: "dense", label: "Dense Embeddings\nVector Search (HNSW)", x: 260, y: 50 },
              { id: "sparse", label: "Sparse BM25\nKeyword Index", x: 260, y: 170 },
              { id: "rrf", label: "Reciprocal Rank Fusion\nScore = ∑ 1/(k + rank)", x: 460, y: 110 },
              { id: "out", label: "Fused Top-K Passages", x: 640, y: 110 },
            ],
            edges: [
              { from: "q", to: "dense", label: "vectorize" },
              { from: "q", to: "sparse", label: "tokenize" },
              { from: "dense", to: "rrf", label: "semantic ranks" },
              { from: "sparse", to: "rrf", label: "keyword ranks" },
              { from: "rrf", to: "out", label: "combined list" },
            ],
            steps: [
              { id: "1", activeNodes: ["q", "dense", "sparse"], description: "Query sent concurrently to dense vector database and sparse BM25 engine" },
              { id: "2", activeNodes: ["dense", "sparse", "rrf"], description: "Both ranked result sets fused via Reciprocal Rank Fusion" },
              { id: "3", activeNodes: ["rrf", "out"], description: "High-precision fused context prepared for cross-encoder reranking" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Vector Databases, HNSW Indexing & Hybrid Search (BM25 + Dense)",
        content: `## Vector Search & Hybrid Retrieval

### 1. Vector Databases
- **Pinecone**: Fully managed, high concurrency serverless vector DB.
- **ChromaDB**: Lightweight in-memory/embedded vector store for local prototyping.
- **pgvector**: PostgreSQL extension adding vector indexing to existing relational databases.
- **Qdrant / Milvus**: Distributed, high-performance vector search engines.

### 2. Reciprocal Rank Fusion (RRF)
**RRF Score(d in D) = Sum_{m in M} [ 1 / (k + r_m(d)) ]**

Where r_m(d) is document d's rank in ranking system m, and k ~ 60.

Hybrid Search combining Dense + BM25 outperforms purely dense search by 15-30% on enterprise benchmark datasets!`,
        explanation: "Master vector database mechanics, HNSW graphs, and how to combine semantic and keyword search via Reciprocal Rank Fusion.",
      },
    },
    {
      title: "Re-ranking, Context Compression & Advanced Agentic RAG",
      description: "Learn Cross-Encoder re-ranking (Cohere Rerank, BGE-Reranker), context compression, Lost-in-the-Middle mitigation, and Self-RAG / Corrective RAG (CRAG).",
      slug: "reranking-context-compression-agentic-rag",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4],
      concepts: [
        {
          title: "Bi-Encoders vs Cross-Encoders",
          description: "Bi-encoders compute vector embeddings for query and document independently (fast, O(1) comparison via dot product, but misses subtle token interactions). Cross-encoders feed the query and document together through full attention layers (slower, but drastically higher accuracy). In production, bi-encoders retrieve top 50; cross-encoders rerank to top 5.",
        },
        {
          title: "Lost-in-the-Middle & Context Packing",
          description: "LLMs pay highest attention to information at the very beginning and very end of their prompt context window, often ignoring facts buried in the middle. Strategic context packing places most critical retrieved evidence at the start and end.",
        },
        {
          title: "Self-RAG & Corrective RAG (CRAG)",
          description: "Agentic RAG evaluates whether retrieval was necessary, assesses if retrieved documents are actually relevant, and if not, triggers web fallback search or query reformulation before generating an answer.",
        },
      ],
      examples: [
        {
          title: "Two-Stage Retrieval & Cross-Encoder Reranker Pipeline",
          description: "Simulating bi-encoder retrieval followed by cross-encoder re-ranking in Python",
          starterCode: `def two_stage_rag(query, candidate_docs, cross_encoder_fn, top_k=3):
    # Score query-doc pairs with cross encoder and return top_k
    pass`,
          solutionCode: `def mock_cross_encoder(query, doc):
    # Simulates cross-encoder deep interaction scoring (0.0 to 1.0)
    q_words = set(query.lower().split())
    d_words = set(doc.lower().split())
    overlap = len(q_words.intersection(d_words)) / max(1, len(q_words))
    # Bonus for exact key phrase match
    if "jwt" in query.lower() and "jwt" in doc.lower():
        overlap += 0.4
    return min(1.0, overlap)

def two_stage_rag(query, candidate_docs, cross_encoder_fn, top_k=2):
    # Stage 1: candidates retrieved from vector store (e.g. top 10)
    # Stage 2: Cross-encoder re-ranks
    scored = []
    for doc in candidate_docs:
        score = cross_encoder_fn(query, doc)
        scored.append((doc, score))
        
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]

docs = [
    "Introduction to cookie sessions in Express.js",
    "How to securely sign and verify JSON Web Tokens (JWT) in Node.js",
    "Database indexing strategies for PostgreSQL",
    "Authentication middleware using JWT bearer headers",
]

reranked = two_stage_rag("How do I authenticate with JWT tokens?", docs, mock_cross_encoder, top_k=2)
print("Top Reranked Passages:")
for d, s in reranked:
    print(f"  [Score: {s:.2f}] {d}")`,
        },
      ],
      exercises: [
        {
          title: "Build a Corrective RAG (CRAG) Decision Router",
          description: "Write an evaluator that grades retrieved document relevance and routes to direct generation vs web search",
          instructions: "Implement evaluate_retrieval(query, retrieved_docs, confidence_threshold=0.7) returning 'generate' | 'rewrite_and_search' | 'fallback_web'.",
          starterCode: `def evaluate_retrieval(query, retrieved_docs, threshold=0.7):
    # Grade relevance and decide next RAG action
    pass`,
          solutionCode: `def evaluate_retrieval(query, retrieved_docs, threshold=0.7):
    if not retrieved_docs:
        return "fallback_web"
        
    # Check relevance overlap
    q_tokens = set(query.lower().split())
    doc_text = " ".join(retrieved_docs).lower()
    matches = sum(1 for t in q_tokens if t in doc_text)
    relevance_ratio = matches / max(1, len(q_tokens))
    
    if relevance_ratio >= threshold:
        return "generate"
    elif relevance_ratio >= 0.3:
        return "rewrite_and_search"
    else:
        return "fallback_web"

print("High match:", evaluate_retrieval("Node.js streams pipe", ["Learn how streams pipe data in Node.js"]))
print("No match:", evaluate_retrieval("Python asyncio event loop", ["Recipe for chocolate cake"]))`,
          testCases: "Returns generate for high relevance; Returns rewrite_and_search for partial match; Returns fallback_web for irrelevant docs",
          hints: "Compare token overlap ratio against threshold and intermediate boundaries.",
          difficulty: 4,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Two-Stage Retrieval & Corrective Agentic RAG",
          config: JSON.stringify({
            nodes: [
              { id: "q", label: "User Query", x: 80, y: 120 },
              { id: "bi", label: "Stage 1: Bi-Encoder\nRetrieve Top 50 Candidates", x: 260, y: 50 },
              { id: "cross", label: "Stage 2: Cross-Encoder\nRerank to Top 5", x: 440, y: 50 },
              { id: "eval", label: "Relevance Evaluator\nRelevant? Score > 0.8", x: 440, y: 180 },
              { id: "gen", label: "LLM Generation with Citations", x: 640, y: 120 },
              { id: "web", label: "Web Fallback Search", x: 260, y: 220 },
            ],
            edges: [
              { from: "q", to: "bi", label: "vector query" },
              { from: "bi", to: "cross", label: "top 50" },
              { from: "cross", to: "eval", label: "top 5" },
              { from: "eval", to: "gen", label: "yes: context" },
              { from: "eval", to: "web", label: "no: fall back" },
              { from: "web", to: "gen", label: "fresh search results" },
            ],
            steps: [
              { id: "1", activeNodes: ["q", "bi"], description: "Bi-encoder conducts broad, fast vector search retrieving top 50 passages" },
              { id: "2", activeNodes: ["bi", "cross", "eval"], description: "Cross-encoder performs deep attention re-ranking and validates context relevance" },
              { id: "3", activeNodes: ["eval", "gen"], description: "Validated, deduplicated context fed to LLM for cited, hallucination-free generation" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Re-ranking, Context Compression & Advanced Agentic RAG",
        content: `## Advanced & Agentic RAG Systems

### 1. Two-Stage Retrieval Architecture
1. **Stage 1 (Bi-Encoder Retrieval)**: Fast ANN search in vector DB (e.g. retrieve top 50–100 items).
2. **Stage 2 (Cross-Encoder Re-ranking)**: Full attention over (Query, Document) pairs using models like Cohere Rerank or BGE-Reranker-Large to select top 3–5 items.

### 2. Self-RAG & Corrective RAG (CRAG)
Modern enterprise RAG systems use self-reflection tokens:
- **[IS_RETRIEVAL_NEEDED]**: Determine whether parametric knowledge suffices.
- **[IS_RELEVANT]**: Verify whether retrieved documents actually address the query.
- **[IS_SUPPORTED]**: Check that every generated claim is supported by citations (hallucination check).`,
        explanation: "Master two-stage retrieval architectures, cross-encoder re-ranking, and self-correcting agentic RAG workflows.",
      },
    },
  ],
};
