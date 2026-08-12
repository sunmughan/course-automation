import type { ExecutionEvent, ExecutionResult } from "@/types";

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
  language: string = "javascript"
): Promise<ExecutionResult> {
  const startTime = Date.now();

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

  const wrappedCode = wrapCodeWithInterception(trimmedCode);

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