export interface UserPayload {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface AIMode {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface ExecutionEvent {
  step: number;
  type: string;
  variable?: string;
  value?: unknown;
  line?: number;
  message?: string;
  scope?: "global" | "function" | "block" | "loop";
  callStack?: string[];
  timestamp?: number;
}

export interface ExecutionResult {
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  executionTime: number;
  memoryUsed: number;
  trace?: ExecutionTrace;
}

export interface ExecutionTrace {
  steps: TraceStep[];
  totalSteps: number;
  maxDepth: number;
  summary: {
    functionCalls: number;
    variableChanges: number;
    loopIterations: number;
    conditionals: number;
    errors: number;
    consoleOutputs: number;
  };
}

export interface TraceStep {
  step: number;
  line: number;
  depth: number;
  type: TraceStepType;
  description: string;
  state: VariableSnapshot[];
  callStack: string[];
  heap: Record<string, unknown>;
  timestamp: number;
}

export type TraceStepType =
  | "variable_declare"
  | "variable_assign"
  | "function_call"
  | "function_return"
  | "loop_start"
  | "loop_iteration"
  | "loop_end"
  | "conditional"
  | "console_output"
  | "error"
  | "return"
  | "expression";

export interface VariableSnapshot {
  name: string;
  value: unknown;
  type: string;
  scope: "global" | "function" | "block";
  changed: boolean;
  previousValue?: unknown;
}

export interface CallStackFrame {
  id: string;
  name: string;
  line?: number;
  args?: string[];
  returnValue?: unknown;
  isExecuting: boolean;
  depth: number;
}

export interface DiagramConfig {
  type: "mermaid" | "flowchart" | "sequence" | "class" | "state" | "er";
  content: string;
  caption?: string;
  theme?: "default" | "forest" | "dark" | "neutral";
}

export interface DiffHunk {
  type: "added" | "removed" | "unchanged";
  lines: string[];
  lineStart: number;
  lineEnd: number;
  explanation?: string;
}

export interface CodeDiff {
  original: string;
  modified: string;
  title: string;
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
  suggestions: DiffSuggestion[];
}

export interface DiffSuggestion {
  type: "performance" | "readability" | "security" | "best_practice" | "bug_fix";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  hunkIndex: number;
}

export interface AsyncEvent {
  id: string;
  type: "promise_create" | "promise_resolve" | "promise_reject" | "timeout_set" | "timeout_fire" | "microtask" | "macrotask";
  description: string;
  timestamp: number;
  source?: string;
  result?: unknown;
  error?: string;
}

export interface AsyncTrace {
  events: AsyncEvent[];
  timeline: Array<{ phase: string; events: AsyncEvent[] }>;
  summary: {
    totalPromises: number;
    resolvedPromises: number;
    rejectedPromises: number;
    totalTimeouts: number;
    microtasks: number;
    macrotasks: number;
  };
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  code?: string;
  diagram?: string;
  events?: ExecutionEvent[];
  timestamp: string;
}

export interface CurriculumNode {
  id: string;
  title: string;
  type: "course" | "module" | "topic" | "lesson";
  children?: CurriculumNode[];
  status?: "locked" | "available" | "in_progress" | "completed" | "mastered";
  progress?: number;
  difficulty?: number;
}

export type TutorMode =
  | "explain"
  | "code-breakdown"
  | "execution"
  | "debug"
  | "hint"
  | "socratic"
  | "simplify"
  | "deep-dive"
  | "visualize"
  | "compare"
  | "interview"
  | "practice"
  | "review";