import type {
  ExecutionEvent,
  ExecutionEventType,
  CanonicalExecutionEventType,
  TraceStep,
} from "@/types";

type RawExecutionEvent = Partial<ExecutionEvent> &
  Partial<Pick<TraceStep, "description" | "depth" | "state" | "heap">> & {
    name?: string;
  };

const CANONICAL_MAP: Record<string, CanonicalExecutionEventType> = {
  // Legacy mappings
  variable_declare: "VARIABLE_DECLARE",
  variable_declaration: "VARIABLE_DECLARE",
  variable_assign: "VARIABLE_ASSIGN",
  assignment: "VARIABLE_ASSIGN",
  function_call: "FUNCTION_CALL",
  function_return: "FUNCTION_RETURN",
  callstack_push: "CALLSTACK_PUSH",
  callstack_pop: "CALLSTACK_POP",
  conditional: "CONDITION_CHECK",
  condition_check: "CONDITION_CHECK",
  loop_start: "LOOP_START",
  loop_iteration: "LOOP_ITERATION",
  loop_end: "LOOP_END",
  object_create: "OBJECT_CREATE",
  object_update: "OBJECT_UPDATE",
  console_output: "OUTPUT",
  output: "OUTPUT",
  error: "ERROR",
  program_start: "PROGRAM_START",
  program_end: "PROGRAM_END",
  line_executed: "LINE_EXECUTED",
  async_start: "ASYNC_START",
  async_wait: "ASYNC_WAIT",
  async_resume: "ASYNC_RESUME",
  network_request: "NETWORK_REQUEST",
  network_response: "NETWORK_RESPONSE",

  // Direct canonical mappings
  PROGRAM_START: "PROGRAM_START",
  LINE_EXECUTED: "LINE_EXECUTED",
  VARIABLE_DECLARE: "VARIABLE_DECLARE",
  VARIABLE_ASSIGN: "VARIABLE_ASSIGN",
  FUNCTION_CALL: "FUNCTION_CALL",
  FUNCTION_RETURN: "FUNCTION_RETURN",
  CONDITION_CHECK: "CONDITION_CHECK",
  LOOP_START: "LOOP_START",
  LOOP_ITERATION: "LOOP_ITERATION",
  LOOP_END: "LOOP_END",
  OBJECT_CREATE: "OBJECT_CREATE",
  OBJECT_UPDATE: "OBJECT_UPDATE",
  CALLSTACK_PUSH: "CALLSTACK_PUSH",
  CALLSTACK_POP: "CALLSTACK_POP",
  ASYNC_START: "ASYNC_START",
  ASYNC_WAIT: "ASYNC_WAIT",
  ASYNC_RESUME: "ASYNC_RESUME",
  NETWORK_REQUEST: "NETWORK_REQUEST",
  NETWORK_RESPONSE: "NETWORK_RESPONSE",
  ERROR: "ERROR",
  OUTPUT: "OUTPUT",
  PROGRAM_END: "PROGRAM_END",
};

export function normalizeExecutionEvents(
  events: RawExecutionEvent[]
): ExecutionEvent[] {
  return events.map((event, index) => {
    const rawType = event.type ? String(event.type) : "";
    const canonicalType: ExecutionEventType =
      CANONICAL_MAP[rawType] ||
      (rawType.toUpperCase() as CanonicalExecutionEventType) ||
      "LINE_EXECUTED";

    const sequence = event.sequence ?? event.step ?? index;
    const line = event.line ?? 1;
    const variable =
      event.variable ??
      event.name ??
      (event.payload?.name as string) ??
      (event.payload?.variable as string);
    const value = event.value ?? event.payload?.value;
    const message =
      event.message ??
      event.description ??
      (event.payload?.message as string) ??
      (event.payload?.error as string) ??
      (variable ? `${variable} = ${JSON.stringify(value)}` : canonicalType);
    const callStack = event.callStack ? [...event.callStack] : [];
    const scope =
      event.scope ?? ((event.depth ?? 0) > 0 ? "function" : "global");

    const payload = event.payload || {
      name: variable,
      variable,
      value,
      message,
      callStack,
      line,
    };

    return {
      id: event.id ?? `evt-${sequence}`,
      runId: event.runId,
      sequence,
      step: sequence,
      type: canonicalType,
      line,
      column: event.column ?? 1,
      scope,
      payload,
      snapshot: event.state ?? event.snapshot ?? [],
      callStack,
      variable,
      value,
      message,
      timestamp: event.timestamp ?? Date.now(),
    };
  });
}

export function createExecutionEventStream(
  events: ExecutionEvent[]
): string[] {
  return events.map((evt) => `data: ${JSON.stringify(evt)}\n\n`);
}
