import { spawn } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ExecutionEvent, ExecutionResult, TraceStep } from "@/types";
import { normalizeExecutionEvents } from "./event-normalizer";
import { instrumentCode, buildTraceWrapper, analyzeTrace } from "./tracer";

const DEFAULT_MAX_EXECUTION_TIME_MS = 5000;
const MAX_OUTPUT_LENGTH = 50000;

function sanitizeCode(code: string): void {
  const dangerousPatterns: [RegExp, string][] = [
    [/process\.(kill|chdir|abort|dlopen|binding)/, "process system control"],
    [/__proto__/, "__proto__"],
    [/eval\s*\(/, "eval()"],
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
  options?: { trace?: boolean; timeoutMs?: number }
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const enableTrace = options?.trace ?? false;
  const timeoutMs = options?.timeoutMs && options.timeoutMs > 0 && options.timeoutMs <= 30000
    ? options.timeoutMs
    : DEFAULT_MAX_EXECUTION_TIME_MS;

  if (language !== "javascript") {
    return {
      output: "",
      error: `Language '${language}' is not supported. Only JavaScript is currently available.`,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
      exitCode: 1,
      status: "failed",
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
      exitCode: 1,
      status: "failed",
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
      exitCode: 1,
      status: "failed",
    };
  }

  if (enableTrace) {
    return executeWithTrace(trimmedCode, startTime, timeoutMs);
  }

  return executeSimple(trimmedCode, startTime, timeoutMs);
}

function runNodeIsolated(
  runnerScript: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean; memoryUsed: number }> {
  return new Promise(async (resolve) => {
    const workDir = join(tmpdir(), `js-run-${randomUUID()}`);
    let isCleanedUp = false;

    const cleanup = async () => {
      if (!isCleanedUp) {
        isCleanedUp = true;
        try {
          await rm(workDir, { recursive: true, force: true });
        } catch {}
      }
    };

    try {
      await mkdir(workDir, { recursive: true });
      const scriptPath = join(workDir, "runner.js");
      await writeFile(scriptPath, runnerScript, "utf-8");

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const proc = spawn(
        process.execPath,
        ["--no-warnings", "--max-old-space-size=64", scriptPath],
        {
          cwd: workDir,
          env: {
            NODE_ENV: "production",
            LANG: "en_US.UTF-8",
          },
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          proc.kill("SIGKILL");
        } catch {}
      }, timeoutMs);

      proc.stdout.on("data", (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT_LENGTH * 2) {
          stdout += chunk.toString("utf-8");
        }
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        if (stderr.length < MAX_OUTPUT_LENGTH) {
          stderr += chunk.toString("utf-8");
        }
      });

      proc.on("close", async (code) => {
        clearTimeout(timer);
        await cleanup();

        if (timedOut) {
          resolve({
            stdout: "",
            stderr: `Execution timed out after ${Math.round(timeoutMs / 1000)} seconds`,
            exitCode: 124,
            timedOut: true,
            memoryUsed: 0,
          });
          return;
        }

        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          timedOut: false,
          memoryUsed: 0,
        });
      });

      proc.on("error", async (err) => {
        clearTimeout(timer);
        await cleanup();
        resolve({
          stdout: "",
          stderr: err.message || "Failed to spawn Node process",
          exitCode: 1,
          timedOut: false,
          memoryUsed: 0,
        });
      });
    } catch (err) {
      await cleanup();
      resolve({
        stdout: "",
        stderr: err instanceof Error ? err.message : "Isolation setup error",
        exitCode: 1,
        timedOut: false,
        memoryUsed: 0,
      });
    }
  });
}

