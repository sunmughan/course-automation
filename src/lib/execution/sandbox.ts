import type { ExecutionEvent, ExecutionResult } from "@/types";
import { instrumentCode, buildTraceWrapper, analyzeTrace } from "./tracer";

const MAX_EXECUTION_TIME_MS = 5000;

function wrapCodeWithInterception(code: string): string {
  return `
    return (function() {
      var __startTime = Date.now();
      var __output = [];
      var __step = 0;
      var console = {
        log: function() {
          var args = Array.prototype.slice.call(arguments);
          var formatted = args.map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
            catch(e) { return String(a); }
          }).join(' ');
          __output.push(formatted);
        },
        error: function() {
          var args = Array.prototype.slice.call(arguments);
          var formatted = args.map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
            catch(e) { return String(a); }
          }).join(' ');
          __output.push('[ERROR] ' + formatted);
        },
        warn: function() {
          var args = Array.prototype.slice.call(arguments);
          var formatted = args.map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
            catch(e) { return String(a); }
          }).join(' ');
          __output.push('[WARN] ' + formatted);
        },
        info: function() {
          var args = Array.prototype.slice.call(arguments);
          var formatted = args.map(function(a) {
            try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
            catch(e) { return String(a); }
          }).join(' ');
          __output.push('[INFO] ' + formatted);
        },
        table: function() {},
        time: function() {},
        timeEnd: function() {},
        clear: function() {},
        assert: function() {},
        debug: function() {},
        dir: function() {},
        group: function() {},
        groupEnd: function() {},
        groupCollapsed: function() {},
        trace: function() {},
        count: function() {},
        countReset: function() {},
      };

      try {
        ${code}
      } catch (__execError) {
        return {
          error: __execError.message || String(__execError),
          output: __output,
          executionTime: Date.now() - __startTime
        };
      }

      return {
        error: null,
        output: __output,
        executionTime: Date.now() - __startTime
      };
    })();
  `;
}

