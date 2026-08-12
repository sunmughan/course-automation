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
}

export interface ExecutionResult {
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  executionTime: number;
  memoryUsed: number;
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