async function executeSimple(
  code: string,
  startTime: number,
  timeoutMs: number
): Promise<ExecutionResult> {
  const runnerScript = `
"use strict";
var __logs = [];
function __safeFormat(a) {
  try {
    if (a === undefined) return "undefined";
    if (a === null) return "null";
    if (typeof a === "function") return "[Function" + (a.name ? " " + a.name : "") + "]";
    if (typeof a === "symbol") return a.toString();
    if (typeof a === "bigint") return a.toString() + "n";
    if (typeof a !== "object") return String(a);
    var seen = new Set();
    return JSON.stringify(a, function(k, v) {
      if (typeof v === "function") return "[Function" + (v.name ? " " + v.name : "") + "]";
      if (typeof v === "symbol") return v.toString();
      if (typeof v === "bigint") return v.toString() + "n";
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
        if (v.constructor && v.constructor.name && ["EventEmitter", "Socket", "Server", "WriteStream", "ReadStream"].includes(v.constructor.name)) {
          return "[" + v.constructor.name + "]";
        }
      }
      return v;
    });
  } catch(e) {
    try {
      if (a && a.constructor && a.constructor.name) return "[" + a.constructor.name + "]";
    } catch(_) {}
    return String(a);
  }
}
var console = {
  log: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __logs.push(formatted);
  },
  error: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __logs.push('[ERROR] ' + formatted);
  },
  warn: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __logs.push('[WARN] ' + formatted);
  },
  info: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __logs.push('[INFO] ' + formatted);
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

var __storage = {};
var localStorage = {
  getItem: function(k) { return __storage[k] !== undefined ? __storage[k] : null; },
  setItem: function(k, v) { __storage[k] = String(v); },
  removeItem: function(k) { delete __storage[k]; },
  clear: function() { __storage = {}; }
};
var sessionStorage = localStorage;
var document = {
  getElementById: function(id) {
    return {
      id: id,
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){ return false; } },
      addEventListener: function(evt, handler) {},
      appendChild: function(c) { return c; },
      remove: function() {}
    };
  },
  querySelector: function(sel) { return this.getElementById(sel); },
  querySelectorAll: function() { return []; },
  createElement: function(tag) { return this.getElementById(tag); },
  body: { appendChild: function(c) { return c; } },
  addEventListener: function() {}
};
var window = typeof globalThis !== 'undefined' ? globalThis : {};
window.document = document;
window.localStorage = localStorage;
window.sessionStorage = sessionStorage;
window.alert = function(msg) { console.log('[Alert]', msg); };
window.prompt = function() { return ''; };
window.confirm = function() { return true; };

try {
  ${code}
  process.stdout.write(JSON.stringify({ output: __logs, error: null }));
} catch (__err) {
  process.stdout.write(JSON.stringify({ output: __logs, error: __err.message || String(__err) }));
}
`;

  const runResult = await runNodeIsolated(runnerScript, timeoutMs);
  const executionTime = Date.now() - startTime;

  if (runResult.timedOut) {
    const errorMsg = `Execution timed out after ${Math.round(timeoutMs / 1000)} seconds`;
    return {
      output: `Execution timed out (${Math.round(timeoutMs / 1000)} second limit)`,
      error: errorMsg,
      events: [{ step: 1, type: "error", message: errorMsg }],
      executionTime,
      memoryUsed: 0,
      exitCode: 124,
      status: "timeout",
    };
  }

  let parsedOutput: string[] = [];
  let parsedError: string | null = null;

  try {
    const json = JSON.parse(runResult.stdout.trim());
    parsedOutput = Array.isArray(json.output) ? json.output : [];
    parsedError = json.error || null;
  } catch {
    if (runResult.stderr) {
      parsedError = runResult.stderr.trim();
    } else if (runResult.stdout) {
      parsedOutput = [runResult.stdout.trim()];
    }
  }

  if (runResult.exitCode !== 0 && !parsedError) {
    parsedError = runResult.stderr || `Process exited with code ${runResult.exitCode}`;
  }

  const events: ExecutionEvent[] = [];
  if (parsedOutput.length > 0) {
    events.push({
      step: 1,
      type: "output",
      message: parsedOutput.join("\n"),
    });
  }

  if (parsedError) {
    events.push({
      step: 1,
      type: "error",
      message: parsedError,
    });
  }

  return {
    output: parsedOutput.join("\n"),
    error: parsedError,
    events,
    executionTime,
    memoryUsed: runResult.memoryUsed,
    exitCode: parsedError ? (runResult.exitCode || 1) : 0,
    status: parsedError ? "error" : "success",
  };
}

