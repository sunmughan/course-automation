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

export type CanonicalExecutionEventType =
  | "PROGRAM_START"
  | "LINE_EXECUTED"
  | "VARIABLE_DECLARE"
  | "VARIABLE_ASSIGN"
  | "FUNCTION_CALL"
  | "FUNCTION_RETURN"
  | "CONDITION_CHECK"
  | "LOOP_START"
  | "LOOP_ITERATION"
  | "LOOP_END"
  | "OBJECT_CREATE"
  | "OBJECT_UPDATE"
  | "CALLSTACK_PUSH"
  | "CALLSTACK_POP"
  | "ASYNC_START"
  | "ASYNC_WAIT"
  | "ASYNC_RESUME"
  | "NETWORK_REQUEST"
  | "NETWORK_RESPONSE"
  | "ERROR"
  | "OUTPUT"
  | "PROGRAM_END";

export type ExecutionEventType = CanonicalExecutionEventType | string;

export interface ExecutionEventPayload {
  name?: string;
  variable?: string;
  value?: unknown;
  previousValue?: unknown;
  args?: unknown[];
  returnValue?: unknown;
  condition?: string;
  result?: boolean;
  iteration?: number;
  objectType?: string;
  properties?: Record<string, unknown>;
  message?: string;
  error?: string;
  stack?: string[];
  stream?: "stdout" | "stderr";
  url?: string;
  status?: number;
  [key: string]: unknown;
}

export interface ExecutionEvent {
  id?: string;
  runId?: string;
  sequence?: number;
  step?: number;
  type: ExecutionEventType;
  line?: number;
  column?: number;
  scope?: "global" | "function" | "block" | "loop";
  payload?: ExecutionEventPayload;
  snapshot?: VariableSnapshot[];
  callStack?: string[];
  variable?: string;
  value?: unknown;
  message?: string;
  timestamp?: number;
}

export interface ExecutionResult {
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  executionTime: number;
  memoryUsed: number;
  exitCode?: number | null;
  status?: string;
  jobId?: string;
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
  serialized?: string;
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

export type AsyncEventType =
  | "ASYNC_START"
  | "ASYNC_WAIT"
  | "ASYNC_RESUME"
  | "NETWORK_REQUEST"
  | "NETWORK_RESPONSE"
  | "promise_create"
  | "promise_resolve"
  | "promise_reject"
  | "timeout_set"
  | "timeout_fire"
  | "microtask"
  | "macrotask"
  | string;

export interface AsyncEvent {
  id: string;
  type: AsyncEventType;
  description: string;
  timestamp: number;
  duration?: number;
  source?: string;
  result?: unknown;
  error?: string;
}

export interface AsyncTrace {
  events: AsyncEvent[];
  timeline: Array<{ phase: string; events: AsyncEvent[] }>;
  summary: {
    totalPromises: number;
    resolvedPromises?: number;
    rejectedPromises?: number;
    totalTimeouts: number;
    microtasks: number;
    macrotasks: number;
    unhandledRejections?: number;
  };
}

export interface EducationalAIResponse {
  answer: string;
  explanation: string;
  steps?: string[];
  examples?: string[];
  visualization?: {
    highlightLines?: number[];
    highlightEvents?: number[];
    focusVariable?: string;
    diagramType?: string;
    diagramContent?: string;
  };
  executionExplanation?: {
    whyExecuted?: string;
    variableChanges?: Array<{
      variable: string;
      from?: unknown;
      to?: unknown;
      reason: string;
    }>;
    callStackExplanation?: string;
  };
  mistakes?: string[];
  hints?: string[];
  practice?: string[];
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  code?: string;
  diagram?: string;
  events?: ExecutionEvent[];
  structured?: EducationalAIResponse;
  visualization?: EducationalAIResponse["visualization"];
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