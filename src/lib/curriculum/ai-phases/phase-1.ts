// Phase 1: AI, Machine Learning & Neural Network Fundamentals
export const aiPhase1 = {
  title: "Phase 1: AI, Machine Learning & Neural Network Fundamentals",
  description: "Master mathematical foundations, machine learning taxonomy, perceptrons, multi-layer neural networks, backpropagation, and word representations from the ground up.",
  slug: "phase-1-ai-ml-fundamentals",
  topics: [
    {
      title: "Mathematics & Tensors for AI",
      description: "Understand vectors, matrices, multidimensional tensors, dot products, matrix multiplication, and gradient calculus for neural networks.",
      slug: "math-tensors-for-ai",
      difficulty: 2,
      prerequisites: [],
      concepts: [
        {
          title: "Vectors, Matrices & Multidimensional Tensors",
          description: "A scalar is 0D (single number). A vector is 1D (array of numbers, e.g. a word embedding). A matrix is 2D (table of rows & columns, e.g. weights). A tensor is an N-dimensional generalization. In PyTorch and NumPy, batches of text or image activations are represented as 3D or 4D tensors (e.g., [batch_size, sequence_length, embedding_dim]).",
        },
        {
          title: "Dot Product & Cosine Similarity",
          description: "The dot product measures the alignment between two vectors: A · B = ∑ (A_i * B_i). Cosine similarity normalizes the dot product by vector magnitudes: cos(θ) = (A · B) / (||A|| * ||B||), producing a score between -1 and +1. It is the fundamental metric used in vector search, semantic embeddings, and attention calculation.",
        },
        {
          title: "Partial Derivatives & Gradients",
          description: "The gradient ∇f is a vector of partial derivatives pointing in the direction of steepest ascent. In training, gradient descent moves in the opposite direction (-∇L) to minimize the loss function. The Chain Rule allows computing derivatives through nested composite functions across layers.",
        },
      ],
      examples: [
        {
          title: "Tensor Operations and Vector Similarity in Python",
          description: "Building vector dot products and cosine similarity from scratch with NumPy",
          starterCode: `import numpy as np

def cosine_similarity(v1, v2):
    # Calculate dot product and vector norms
    pass

def matrix_multiply(A, B):
    # Implement matrix multiplication
    pass`,
          solutionCode: `import numpy as np

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def matrix_multiply(A, B):
    return np.matmul(A, B)

# Demonstrating semantic vector similarity
vec_king = np.array([0.9, 0.2, 0.8])
vec_queen = np.array([0.88, 0.25, 0.78])
vec_apple = np.array([0.1, 0.9, 0.15])

print("King vs Queen similarity:", round(cosine_similarity(vec_king, vec_queen), 4))
print("King vs Apple similarity:", round(cosine_similarity(vec_king, vec_apple), 4))`,
        },
      ],
      exercises: [
        {
          title: "Implement Batch Cosine Similarity Matrix",
          description: "Calculate pairwise cosine similarity between query embeddings and document embeddings",
          instructions: "Given a 2D array of query embeddings Q and document embeddings D, compute normalized pairwise similarity matrix S where S[i,j] is similarity between Q[i] and D[j].",
          starterCode: `import numpy as np

def batch_cosine_similarity(queries, documents):
    # Normalize queries and documents along axis=1
    # Compute dot product matrix
    pass`,
          solutionCode: `import numpy as np

def batch_cosine_similarity(queries, documents):
    q_norm = queries / np.linalg.norm(queries, axis=1, keepdims=True)
    d_norm = documents / np.linalg.norm(documents, axis=1, keepdims=True)
    return np.dot(q_norm, d_norm.T)

# Test with 2 queries and 3 docs
Q = np.array([[1.0, 0.0], [0.0, 1.0]])
D = np.array([[1.0, 0.0], [0.7, 0.7], [0.0, 1.0]])
sim = batch_cosine_similarity(Q, D)
print("Pairwise similarity matrix:\\n", sim)`,
          testCases: "Correct similarity matrix shape; Normalizes vectors properly; Diagonal matches identical vectors; Range between -1.0 and 1.0",
          hints: "Divide by np.linalg.norm with keepdims=True, then use matrix multiplication dot(Q_norm, D_norm.T).",
          difficulty: 2,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Vector Dot Product & Cosine Similarity Flow",
          config: JSON.stringify({
            nodes: [
              { id: "v1", label: "Vector A\n[1.0, 0.0, 0.5]", x: 80, y: 50 },
              { id: "v2", label: "Vector B\n[0.8, 0.2, 0.4]", x: 80, y: 160 },
              { id: "dot", label: "Dot Product\n∑(A_i * B_i)", x: 260, y: 105 },
              { id: "norms", label: "Norms\n||A|| · ||B||", x: 260, y: 220 },
              { id: "cos", label: "Cosine Sim\nDot / Norms", x: 420, y: 160 },
              { id: "score", label: "Similarity Score\n0.97 (High Match)", x: 580, y: 160 },
            ],
            edges: [
              { from: "v1", to: "dot", label: "multiply elements" },
              { from: "v2", to: "dot", label: "multiply elements" },
              { from: "v1", to: "norms", label: "magnitude" },
              { from: "v2", to: "norms", label: "magnitude" },
              { from: "dot", to: "cos", label: "numerator" },
              { from: "norms", to: "cos", label: "denominator" },
              { from: "cos", to: "score", label: "result" },
            ],
            steps: [
              { id: "s1", activeNodes: ["v1", "v2"], description: "Input vectors loaded from embedding space" },
              { id: "s2", activeNodes: ["dot", "norms"], description: "Element-wise multiplication and L2 norm computation" },
              { id: "s3", activeNodes: ["cos"], description: "Dividing dot product by product of magnitudes" },
              { id: "s4", activeNodes: ["score"], description: "Final cosine similarity score evaluated for semantic retrieval" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Mathematics & Tensors for AI",
        content: `## Mathematics & Tensors for AI

Artificial Intelligence and Large Language Models represent everything — words, sentences, images, audio — as **numeric vectors and tensors**.

### 1. The Tensor Hierarchy
\`\`\`
0D Scalar: 42
1D Vector: [0.12, -0.45, 0.89] (e.g. Word Embedding)
2D Matrix: [[0.1, 0.2], [0.3, 0.4]] (e.g. Weight Matrix)
3D Tensor: [Batch, Sequence_Length, Hidden_Dim] (e.g. Transformer Activation)
\`\`\`

### 2. Dot Product & Cosine Similarity
When comparing two word or document vectors:
**Cosine Similarity(u, v) = (u · v) / (||u|| * ||v||) = Sum(u_i * v_i) / (sqrt(Sum(u_i^2)) * sqrt(Sum(v_i^2)))**

- **+1.0**: Identical direction (synonyms / highly related)
- **0.0**: Orthogonal (completely unrelated)
- **-1.0**: Opposite direction

### 3. Gradients and Optimization
Neural networks learn by adjusting weights W against a loss L:
**W_new = W_old - eta * Grad_W(L)**
where eta is the learning rate.`,
        explanation: "This lesson establishes the foundational linear algebra, vector spaces, and calculus required to master neural networks and LLMs.",
      },
    },
    {
      title: "Machine Learning Taxonomy & Training Dynamics",
      description: "Explore Supervised, Unsupervised, and Reinforcement Learning, Loss Functions, Overfitting, and Regularization.",
      slug: "ml-taxonomy-training-dynamics",
      difficulty: 2,
      prerequisites: [0],
      concepts: [
        {
          title: "Supervised vs Unsupervised vs Reinforcement Learning",
          description: "Supervised: learns from labeled pairs (X → Y). Unsupervised: discovers latent patterns without labels (Clustering, PCA, Autoencoders). Reinforcement: agent interacts with environment receiving rewards/penalties to maximize cumulative return (Q-learning, Policy Gradients, PPO used in RLHF).",
        },
        {
          title: "The Bias-Variance Tradeoff & Overfitting",
          description: "High Bias (Underfitting): model is too simplistic to capture underlying patterns. High Variance (Overfitting): model memorizes training noise and fails to generalize to test data. Solutions include Dropout, Weight Decay (L2), Early Stopping, and Data Augmentation.",
        },
        {
          title: "Common Loss Functions",
          description: "Mean Squared Error (MSE) for regression. Cross-Entropy Loss for multi-class classification and next-token prediction in LLMs. Binary Cross-Entropy for boolean decisions. Contrastive / InfoNCE Loss for embedding models.",
        },
      ],
      examples: [
        {
          title: "Cross-Entropy Loss and Softmax Implementation",
          description: "Implementing numerically stable Softmax and Cross-Entropy in Python",
          starterCode: `import numpy as np

def softmax(logits):
    # Numerically stable softmax
    pass

def cross_entropy_loss(probabilities, target_index):
    # Calculate negative log likelihood
    pass`,
          solutionCode: `import numpy as np

def softmax(logits):
    # Subtract max for numerical stability
    exp_shifted = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp_shifted / np.sum(exp_shifted, axis=-1, keepdims=True)

def cross_entropy_loss(probabilities, target_index):
    epsilon = 1e-15
    prob = np.clip(probabilities[target_index], epsilon, 1 - epsilon)
    return -np.log(prob)

logits = np.array([2.0, 1.0, 0.1])
probs = softmax(logits)
loss = cross_entropy_loss(probs, target_index=0)

print("Probabilities:", np.round(probs, 4))
print("Cross-Entropy Loss (target=0):", round(loss, 4))`,
        },
      ],
      exercises: [
        {
          title: "Calculate Train/Test Generalization Gap",
          description: "Write a function to detect whether a model is underfitting, overfitting, or well-generalized",
          instructions: "Given training loss and validation loss histories, determine the model regime and optimal early stopping epoch.",
          starterCode: `def analyze_training_dynamics(train_losses, val_losses):
    # Return dictionary with status ('overfitting' | 'underfitting' | 'good') and best_epoch
    pass`,
          solutionCode: `def analyze_training_dynamics(train_losses, val_losses):
    best_epoch = int(val_losses.index(min(val_losses)))
    final_train = train_losses[-1]
    final_val = val_losses[-1]
    
    if final_train > 0.5 and final_val > 0.5:
        status = "underfitting"
    elif final_val - final_train > 0.3:
        status = "overfitting"
    else:
        status = "good"
        
    return {"status": status, "best_epoch": best_epoch, "min_val_loss": min(val_losses)}

print(analyze_training_dynamics([0.8, 0.6, 0.4, 0.2, 0.1], [0.85, 0.65, 0.5, 0.6, 0.75]))`,
          testCases: "Identifies early stopping epoch correctly; Detects validation divergence (overfitting); Handles monotonically decreasing losses",
          hints: "Find the index of the minimum validation loss and compare the gap between final train and val losses.",
          difficulty: 2,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Machine Learning Training & Loss Minimization",
          config: JSON.stringify({
            nodes: [
              { id: "batch", label: "Mini-Batch X, Y", x: 80, y: 60 },
              { id: "forward", label: "Model Forward Pass\nŷ = f(X, W)", x: 250, y: 60 },
              { id: "loss", label: "Loss Calculation\nL(ŷ, Y)", x: 420, y: 60 },
              { id: "backward", label: "Backpropagation\nCompute ∇_W L", x: 420, y: 180 },
              { id: "optimizer", label: "Optimizer Step\nW = W - η·∇L", x: 250, y: 180 },
              { id: "eval", label: "Validation Check\nEarly Stopping", x: 80, y: 180 },
            ],
            edges: [
              { from: "batch", to: "forward", label: "input" },
              { from: "forward", to: "loss", label: "predictions ŷ" },
              { from: "loss", to: "backward", label: "error signal" },
              { from: "backward", to: "optimizer", label: "gradients" },
              { from: "optimizer", to: "eval", label: "updated weights" },
              { from: "eval", to: "batch", label: "next epoch" },
            ],
            steps: [
              { id: "1", activeNodes: ["batch", "forward"], description: "Forward pass: computing predictions from inputs and weights" },
              { id: "2", activeNodes: ["loss"], description: "Loss function quantifies distance between predictions and actual labels" },
              { id: "3", activeNodes: ["backward", "optimizer"], description: "Backpropagation propagates errors backward to update parameters" },
              { id: "4", activeNodes: ["eval"], description: "Validation check ensures generalization and prevents overfitting" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Machine Learning Taxonomy & Training Dynamics",
        content: `## Machine Learning Taxonomy & Training Dynamics

### 1. Three Core Paradigms
- **Supervised Learning**: Model learns a mapping $f(X) \\to Y$ from labeled data.
- **Unsupervised Learning**: Model discovers latent structure $p(X)$ without ground-truth labels.
- **Reinforcement Learning**: Agent interacts with environment taking actions $a$ in states $s$ to maximize reward $r$.

### 2. Loss Functions
For Language Models, the dominant loss is **Cross-Entropy Loss** over token vocabulary $V$:
$$\\mathcal{L}_{\\text{CE}} = -\\sum_{i=1}^{|V|} y_i \\log(p_i) = -\\log(p_{\\text{target}})$$

### 3. Regularization Techniques
- **L2 Regularization (Weight Decay)**: Penalizes large weights to prevent reliance on single features.
- **Dropout**: Randomly zeroes activations during training to build redundancy.
- **Early Stopping**: Halts training when validation loss stops improving.`,
        explanation: "Understand the core learning paradigms, loss metrics, and techniques to prevent overfitting in deep learning.",
      },
    },
    {
      title: "Neural Networks & Backpropagation from Scratch",
      description: "Build artificial neurons, activation functions (ReLU, GELU, Sigmoid), multi-layer perceptrons (MLP), and backpropagation.",
      slug: "neural-networks-backpropagation",
      difficulty: 3,
      prerequisites: [0, 1],
      concepts: [
        {
          title: "Artificial Neuron (Perceptron)",
          description: "A neuron computes an affine transformation followed by non-linear activation: z = W · X + b; a = σ(z). Without non-linear activation functions, stacking multiple layers would collapse into a single linear transformation.",
        },
        {
          title: "Modern Activation Functions",
          description: "Sigmoid & Tanh: prone to vanishing gradients for deep networks. ReLU (Rectified Linear Unit): max(0, z), fast and mitigates vanishing gradient. GELU (Gaussian Error Linear Unit): smooth probabilistic activation used in modern Transformers (GPT, BERT, Llama).",
        },
        {
          title: "Backpropagation via the Chain Rule",
          description: "Backpropagation calculates the derivative of the loss with respect to every parameter: ∂L/∂W = (∂L/∂a) * (∂a/∂z) * (∂z/∂W). Gradients flow backward from output to input layer, enabling efficient gradient descent.",
        },
      ],
      examples: [
        {
          title: "Multi-Layer Perceptron (MLP) from Scratch",
          description: "Complete 2-layer neural network with forward pass and backpropagation in NumPy",
          starterCode: `import numpy as np

class MLP:
    def __init__(self, input_dim, hidden_dim, output_dim):
        # Initialize weights and biases
        pass
        
    def forward(self, X):
        pass
        
    def backward(self, X, y, y_hat, lr=0.01):
        pass`,
          solutionCode: `import numpy as np

class MLP:
    def __init__(self, input_dim, hidden_dim, output_dim):
        self.W1 = np.random.randn(input_dim, hidden_dim) * 0.1
        self.b1 = np.zeros((1, hidden_dim))
        self.W2 = np.random.randn(hidden_dim, output_dim) * 0.1
        self.b2 = np.zeros((1, output_dim))
        
    def relu(self, z):
        return np.maximum(0, z)
        
    def relu_deriv(self, z):
        return (z > 0).astype(float)
        
    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        return self.z2
        
    def backward(self, X, y, y_hat, lr=0.01):
        m = X.shape[0]
        # Output error
        dz2 = (y_hat - y) / m
        dW2 = np.dot(self.a1.T, dz2)
        db2 = np.sum(dz2, axis=0, keepdims=True)
        
        # Hidden layer error
        da1 = np.dot(dz2, self.W2.T)
        dz1 = da1 * self.relu_deriv(self.z1)
        dW1 = np.dot(X.T, dz1)
        db1 = np.sum(dz1, axis=0, keepdims=True)
        
        # Gradient descent step
        self.W1 -= lr * dW1
        self.b1 -= lr * db1
        self.W2 -= lr * dW2
        self.b2 -= lr * db2

# Train on XOR problem
net = MLP(input_dim=2, hidden_dim=4, output_dim=1)
X = np.array([[0,0],[0,1],[1,0],[1,1]])
y = np.array([[0],[1],[1],[0]])
for epoch in range(1000):
    pred = net.forward(X)
    net.backward(X, y, pred, lr=0.5)

print("Trained XOR Predictions:\\n", np.round(net.forward(X), 3))`,
        },
      ],
      exercises: [
        {
          title: "Implement GELU Activation Function",
          description: "Write the GELU (Gaussian Error Linear Unit) forward and approximation formula used in Transformer LLMs",
          instructions: "Implement gelu(x) = 0.5 * x * (1 + tanh(sqrt(2/pi) * (x + 0.044715 * x^3))).",
          starterCode: `import numpy as np

def gelu(x):
    # Implement approximate GELU
    pass`,
          solutionCode: `import numpy as np

def gelu(x):
    return 0.5 * x * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (x + 0.044715 * np.power(x, 3))))

x_test = np.array([-2.0, -1.0, 0.0, 1.0, 2.0])
print("GELU activations:", np.round(gelu(x_test), 4))`,
          testCases: "gelu(0) == 0; Handles negative numbers smoothly; Matches Transformer activation profile",
          hints: "Use np.tanh and np.sqrt(2.0 / np.pi) with the cubic coefficient 0.044715.",
          difficulty: 2,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Forward Pass & Backpropagation Cycle",
          config: JSON.stringify({
            nodes: [
              { id: "in", label: "Input Layer\nX [x1, x2]", x: 80, y: 120 },
              { id: "hid", label: "Hidden Layer\nz1 = W1·X + b1\na1 = ReLU(z1)", x: 260, y: 120 },
              { id: "out", label: "Output Layer\nŷ = W2·a1 + b2", x: 440, y: 120 },
              { id: "loss", label: "Loss L(ŷ, y)", x: 600, y: 120 },
            ],
            edges: [
              { from: "in", to: "hid", label: "W1 forward" },
              { from: "hid", to: "out", label: "W2 forward" },
              { from: "out", to: "loss", label: "prediction" },
              { from: "loss", to: "out", label: "∂L/∂ŷ (backward)" },
              { from: "out", to: "hid", label: "∂L/∂a1 (backward)" },
              { from: "hid", to: "in", label: "∂L/∂X (backward)" },
            ],
            steps: [
              { id: "f1", activeNodes: ["in", "hid"], description: "Input activations transformed through linear weights and ReLU" },
              { id: "f2", activeNodes: ["hid", "out"], description: "Hidden representations mapped to output predictions" },
              { id: "f3", activeNodes: ["out", "loss"], description: "Loss calculated comparing prediction against true label" },
              { id: "b1", activeNodes: ["loss", "out", "hid"], description: "Chain Rule: gradients propagate backward to update W2 and W1" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Neural Networks & Backpropagation from Scratch",
        content: `## Neural Networks & Backpropagation from Scratch

### 1. The Anatomy of a Layer
For layer $l$, the computation proceeds in two steps:
1. **Affine Transformation**: $z^{[l]} = W^{[l]} a^{[l-1]} + b^{[l]}$
2. **Non-linear Activation**: $a^{[l]} = g(z^{[l]})$

### 2. Why Activation Functions Matter
Without non-linearities:
$$a^{[2]} = W^{[2]}(W^{[1]}x + b^{[1]}) + b^{[2]} = (W^{[2]}W^{[1]})x + (W^{[2]}b^{[1]} + b^{[2]}) = W'x + b'$$
The network collapses to a single linear layer regardless of depth!

### 3. Modern Activation: GELU
GELU weights inputs by their probability under a normal distribution:
$$\\text{GELU}(x) = x \\cdot \\Phi(x) \\approx 0.5x \\left(1 + \\tanh\\left(\\sqrt{\\frac{2}{\\pi}} (x + 0.044715 x^3)\\right)\\right)$$`,
        explanation: "Deep dive into multi-layer perceptrons, forward passes, non-linear activation functions, and backpropagation mechanics.",
      },
    },
    {
      title: "Embeddings, Tokenization & Vector Space Semantics",
      description: "Understand Byte-Pair Encoding (BPE), Word2Vec, Dense Embeddings, and the Geometry of Vector Spaces.",
      slug: "embeddings-tokenization-vector-semantics",
      difficulty: 3,
      prerequisites: [0, 1, 2],
      concepts: [
        {
          title: "Tokenization & Byte-Pair Encoding (BPE)",
          description: "LLMs do not read words or letters directly; they process tokens (subword chunks). BPE starts with individual characters and iteratively merges the most frequent byte pairs. A vocabulary of ~50k-128k tokens allows encoding any unicode string without out-of-vocabulary (OOV) errors.",
        },
        {
          title: "Dense Word & Sentence Embeddings",
          description: "Sparse representations (One-Hot, TF-IDF) suffer from high dimensionality and zero semantic awareness. Dense embeddings map words and sentences into continuous low-dimensional spaces (e.g., 768 or 1536 dimensions) where semantic similarity corresponds to geometric proximity.",
        },
        {
          title: "Vector Arithmetic & Semantic Properties",
          description: "High-dimensional embedding spaces capture linear relational semantics: vector('King') - vector('Man') + vector('Woman') ≈ vector('Queen'). This property underpins semantic search, cluster analysis, and cross-lingual alignment.",
        },
      ],
      examples: [
        {
          title: "Building a Subword Byte-Pair Encoding (BPE) Tokenizer",
          description: "Implementing BPE training and tokenization from scratch in Python",
          starterCode: `from collections import Counter, defaultdict

def train_bpe(corpus, num_merges=10):
    # Train BPE merges on corpus
    pass`,
          solutionCode: `from collections import Counter, defaultdict

def get_stats(vocab):
    pairs = defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols) - 1):
            pairs[symbols[i], symbols[i + 1]] += freq
    return pairs

def merge_vocab(pair, vocab):
    v_out = {}
    bigram = ' '.join(pair)
    replacement = ''.join(pair)
    for word in vocab:
        w_out = word.replace(bigram, replacement)
        v_out[w_out] = vocab[word]
    return v_out

# Sample vocabulary with character tokens and end-of-word tag </w>
vocab = {
    'l o w </w>': 5,
    'l o w e s t </w>': 2,
    'n e w e r </w>': 6,
    'w i d e r </w>': 3,
}

num_merges = 5
for i in range(num_merges):
    pairs = get_stats(vocab)
    if not pairs:
        break
    best = max(pairs, key=pairs.get)
    vocab = merge_vocab(best, vocab)
    print(f"Merge {i + 1}: {best} -> {''.join(best)}")

print("\\nFinal Vocabulary Representation:\\n", vocab)`,
        },
      ],
      exercises: [
        {
          title: "Semantic Vector Math Evaluator",
          description: "Write a function that finds the nearest word embedding to a target query vector",
          instructions: "Given an embedding dictionary and a target vector, return the top-K closest words by cosine similarity.",
          starterCode: `import numpy as np

def find_nearest_words(target_vector, embedding_dict, top_k=3):
    # Compute cosine similarities and return top_k words
    pass`,
          solutionCode: `import numpy as np

def find_nearest_words(target_vector, embedding_dict, top_k=3):
    t_norm = target_vector / np.linalg.norm(target_vector)
    scores = []
    for word, vec in embedding_dict.items():
        v_norm = vec / np.linalg.norm(vec)
        sim = float(np.dot(t_norm, v_norm))
        scores.append((word, sim))
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]

# Sample vectors
embeds = {
    "paris": np.array([0.9, 0.1, 0.4]),
    "france": np.array([0.85, 0.15, 0.42]),
    "london": np.array([0.8, 0.2, 0.35]),
    "apple": np.array([0.1, 0.8, 0.2]),
}
print("Nearest to [0.9, 0.1, 0.4]:", find_nearest_words(np.array([0.9, 0.1, 0.4]), embeds))`,
          testCases: "Returns exact match as top result; Sorts by descending cosine similarity; Respects top_k parameter",
          hints: "Normalize both target and dictionary vectors before computing dot products, then sort by score.",
          difficulty: 2,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Tokenization to Semantic Embedding Space",
          config: JSON.stringify({
            nodes: [
              { id: "text", label: "Raw Text:\n'Learning AI is fun'", x: 70, y: 100 },
              { id: "bpe", label: "BPE Tokenizer\n[1428, 4821, 318, 1254]", x: 250, y: 100 },
              { id: "embed", label: "Embedding Matrix W_e\nTokens → 1536D Vectors", x: 440, y: 100 },
              { id: "space", label: "Semantic Space\nClustered by meaning", x: 620, y: 100 },
            ],
            edges: [
              { from: "text", to: "bpe", label: "subword splits" },
              { from: "bpe", to: "embed", label: "lookup indices" },
              { from: "embed", to: "space", label: "dense vectors" },
            ],
            steps: [
              { id: "1", activeNodes: ["text", "bpe"], description: "Raw text split into subword token IDs via Byte-Pair Encoding" },
              { id: "2", activeNodes: ["bpe", "embed"], description: "Token IDs look up corresponding dense vector rows in Embedding Table" },
              { id: "3", activeNodes: ["embed", "space"], description: "Dense vectors positioned in continuous semantic space for attention calculation" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Embeddings, Tokenization & Vector Space Semantics",
        content: `## Embeddings, Tokenization & Vector Space Semantics

### 1. The Tokenization Pipeline
Before text enters an LLM, it is converted into integers via Byte-Pair Encoding:
1. **Raw text**: "Artificial Intelligence"
2. **Tokens**: \`["Artific", "ial", " Intelligence"]\`
3. **Token IDs**: \`[15423, 421, 8912]\`

### 2. The Embedding Lookup Table
The embedding table $W_e \\in \\mathbb{R}^{|V| \\times d}$ maps each token ID to a dense vector of dimension $d$ (e.g. $d = 4096$ in Llama 3 70B).

### 3. Positional Encoding
Because Transformers process all tokens simultaneously (permutation-invariant), we must add positional information:
$$x_i = \\text{Embedding}(t_i) + \\text{PositionalEncoding}(i)$$
Modern architectures use **RoPE (Rotary Position Embeddings)** to encode relative positions directly into query and key rotations.`,
        explanation: "Comprehensive guide to how raw natural language is tokenized and transformed into continuous vector embeddings.",
      },
    },
  ],
};
