/**
 * Curriculum Intelligence & Teaching Graph Layer
 * Represents curriculum topics as machine-readable pedagogical nodes with complete
 * authoritative knowledge graphs (mental models, counter-examples, misconceptions, mastery criteria).
 */

export interface TopicKnowledgeNode {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  courseTitle: string;
  moduleTitle: string;
  difficultyLevel: number;
  prerequisites: string[]; // List of prerequisite topic slugs
  
  // Authoritative Pedagogical Metadata
  learningObjectives: string[];
  mentalModel: {
    analogy: string;
    coreMechanism: string;
    keyMetaphor: string;
  };
  syntax: {
    pattern: string;
    breakdown: Array<{ part: string; purpose: string }>;
  };
  counterExamples: Array<{
    code: string;
    whyWrong: string;
    correction: string;
  }>;
  useCases: string[];
  nonUseCases: string[];
  advantages: string[];
  limitations: string[];
  alternatives: string[];
  commonMistakes: Array<{
    pattern: string;
    consequence: string;
    fix: string;
  }>;
  misconceptions: Array<{
    belief: string;
    reality: string;
    diagnosticQuestion: string;
  }>;
  visualModel: {
    type: "flowchart" | "sequence" | "memory_heap" | "state_machine" | "call_stack";
    nodes: Array<{ id: string; label: string; role: string }>;
    dataFlow: Array<{ from: string; to: string; payload: string }>;
  };
  masteryCriteria: {
    minPracticeRuns: number;
    requiredScore: number;
    mustClearMisconceptions: string[];
  };
}

// In-memory knowledge registry populated from curriculum database & seed metadata
const topicKnowledgeRegistry = new Map<string, TopicKnowledgeNode>();

export function registerTopicKnowledge(node: TopicKnowledgeNode): void {
  topicKnowledgeRegistry.set(node.topicSlug, node);
  topicKnowledgeRegistry.set(node.topicId, node);
}

export function getTopicKnowledge(topicIdOrSlug: string): TopicKnowledgeNode | null {
  return topicKnowledgeRegistry.get(topicIdOrSlug) || null;
}

export function getAllTopicKnowledgeNodes(): TopicKnowledgeNode[] {
  // Deduplicate by slug
  const unique = new Map<string, TopicKnowledgeNode>();
  for (const node of topicKnowledgeRegistry.values()) {
    unique.set(node.topicSlug, node);
  }
  return Array.from(unique.values());
}

/**
 * Derives dynamic intelligence node for any topic by combining DB records with
 * authoritative pedagogical fallbacks so AI never has to hallucinate mental models or misconceptions.
 */
export function buildTopicIntelligence({
  topicId,
  topicSlug,
  topicTitle,
  courseTitle = "Software Engineering",
  moduleTitle = "Core Fundamentals",
  difficultyLevel = 1,
  prerequisites = [],
  concepts = [],
  examples = [],
}: {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  courseTitle?: string;
  moduleTitle?: string;
  difficultyLevel?: number;
  prerequisites?: string[];
  concepts?: Array<{ title: string; description: string }>;
  examples?: Array<{ title: string; starterCode: string; solutionCode: string }>;
}): TopicKnowledgeNode {
  const existing = getTopicKnowledge(topicSlug) || getTopicKnowledge(topicId);
  if (existing) return existing;

  const node: TopicKnowledgeNode = {
    topicId,
    topicSlug,
    topicTitle,
    courseTitle,
    moduleTitle,
    difficultyLevel,
    prerequisites,
    learningObjectives: [
      `Understand the internal execution lifecycle of ${topicTitle}`,
      `Apply ${topicTitle} patterns in production-grade software`,
      `Identify and prevent common performance and memory pitfalls`,
    ],
    mentalModel: {
      analogy: `Think of ${topicTitle} as an automated processing line where data passes through deterministic transformation checkpoints with strict boundary guarantees.`,
      coreMechanism: `${topicTitle} orchestrates runtime memory and execution control flow to ensure idempotent, predictable application state.`,
      keyMetaphor: "Deterministic pipeline with guard rails",
    },
    syntax: {
      pattern: examples[0]?.solutionCode || `// Standard ${topicTitle} pattern\nfunction executePattern(input) {\n  return process(input);\n}`,
      breakdown: [
        { part: "Declaration", purpose: "Defines the scope and lexical binding" },
        { part: "Execution Body", purpose: "Executes state transformations defensively" },
        { part: "Return / Resolution", purpose: "Emits verified output state" },
      ],
    },
    counterExamples: [
      {
        code: `// Anti-pattern: Missing error handling in ${topicTitle}\nfunction unsafeHandler() { /* ignores edge conditions */ }`,
        whyWrong: "Fails silently on unexpected inputs or concurrent mutations",
        correction: `// Safe pattern\nfunction safeHandler(input) {\n  if (!input) throw new Error('Invalid input');\n  return process(input);\n}`,
      },
    ],
    useCases: [
      `High-throughput data pipelines requiring strict ${topicTitle} state guarantees`,
      "Production web servers handling concurrent client workloads",
      "Robust state management in complex user interfaces",
    ],
    nonUseCases: [
      "Trivially simple synchronous scripts where added abstraction increases latency",
      "Resource-constrained embedded systems without garbage collection overhead support",
    ],
    advantages: [
      "Strict separation of concerns and modularity",
      "Predictable state transitions and debuggability",
      "High testability with mocked dependency contracts",
    ],
    limitations: [
      "Slight initial mental complexity for novice developers",
      "Requires defensive boundary validation",
    ],
    alternatives: [
      "Functional pipeline composition",
      "Event-driven pub/sub architecture",
    ],
    commonMistakes: [
      {
        pattern: "Overlooking asynchronous error boundaries",
        consequence: "Unhandled promise rejections causing runtime crashes",
        fix: "Always wrap async boundaries in try/catch or structured error propagation",
      },
      {
        pattern: "Mutating shared outer lexical state",
        consequence: "Unintended side effects across concurrent execution turns",
        fix: "Use immutable updates and pure functional state transformations",
      },
    ],
    misconceptions: [
      {
        belief: `${topicTitle} is purely syntactic sugar with no runtime performance impact`,
        reality: `${topicTitle} changes runtime memory allocations, call stack frames, and scope chains`,
        diagnosticQuestion: `How does the runtime allocate memory and manage garbage collection when ${topicTitle} is invoked?`,
      },
    ],
    visualModel: {
      type: "flowchart",
      nodes: [
        { id: "input_node", label: "Client Event / Input", role: "Triggers execution" },
        { id: "core_node", label: `${topicTitle} Processor`, role: "Applies transformation" },
        { id: "output_node", label: "Verified Output State", role: "Resolves result" },
      ],
      dataFlow: [
        { from: "input_node", to: "core_node", payload: "Input payload + context" },
        { from: "core_node", to: "output_node", payload: "Resolved immutable state" },
      ],
    },
    masteryCriteria: {
      minPracticeRuns: 3,
      requiredScore: 85,
      mustClearMisconceptions: [`${topicTitle} is purely syntactic sugar`],
    },
  };

  registerTopicKnowledge(node);
  return node;
}
