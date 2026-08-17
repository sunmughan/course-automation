// Phase 6: Model Fine-Tuning, Alignment & Customization
export const aiPhase6 = {
  title: "Phase 6: Model Fine-Tuning, Alignment & Customization",
  description: "Master dataset curation, Supervised Fine-Tuning (SFT), Parameter-Efficient Fine-Tuning (LoRA & QLoRA), Direct Preference Optimization (DPO), and LLM Evaluation Benchmarks.",
  slug: "phase-6-fine-tuning-alignment",
  topics: [
    {
      title: "Supervised Fine-Tuning (SFT) & Parameter-Efficient LoRA/QLoRA",
      description: "Master Low-Rank Adaptation (LoRA), 4-bit Quantized QLoRA (bitsandbytes), gradient checkpointing, and Hugging Face PEFT.",
      slug: "sft-peft-lora-qlora",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4],
      concepts: [
        {
          title: "Full Fine-Tuning vs PEFT",
          description: "Full fine-tuning updates all billions of model weights, requiring massive VRAM and risking catastrophic forgetting. Parameter-Efficient Fine-Tuning (PEFT) freezes the base model and only trains a tiny fraction (0.1% to 1%) of extra parameters.",
        },
        {
          title: "How LoRA (Low-Rank Adaptation) Works",
          description: "LoRA decomposes weight updates into two low-rank matrices: ΔW = B · A, where A ∈ R^(r × d) and B ∈ R^(d × r) with rank r << d (e.g. r=16 for d=4096). This reduces trainable parameter counts by 99% while achieving comparable task accuracy.",
        },
        {
          title: "QLoRA (Quantized LoRA)",
          description: "QLoRA quantizes the base frozen model to 4-bit NormalFloat (NF4) and attaches 16-bit LoRA adapters. This enables fine-tuning a 70B parameter LLM on two consumer GPUs or an 8B model on a single 16GB GPU.",
        },
      ],
      examples: [
        {
          title: "LoRA Matrix Decomposition from Scratch in Python",
          description: "Implementing the forward pass of a LoRA-adapted linear layer with NumPy",
          starterCode: `import numpy as np

class LoRALinear:
    def __init__(self, in_features, out_features, rank=4, alpha=8):
        # Initialize frozen base weights and trainable low-rank adapters A and B
        pass
        
    def forward(self, x):
        # Compute: base_output + (B @ A) * (alpha / rank)
        pass`,
          solutionCode: `import numpy as np

class LoRALinear:
    def __init__(self, in_features, out_features, rank=4, alpha=8):
        self.in_features = in_features
        self.out_features = out_features
        self.rank = rank
        self.scaling = alpha / rank
        
        # Frozen base weight matrix (e.g., loaded from pre-trained model)
        self.W_base = np.random.randn(in_features, out_features) * 0.02
        
        # Trainable LoRA adapter matrices
        # Matrix A: Gaussian initialization; Matrix B: Zero initialization (starts as identity)
        self.A = np.random.randn(in_features, rank) * 0.01
        self.B = np.zeros((rank, out_features))
        
    def forward(self, x):
        # Base model output
        base_out = np.dot(x, self.W_base)
        
        # Low-rank adapter output: (x @ A) @ B * scaling
        lora_out = np.dot(np.dot(x, self.A), self.B) * self.scaling
        
        return base_out + lora_out

# Test LoRA layer with 4096 hidden dim and rank 16
layer = LoRALinear(in_features=4096, out_features=4096, rank=16, alpha=32)
sample_input = np.random.randn(2, 4096)
output = layer.forward(sample_input)

base_params = 4096 * 4096 # 16,777,216
lora_params = (4096 * 16) + (16 * 4096) # 131,072
print(f"Base Parameters: {base_params:,}")
print(f"Trainable LoRA Parameters: {lora_params:,} ({lora_params/base_params*100:.2f}% of base)")
print("Forward output shape:", output.shape)`,
        },
      ],
      exercises: [
        {
          title: "Format Dataset for SFT Training",
          description: "Write a dataset formatter that converts raw question-answer dictionaries into standard Alpaca instruction template strings",
          instructions: "Create format_instruction_sample(instruction, input_text, response) that outputs standard formatted markdown prompts.",
          starterCode: `def format_instruction_sample(instruction, input_context, response):
    # Return formatted instruction string
    pass`,
          solutionCode: `def format_instruction_sample(instruction, input_context, response):
    template = "### Instruction:\\n" + instruction.strip() + "\\n\\n"
    if input_context and input_context.strip():
        template += "### Input:\\n" + input_context.strip() + "\\n\\n"
    template += "### Response:\\n" + response.strip()
    return template

sample = format_instruction_sample(
    "Summarize the following meeting notes",
    "Meeting on August 15 discussed Q3 roadmap and budget approval.",
    "Q3 roadmap and budget were approved during the Aug 15 meeting."
)
print("Formatted SFT Sample:\\n", sample)`,
          testCases: "Includes Instruction header; Includes Input header only when input_context provided; Formats Response header",
          hints: "Check if input_context is non-empty before appending the ### Input block.",
          difficulty: 2,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "LoRA (Low-Rank Adaptation) Matrix Decomposition",
          config: JSON.stringify({
            nodes: [
              { id: "in", label: "Input Activation X\n[d_in]", x: 80, y: 120 },
              { id: "base", label: "Frozen Base Weight W_0\n[d_in × d_out] (No Gradients)", x: 300, y: 50 },
              { id: "lora_a", label: "LoRA Matrix A\n[d_in × r] (Trainable)", x: 230, y: 190 },
              { id: "lora_b", label: "LoRA Matrix B\n[r × d_out] (Trainable)", x: 380, y: 190 },
              { id: "sum", label: "Sum: W_0·X + (B·A)·X · (α/r)", x: 550, y: 120 },
              { id: "out", label: "Adapted Output", x: 700, y: 120 },
            ],
            edges: [
              { from: "in", to: "base", label: "forward pass" },
              { from: "in", to: "lora_a", label: "low-rank projection" },
              { from: "lora_a", to: "lora_b", label: "rank r intermediate" },
              { from: "base", to: "sum", label: "base output" },
              { from: "lora_b", to: "sum", label: "scaled adapter delta" },
              { from: "sum", to: "out", label: "result" },
            ],
            steps: [
              { id: "1", activeNodes: ["in", "base"], description: "Base model weights frozen in VRAM; forward pass computes standard output" },
              { id: "2", activeNodes: ["in", "lora_a", "lora_b"], description: "Low-rank matrices A and B compute compact delta adaptations" },
              { id: "3", activeNodes: ["sum", "out"], description: "Base output and LoRA delta combined seamlessly without changing base model" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Supervised Fine-Tuning (SFT) & Parameter-Efficient LoRA/QLoRA",
        content: `## Parameter-Efficient Fine-Tuning (LoRA)

### 1. The LoRA Formulation
For a weight matrix $W_0 \\in \\mathbb{R}^{d \\times k}$, LoRA represents the weight update $\\Delta W$ as:
$$W = W_0 + \\Delta W = W_0 + \\frac{\\alpha}{r} (B \\cdot A)$$
Where:
- $A \\sim \\mathcal{N}(0, \\sigma^2) \\in \\mathbb{R}^{r \\times k}$
- $B = 0 \\in \\mathbb{R}^{d \\times r}$
- $r \\ll \\min(d, k)$ (Rank, typically 8, 16, 32, or 64)
- $\\alpha$ (Scaling hyperparameter, typically $2 \\times r$)

### 2. Benefits of LoRA
- **99% less trainable parameters**: Only train ~10M–50M parameters instead of 70B.
- **Instant task switching**: Swap lightweight adapter files (50MB) on a single shared frozen base model.
- **Zero inference latency**: At deployment, LoRA weights can be mathematically merged into $W_0$: $W_{\\text{merged}} = W_0 + \\frac{\\alpha}{r} BA$.`,
        explanation: "Master the mathematical principles and implementation of LoRA and QLoRA for efficient model adaptation.",
      },
    },
    {
      title: "Alignment: RLHF, Direct Preference Optimization (DPO) & Evals",
      description: "Understand Reinforcement Learning from Human Feedback (RLHF), Direct Preference Optimization (DPO), and Automated Evaluation benchmarks.",
      slug: "rlhf-dpo-alignment-evals",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4, 5],
      concepts: [
        {
          title: "RLHF vs DPO (Direct Preference Optimization)",
          description: "RLHF requires training a separate Reward Model, running complex PPO reinforcement learning with high instability. DPO mathematically reformulates the objective to optimize the policy directly on preference pairs (prompt, chosen, rejected) using cross-entropy, eliminating the reward model entirely.",
        },
        {
          title: "Preference Dataset Architecture",
          description: "DPO datasets consist of triplets: { 'prompt': '...', 'chosen': '...', 'rejected': '...' }. The chosen response reflects helpful, harmless, and accurate behavior; the rejected response contains hallucination, tone violation, or refusal errors.",
        },
        {
          title: "LLM-as-a-Judge & Automated Evaluation",
          description: "Evaluating open-ended generation with automated benchmarks: MT-Bench, AlpacaEval, MMLU, GSM8K, and HumanEval. LLM-as-a-Judge uses strong models (e.g. GPT-4o / Claude 3.5 Sonnet) with strict rubrics and position-bias swapping to score candidate outputs.",
        },
      ],
      examples: [
        {
          title: "DPO Loss Function and Pairwise Preference Evaluator in Python",
          description: "Implementing the mathematical DPO loss function with reference model logits in Python",
          starterCode: `import numpy as np

def dpo_loss(policy_chosen_logps, policy_rejected_logps, ref_chosen_logps, ref_rejected_logps, beta=0.1):
    # Compute DPO loss from log probabilities
    pass`,
          solutionCode: `import numpy as np

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def dpo_loss(policy_chosen_logps, policy_rejected_logps, ref_chosen_logps, ref_rejected_logps, beta=0.1):
    # Log ratio for chosen
    pi_chosen_ratio = policy_chosen_logps - ref_chosen_logps
    # Log ratio for rejected
    pi_rejected_ratio = policy_rejected_logps - ref_rejected_logps
    
    logits = beta * (pi_chosen_ratio - pi_rejected_ratio)
    losses = -np.log(sigmoid(logits) + 1e-12)
    return float(np.mean(losses))

# Test DPO loss calculation
p_c = np.array([-1.2]) # policy logprob for chosen
p_r = np.array([-3.5]) # policy logprob for rejected (lower)
ref_c = np.array([-1.5]) # reference logprob for chosen
ref_r = np.array([-1.8]) # reference logprob for rejected

loss = dpo_loss(p_c, p_r, ref_c, ref_r, beta=0.1)
print(f"Computed DPO Loss: {loss:.4f}")`,
        },
      ],
      exercises: [
        {
          title: "Implement LLM-as-a-Judge Scoring Prompt Builder",
          description: "Build an evaluation prompt that compares two model outputs with position-bias counter-balancing",
          instructions: "Create build_judge_prompt(question, response_a, response_b, rubric) returning a structured prompt that instructs the judge model to output a score from 1 to 10 with rationale.",
          starterCode: `def build_judge_prompt(query, resp_a, resp_b, rubric):
    # Return formatted judge evaluation prompt
    pass`,
          solutionCode: `def build_judge_prompt(query, resp_a, resp_b, rubric):
    return f"""### SYSTEM: You are an impartial AI evaluation judge.
Review the following user query and two candidate responses.
Score both on a scale of 1-10 based on the evaluation rubric.

### EVALUATION RUBRIC:
{rubric}

### USER QUERY:
{query}

### CANDIDATE RESPONSE A:
{resp_a}

### CANDIDATE RESPONSE B:
{resp_b}

### OUTPUT FORMAT:
Return JSON: {{"winner": "A"|"B"|"TIE", "score_a": int, "score_b": int, "reasoning": "string"}}"""

prompt = build_judge_prompt(
    "How does asyncio work in Python?",
    "Asyncio uses a single-threaded cooperative event loop.",
    "Asyncio runs code on multiple CPU threads simultaneously.",
    "Accuracy, clarity, and factual correctness."
)
print(prompt)`,
          testCases: "Includes rubric in prompt; Formats both candidate responses; Demands structured JSON output",
          hints: "Combine query, rubric, response_a, and response_b in an unambiguous structured template.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Direct Preference Optimization (DPO) Training Flow",
          config: JSON.stringify({
            nodes: [
              { id: "data", label: "Preference Triplets\n{Prompt, Chosen, Rejected}", x: 80, y: 120 },
              { id: "policy", label: "Policy Model π_θ\n(Active Training)", x: 280, y: 60 },
              { id: "ref", label: "Reference Model π_ref\n(Frozen Base)", x: 280, y: 180 },
              { id: "loss", label: "DPO Implicit Reward Loss\nL_DPO(π_θ; π_ref)", x: 480, y: 120 },
              { id: "opt", label: "Aligned Model\nHelpful, Honest & Safe", x: 660, y: 120 },
            ],
            edges: [
              { from: "data", to: "policy", label: "batch" },
              { from: "data", to: "ref", label: "batch" },
              { from: "policy", to: "loss", label: "log probs" },
              { from: "ref", to: "loss", label: "reference baseline" },
              { from: "loss", to: "opt", label: "gradient update" },
            ],
            steps: [
              { id: "1", activeNodes: ["data", "policy", "ref"], description: "Prompts evaluated simultaneously through training policy and frozen reference baseline" },
              { id: "2", activeNodes: ["policy", "ref", "loss"], description: "Log-likelihood ratio between chosen and rejected responses directly computed" },
              { id: "3", activeNodes: ["loss", "opt"], description: "Policy model parameters optimized directly for human preference alignment without separate reward model" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Alignment: RLHF, Direct Preference Optimization (DPO) & Evals",
        content: `## LLM Alignment & DPO

### 1. Direct Preference Optimization (DPO)
Rafailov et al. proved that the reward optimization objective in RLHF can be solved in closed form directly via the policy model:

**L_DPO(pi_theta; pi_ref) = -E_{(x, y_w, y_l)} [ log sigma( beta * log(pi_theta(y_w|x) / pi_ref(y_w|x)) - beta * log(pi_theta(y_l|x) / pi_ref(y_l|x)) ) ]**

Where:
- **y_w**: Preferred (winning) response
- **y_l**: Rejected (losing) response
- **pi_ref**: Frozen base model preventing policy drift
- **beta**: KL-penalty hyperparameter (typically 0.1 to 0.5)

### 2. Standard Evaluation Benchmarks
- **MMLU**: Massive Multitask Language Understanding (General knowledge).
- **GSM8K**: Grade School Math 8K (Multi-step reasoning).
- **HumanEval**: Python coding benchmark.
- **AlpacaEval / MT-Bench**: Chat helpfulness and conversational quality judged by GPT-4.`,
        explanation: "Master modern alignment techniques including Direct Preference Optimization and automated evaluation metrics.",
      },
    },
  ],
};