async function executeWithTrace(
  code: string,
  startTime: number,
  timeoutMs: number
): Promise<ExecutionResult> {
  const { instrumentedCode } = instrumentCode(code);
  const traceBody = buildTraceWrapper(instrumentedCode);

  const runnerScript = `
"use strict";
var __consoleOutputs = [];
function __safeFormat(a) {
  try {
    if (a === undefined) return "undefined";
    if (a === null) return "null";
    if (typeof a === "function") return "[Function" + (a.name ? " " + a.name : "") + "]";
    if (typeof a === "symbol") return a.toString();
    if (typeof a === "bigint") return a.toString() + "n";
    if (typeof a !== "object") return String(a);
    var seen = new Set();
    return JSON.stringify(a, function(k, v) {
      if (typeof v === "function") return "[Function" + (v.name ? " " + v.name : "") + "]";
      if (typeof v === "symbol") return v.toString();
      if (typeof v === "bigint") return v.toString() + "n";
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
        if (v.constructor && v.constructor.name && ["EventEmitter", "Socket", "Server", "WriteStream", "ReadStream"].includes(v.constructor.name)) {
          return "[" + v.constructor.name + "]";
        }
      }
      return v;
    });
  } catch(e) {
    try {
      if (a && a.constructor && a.constructor.name) return "[" + a.constructor.name + "]";
    } catch(_) {}
    return String(a);
  }
}
function __safeJsonStringify(obj) {
  var seen = new Set();
  return JSON.stringify(obj, function(k, v) {
    if (typeof v === "function") return "[Function" + (v.name ? " " + v.name : "") + "]";
    if (typeof v === "symbol") return v.toString();
    if (typeof v === "bigint") return v.toString() + "n";
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
      if (v.constructor && v.constructor.name && ["EventEmitter", "Socket", "Server", "WriteStream", "ReadStream"].includes(v.constructor.name)) {
        return "[" + v.constructor.name + "]";
      }
    }
    return v;
  });
}
var console = {
  log: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __consoleOutputs.push(formatted);
    if (typeof __trace === 'function') {
      __trace('console_output', 'console.log', formatted, 0, typeof depth !== 'undefined' ? depth : 0);
    }
  },
  error: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __consoleOutputs.push('[ERROR] ' + formatted);
    if (typeof __trace === 'function') {
      __trace('console_output', 'console.error', formatted, 0, typeof depth !== 'undefined' ? depth : 0);
    }
  },
  warn: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __consoleOutputs.push('[WARN] ' + formatted);
    if (typeof __trace === 'function') {
      __trace('console_output', 'console.warn', formatted, 0, typeof depth !== 'undefined' ? depth : 0);
    }
  },
  info: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(__safeFormat).join(' ');
    __consoleOutputs.push('[INFO] ' + formatted);
    if (typeof __trace === 'function') {
      __trace('console_output', 'console.info', formatted, 0, typeof depth !== 'undefined' ? depth : 0);
    }
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

var __storage = {};
var localStorage = {
  getItem: function(k) { return __storage[k] !== undefined ? __storage[k] : null; },
  setItem: function(k, v) { __storage[k] = String(v); },
  removeItem: function(k) { delete __storage[k]; },
  clear: function() { __storage = {}; }
};
var sessionStorage = localStorage;
var document = {
  getElementById: function(id) {
    return {
      id: id,
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){ return false; } },
      addEventListener: function(evt, handler) {},
      appendChild: function(c) { return c; },
      remove: function() {}
    };
  },
  querySelector: function(sel) { return this.getElementById(sel); },
  querySelectorAll: function() { return []; },
  createElement: function(tag) { return this.getElementById(tag); },
  body: { appendChild: function(c) { return c; } },
  addEventListener: function() {}
};
var window = typeof globalThis !== 'undefined' ? globalThis : {};
window.document = document;
window.localStorage = localStorage;
window.sessionStorage = sessionStorage;
window.alert = function(msg) { console.log('[Alert]', msg); };
window.prompt = function() { return ''; };
window.confirm = function() { return true; };

(async function() {
  try {
    var __traceEvents = await (async function() {
      ${traceBody}
    })();
    process.stdout.write("\\n__TRACE_OUTPUT_START__" + __safeJsonStringify({ traceEvents: __traceEvents || [], consoleOutput: __consoleOutputs }) + "__TRACE_OUTPUT_END__\\n");
  } catch(err) {
    process.stdout.write("\\n__TRACE_OUTPUT_START__" + __safeJsonStringify({ traceEvents: [{ step: 0, type: "ERROR", message: err.message || String(err), line: 0, scope: "global", callStack: [], timestamp: Date.now() }], consoleOutput: __consoleOutputs }) + "__TRACE_OUTPUT_END__\\n");
  }
})();
`;

  const runResult = await runNodeIsolated(runnerScript, timeoutMs);
  const executionTime = Date.now() - startTime;

  if (runResult.timedOut) {
    const errorMsg = `Execution timed out after ${Math.round(timeoutMs / 1000)} seconds`;
    return {
      output: "",
      error: errorMsg,
      events: [{ step: 1, type: "error", message: errorMsg }],
      executionTime,
      memoryUsed: 0,
      exitCode: 124,
      status: "timeout",
    };
  }

  let rawTraceEvents: unknown[] = [];
  let runnerConsoleOutput: string[] = [];

  const markerMatch = runResult.stdout.match(/__TRACE_OUTPUT_START__([\s\S]*?)__TRACE_OUTPUT_END__/);
  if (markerMatch && markerMatch[1]) {
    try {
      const parsed = JSON.parse(markerMatch[1]);
      rawTraceEvents = Array.isArray(parsed.traceEvents) ? parsed.traceEvents : [];
      runnerConsoleOutput = Array.isArray(parsed.consoleOutput) ? parsed.consoleOutput : [];
    } catch {}
  }

  if (rawTraceEvents.length === 0 && runResult.stdout) {
    try {
      const parsed = JSON.parse(runResult.stdout.trim());
      if (Array.isArray(parsed)) {
        rawTraceEvents = parsed;
      }
    } catch {
      if (runResult.stderr) {
        rawTraceEvents = [{
          step: 0,
          type: "error",
          message: runResult.stderr,
          line: 0,
          scope: "global",
          callStack: [],
          timestamp: Date.now(),
        }];
      }
    }
  }

  const events = normalizeExecutionEvents(rawTraceEvents as Parameters<typeof normalizeExecutionEvents>[0]);
  const rawTraceSteps = rawTraceEvents as TraceStep[];
  const { summary, maxDepth } = analyzeTrace(rawTraceSteps);

  const trace = {
    steps: rawTraceSteps.map((event, index) => ({
      step: event.step ?? index,
      line: event.line ?? 0,
      depth: event.depth ?? 0,
      type: event.type ?? "expression",
      description: event.description ?? "",
      state: event.state ?? [],
      callStack: event.callStack ?? [],
      heap: event.heap ?? {},
      timestamp: event.timestamp ?? Date.now(),
    })),
    totalSteps: rawTraceEvents.length,
    maxDepth,
    summary,
  };

  const consoleOutput = runnerConsoleOutput.length > 0
    ? runnerConsoleOutput.join("\n")
    : (rawTraceSteps as any[])
        .filter((event) => event.type === "console_output" || event.type === "OUTPUT")
        .map((event) => event.value ?? event.description ?? event.payload?.message ?? "")
        .join("\n");

  const errorEvent = events.find((e) => e.type === "ERROR" || (e.type as string) === "error");
  const errorMessage = errorEvent ? errorEvent.message || (errorEvent.payload?.message as string) || "Runtime error" : runResult.stderr ? runResult.stderr.trim() : null;

  return {
    output: consoleOutput,
    error: errorMessage,
    events,
    executionTime,
    memoryUsed: 0,
    exitCode: errorMessage ? 1 : 0,
    status: errorMessage ? "error" : "success",
    trace,
  };
}