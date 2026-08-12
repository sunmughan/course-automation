import type { TraceStep, TraceStepType, VariableSnapshot } from "@/types";

interface InstrumentationResult {
  instrumentedCode: string;
  lineMap: Map<number, number>;
}

export function instrumentCode(code: string): InstrumentationResult {
  const lines = code.split("\n");
  const lineMap = new Map<number, number>();
  const instrumented: string[] = [];
  let traceLine = 0;
  let depth = 0;

  const fnCallRegex = /^(\s*)(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/;
  const namedFnRegex = /^(\s*)(?:async\s+)?function\s+(\w+)\s*\(/;
  const varDeclRegex = /^(\s*)(?:const|let|var)\s+(\w+)\s*=\s*(.+?);?\s*$/;
  const varDeclNoInitRegex = /^(\s*)(?:let|var)\s+(\w+)\s*;?\s*$/;
  const reassignRegex = /^(\s*)(\w+)\s*=\s*(.+?);?\s*$/;
  const forLoopRegex = /^(\s*)for\s*\(/;
  const whileLoopRegex = /^(\s*)while\s*\(/;
  const ifRegex = /^(\s*)if\s*\(/;
  const consoleRegex = /^(\s*)console\.(log|error|warn|info)\s*\(/;
  const returnRegex = /^(\s*)return\s/;

  for (let i = 0; i < lines.length; i++) {
    const originalLine = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed === "}" || trimmed === "{" || trimmed.startsWith("}")) {
      instrumented.push(line);
      traceLine++;
      lineMap.set(traceLine, originalLine);
      continue;
    }

    const indent = line.match(/^(\s*)/)?.[1] || "";

    const fnCallMatch = trimmed.match(fnCallRegex);
    const namedFnMatch = trimmed.match(namedFnRegex);

    if (fnCallMatch || namedFnMatch) {
      const fnName = fnCallMatch ? fnCallMatch[2] : namedFnMatch![2];
      instrumented.push(`${indent}__trace("function_call", "${fnName}", null, ${originalLine}, ${depth});`);
      traceLine++;
      lineMap.set(traceLine, originalLine);

      if (fnCallMatch) {
        const bodyStart = trimmed.indexOf("=>");
        const params = trimmed.slice(trimmed.indexOf("("), bodyStart > 0 ? bodyStart : trimmed.length);
        const arrowBody = trimmed.slice(bodyStart > 0 ? bodyStart + 2 : trimmed.length);
        instrumented.push(
          `${indent}const ${fnName} = (function() { __trace("function_call", "${fnName}", null, ${originalLine}, ${depth}); depth++; return ${params} => { const __result = (${arrowBody}); depth--; __trace("function_return", "${fnName}", __result, ${originalLine}, depth); return __result; }; })();`
        );
      } else {
        instrumented.push(line);
      }
      traceLine += fnCallMatch ? 2 : 1;
      lineMap.set(traceLine, originalLine);
      continue;
    }

    const varDeclMatch = trimmed.match(varDeclRegex);
    const varNoInitMatch = trimmed.match(varDeclNoInitRegex);

    if (varDeclMatch && !varDeclMatch[3].includes("=>") && !varDeclMatch[3].includes("function")) {
      const varName = varDeclMatch[2];
      const valueExpr = varDeclMatch[3].replace(/;$/, "");
      instrumented.push(`${indent}const ${varName} = ${valueExpr};`);
      instrumented.push(`${indent}__trace("variable_declare", "${varName}", ${varName}, ${originalLine}, ${depth});`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (varNoInitMatch) {
      const varName = varNoInitMatch[2];
      instrumented.push(`${indent}let ${varName} = undefined;`);
      instrumented.push(`${indent}__trace("variable_declare", "${varName}", ${varName}, ${originalLine}, ${depth});`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    const reassignMatch = trimmed.match(reassignRegex);
    if (reassignMatch && !["if", "for", "while", "return", "const", "let", "var"].includes(reassignMatch[2])) {
      const varName = reassignMatch[2];
      const valueExpr = reassignMatch[3].replace(/;$/, "");
      instrumented.push(`${indent}${varName} = ${valueExpr};`);
      instrumented.push(`${indent}__trace("variable_assign", "${varName}", ${varName}, ${originalLine}, ${depth});`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (forLoopRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("loop_start", null, null, ${originalLine}, ${depth});`);
      instrumented.push(`${indent}let __loopIter_${originalLine} = 0;`);
      instrumented.push(line);
      traceLine += 3;
      lineMap.set(traceLine - 2, originalLine);
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (whileLoopRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("loop_start", null, null, ${originalLine}, ${depth});`);
      instrumented.push(line);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (ifRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("conditional", null, null, ${originalLine}, ${depth});`);
      instrumented.push(line);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (consoleRegex.test(trimmed)) {
      instrumented.push(line);
      instrumented.push(`${indent}__trace("console_output", null, null, ${originalLine}, ${depth});`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (returnRegex.test(trimmed) && !trimmed.includes("=>")) {
      const returnValue = trimmed.replace(/^return\s*/, "").replace(/;$/, "");
      instrumented.push(`${indent}const __retVal_${originalLine} = ${returnValue || "undefined"};`);
      instrumented.push(`${indent}__trace("return", null, __retVal_${originalLine}, ${originalLine}, ${depth});`);
      instrumented.push(`${indent}return __retVal_${originalLine};`);
      traceLine += 3;
      lineMap.set(traceLine - 2, originalLine);
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    instrumented.push(line);
    traceLine++;
    lineMap.set(traceLine, originalLine);
  }

  return { instrumentedCode: instrumented.join("\n"), lineMap };
}

export function buildTraceWrapper(instrumentedCode: string): string {
  return `
var __traceEvents = [];
var __traceStep = 0;
var __variableSnapshots = {};

function __snapshotAll() {
  var snapshots = [];
  for (var key in __variableSnapshots) {
    if (__variableSnapshots.hasOwnProperty(key)) {
      snapshots.push(__variableSnapshots[key]);
    }
  }
  return snapshots;
}

function __trace(type, name, value, line, depth) {
  try {
    var snapshot = {
      step: __traceStep,
      line: line,
      depth: depth || 0,
      type: type,
      description: buildDescription(type, name, value, line),
      state: __snapshotAll(),
      callStack: [],
      heap: {},
      timestamp: Date.now()
    };

    if (type === "variable_declare" || type === "variable_assign") {
      var serialized = safeSerialize(value);
      var prevSnapshot = __variableSnapshots[name];
      __variableSnapshots[name] = {
        name: name,
        value: serialized,
        type: typeof value,
        scope: depth > 0 ? "function" : "global",
        changed: prevSnapshot ? prevSnapshot.value !== serialized : false,
        previousValue: prevSnapshot ? prevSnapshot.value : undefined
      };
    }

    if (type === "function_call") {
      __traceEvents.push({
        step: __traceStep,
        type: "function_call",
        variable: name,
        line: line,
        message: "Calling " + name + "()",
        scope: "function",
        callStack: [],
        timestamp: Date.now()
      });
      __traceStep++;
    }

    __traceEvents.push(snapshot);
    __traceStep++;
  } catch(e) {}
}

function buildDescription(type, name, value, line) {
  switch(type) {
    case "variable_declare": return "Declare '" + name + "' = " + safeSerialize(value);
    case "variable_assign": return "Assign '" + name + "' = " + safeSerialize(value);
    case "function_call": return "Call " + name + "()";
    case "function_return": return name + "() returns " + safeSerialize(value);
    case "loop_start": return "Loop starts";
    case "loop_iteration": return "Loop iteration";
    case "loop_end": return "Loop ends";
    case "conditional": return "Conditional check";
    case "console_output": return "Console output";
    case "error": return "Error: " + (name || "");
    case "return": return "Returns " + safeSerialize(value);
    default: return type;
  }
}

function safeSerialize(val) {
  try {
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (typeof val === "function") return "[Function]";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  } catch(e) {
    return "[Unserializable]";
  }
}

var depth = 0;

try {
  ${instrumentedCode}
} catch(__traceErr) {
  __traceEvents.push({
    step: __traceStep,
    type: "error",
    message: __traceErr.message || String(__traceErr),
    line: 0,
    scope: "global",
    callStack: [],
    timestamp: Date.now()
  });
}

return __traceEvents;
`;
}

export function analyzeTrace(
  rawEvents: TraceStep[]
): {
  summary: {
    functionCalls: number;
    variableChanges: number;
    loopIterations: number;
    conditionals: number;
    errors: number;
    consoleOutputs: number;
  };
  maxDepth: number;
} {
  const summary = {
    functionCalls: 0,
    variableChanges: 0,
    loopIterations: 0,
    conditionals: 0,
    errors: 0,
    consoleOutputs: 0,
  };
  let maxDepth = 0;

  for (const event of rawEvents) {
    if (event.depth > maxDepth) maxDepth = event.depth;

    switch (event.type as TraceStepType) {
      case "function_call":
        summary.functionCalls++;
        break;
      case "variable_declare":
      case "variable_assign":
        summary.variableChanges++;
        break;
      case "loop_start":
      case "loop_iteration":
        summary.loopIterations++;
        break;
      case "conditional":
        summary.conditionals++;
        break;
      case "error":
        summary.errors++;
        break;
      case "console_output":
        summary.consoleOutputs++;
        break;
    }
  }

  return { summary, maxDepth };
}