function sanitizeCode(code: string): void {
  const dangerousPatterns: [RegExp, string][] = [
    [/import\s+/, "import statement"],
    [/require\s*\(/, "require()"],
    [/process\./, "process"],
    [/globalThis\./, "globalThis"],
    [/global\./, "global"],
    [/__proto__/, "__proto__"],
    [/fetch\s*\(/, "fetch()"],
    [/XMLHttpRequest/, "XMLHttpRequest"],
    [/WebSocket/, "WebSocket"],
    [/Worker\s*\(/, "Worker"],
    [/eval\s*\(/, "eval()"],
    [/setTimeout\s*\(/, "setTimeout()"],
    [/setInterval\s*\(/, "setInterval()"],
    [/Function\s*\(/, "Function()"],
    [/document\./, "document"],
    [/window\./, "window"],
    [/localStorage/, "localStorage"],
    [/sessionStorage/, "sessionStorage"],
    [/indexedDB/, "indexedDB"],
    [/location\./, "location"],
    [/history\./, "history"],
    [/navigator\./, "navigator"],
    [/alert\s*\(/, "alert()"],
    [/prompt\s*\(/, "prompt()"],
    [/confirm\s*\(/, "confirm()"],
  ];

  for (const [pattern, name] of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Code contains disallowed API: ${name}`);
    }
  }
}

export async function executeJavaScript(
  code: string,
  language: string = "javascript",
  options?: { trace?: boolean }
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const enableTrace = options?.trace ?? false;

  if (language !== "javascript") {
    return {
      output: "",
      error: `Language '${language}' is not supported. Only JavaScript is currently available.`,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return {
      output: "",
      error: "No code provided.",
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  try {
    sanitizeCode(trimmedCode);
  } catch (e) {
    return {
      output: "",
      error: (e as Error).message,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  if (enableTrace) {
    return executeWithTrace(trimmedCode, startTime);
  }

  return executeSimple(trimmedCode, startTime);
}

async function executeSimple(
  code: string,
  startTime: number
): Promise<ExecutionResult> {
  const wrappedCode = wrapCodeWithInterception(code);

  let result: {
    error: string | null;
    output: string[];
    executionTime: number;
  };

  try {
    const fn = new Function(wrappedCode);

    const execPromise = new Promise<typeof result>((resolve) => {
      try {
        const rawResult = fn();
        if (rawResult && typeof rawResult === "object" && "error" in rawResult) {
          resolve(rawResult as typeof result);
        } else {
          resolve({
            error: null,
            output: [],
            executionTime: Date.now() - startTime,
          });
        }
      } catch (e) {
        resolve({
          error: (e as Error).message || "Execution error",
          output: [],
          executionTime: Date.now() - startTime,
        });
      }
    });

    const timeoutPromise = new Promise<typeof result>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Execution timed out after 5 seconds"));
      }, MAX_EXECUTION_TIME_MS);
    });

    result = await Promise.race([execPromise, timeoutPromise]);
  } catch (e) {
    const errorMsg = (e as Error).message || "Unknown execution error";
    const isTimeout = errorMsg === "Execution timed out after 5 seconds";
    return {
      output: isTimeout ? "Execution timed out (5 second limit)" : errorMsg,
      error: isTimeout ? "Execution timed out after 5 seconds" : null,
      events: [],
      executionTime: Date.now() - startTime,
      memoryUsed: 0,
    };
  }

  const executionTime = Date.now() - startTime;

  const events: ExecutionEvent[] = [];
  if (result.output.length > 0) {
    events.push({
      step: 1,
      type: "output",
      message: result.output.join("\n"),
    });
  }

  if (result.error) {
    events.push({
      step: 1,
      type: "error",
      message: result.error,
    });
  }

  return {
    output: result.output.join("\n"),
    error: result.error || null,
    events,
    executionTime,
    memoryUsed: 0,
  };
}

async function executeWithTrace(
  code: string,
  startTime: number
): Promise<ExecutionResult> {
  try {
    const { instrumentedCode } = instrumentCode(code);
    const wrappedCode = buildTraceWrapper(instrumentedCode);

    const fn = new Function(wrappedCode);

    const execPromise = new Promise<{ traceEvents: unknown[]; output: string[] }>((resolve, reject) => {
      try {
        const rawResult = fn();
        if (Array.isArray(rawResult)) {
          resolve({ traceEvents: rawResult, output: [] });
        } else if (rawResult && typeof rawResult === "object" && "error" in rawResult) {
          const errResult = rawResult as { error: string; output: string[] };
          resolve({
            traceEvents: [{
              step: 0,
              type: "error",
              message: errResult.error,
              line: 0,
              scope: "global",
              callStack: [],
              timestamp: Date.now(),
            }],
            output: errResult.output || [],
          });
        } else {
          resolve({ traceEvents: [], output: [] });
        }
      } catch (e) {
        resolve({
          traceEvents: [{
            step: 0,
            type: "error",
            message: (e as Error).message || "Execution error",
            line: 0,
            scope: "global",
            callStack: [],
            timestamp: Date.now(),
          }],
          output: [],
        });
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Execution timed out after 5 seconds")), MAX_EXECUTION_TIME_MS);
    });

    const { traceEvents, output } = await Promise.race([execPromise, timeoutPromise]);

    const executionTime = Date.now() - startTime;

    const events: ExecutionEvent[] = traceEvents.map((e: any, i: number) => ({
      step: e.step || i + 1,
      type: e.type || "expression",
      variable: e.variable || e.name,
      value: e.value,
      line: e.line,
      message: e.message || e.description,
      scope: e.scope || "global",
      callStack: e.callStack || [],
      timestamp: e.timestamp,
    }));

    const { summary, maxDepth } = analyzeTrace(traceEvents as any);

    const trace = {
      steps: traceEvents.map((e: any, i: number) => ({
        step: e.step || i + 1,
        line: e.line || 0,
        depth: e.depth || 0,
        type: e.type || "expression",
        description: e.description || "",
        state: e.state || [],
        callStack: e.callStack || [],
        heap: e.heap || {},
        timestamp: e.timestamp || Date.now(),
      })),
      totalSteps: traceEvents.length,
      maxDepth,
      summary,
    };

    const consoleOutput = traceEvents
      .filter((e: any) => e.type === "console_output")
      .map((e: any) => e.message || "")
      .join("\n");

    return {
      output: output.length > 0 ? output.join("\n") : consoleOutput,
      error: events.some((e) => e.type === "error") ? events.find((e) => e.type === "error")!.message || "Unknown error" : null,
      events,
      executionTime,
      memoryUsed: 0,
      trace,
    };
  } catch (e) {
    return {
      output: "",
      error: (e as Error).message || "Trace execution failed",
      events: [],
      executionTime: Date.now() - startTime,
      memoryUsed: 0,
    };
  }
}