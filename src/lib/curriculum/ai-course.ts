// Complete Enterprise AI & Prompt Engineering Course
import { aiPhase1 } from "./ai-phases/phase-1";
import { aiPhase2 } from "./ai-phases/phase-2";
import { aiPhase3 } from "./ai-phases/phase-3";
import { aiPhase4 } from "./ai-phases/phase-4";
import { aiPhase5 } from "./ai-phases/phase-5";
import { aiPhase6 } from "./ai-phases/phase-6";
import { aiPhase7 } from "./ai-phases/phase-7";

export const aiPromptEngineeringCourse = {
  title: "AI, Large Language Models & Prompt Engineering Enterprise Mastery",
  description: "Exhaustive, professional AI mastery curriculum covering Linear Algebra & Tensors, Neural Networks from scratch, Attention & Transformer Architecture, KV-Caching, Advanced In-Context Prompt Engineering (CoT, ToT, Self-Consistency), Pydantic Structured Outputs, Enterprise RAG (BM25 + Dense Hybrid Search, Cross-Encoders, Corrective RAG), Autonomous AI Agents (ReAct, Function Calling, Multi-Agent Supervisors), LoRA/QLoRA Fine-Tuning, DPO Alignment, and Production vLLM Deployment.",
  slug: "ai-prompt-engineering",
  stream: "ai",
  imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  order: 4,
  modules: [
    aiPhase1,
    aiPhase2,
    aiPhase3,
    aiPhase4,
    aiPhase5,
    aiPhase6,
    aiPhase7,
  ],
};
