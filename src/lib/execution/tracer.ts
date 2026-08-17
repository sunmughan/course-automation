import type { TraceStep, TraceStepType, CanonicalExecutionEventType } from "@/types";

interface InstrumentationResult {
  instrumentedCode: string;
  lineMap: Map<number, number>;
}

export function instrumentCode(code: string): InstrumentationResult {
  const lines = code.split("\n");
  const lineMap = new Map<number, number>();
  const instrumented: string[] = [];
  let traceLine = 0;
  const depth = 0;

  const fnCallRegex = /^(\s*)(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/;
  const namedFnRegex = /^(\s*)(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const varDeclRegex = /^(\s*)(const|let|var)\s+(\w+)\s*=\s*(.+?);?\s*$/;
  const varDeclNoInitRegex = /^(\s*)(let|var)\s+(\w+)\s*;?\s*$/;
  const reassignRegex = /^(\s*)(\w+)\s*=\s*(.+?);?\s*$/;
  const forLoopRegex = /^(\s*)for\s*\(/;
  const whileLoopRegex = /^(\s*)while\s*\(/;
  const ifRegex = /^(\s*)if\s*\(/;
  const consoleRegex = /^(\s*)console\.(log|error|warn|info)\s*\(/;
  const returnRegex = /^(\s*)return\s/;

  // Emit PROGRAM_START at the very beginning of the instrumented code
  instrumented.push(`__trace("PROGRAM_START", null, null, 1, 0, { message: "Program started" });`);
  traceLine++;
  lineMap.set(traceLine, 1);

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

    if (fnCallMatch) {
      const fnName = fnCallMatch[2];
      const bodyStart = trimmed.indexOf("=>");
      const params = trimmed.slice(trimmed.indexOf("("), bodyStart > 0 ? bodyStart : trimmed.length);
      const arrowBody = trimmed.slice(bodyStart > 0 ? bodyStart + 2 : trimmed.length);
      instrumented.push(
        `${indent}const ${fnName} = ${params} => { __enterFunction("${fnName}", ${originalLine}, Array.prototype.slice.call(arguments)); const __result = (${arrowBody}); __exitFunction("${fnName}", __result, ${originalLine}); return __result; };`
      );
      traceLine++;
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (namedFnMatch) {
      const fnName = namedFnMatch[2];
      instrumented.push(line);
      instrumented.push(`${indent}  __enterFunction("${fnName}", ${originalLine}, Array.prototype.slice.call(arguments));`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    const varDeclMatch = trimmed.match(varDeclRegex);
    const varNoInitMatch = trimmed.match(varDeclNoInitRegex);

    if (varDeclMatch && !varDeclMatch[4].includes("=>") && !varDeclMatch[4].includes("function")) {
      const declarationKind = varDeclMatch[2];
      const varName = varDeclMatch[3];
      const valueExpr = varDeclMatch[4].replace(/;$/, "");
      instrumented.push(`${indent}${declarationKind} ${varName} = ${valueExpr};`);
      instrumented.push(`${indent}__traceVarDeclare("${varName}", ${varName}, ${originalLine}, ${depth}, "${declarationKind}");`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (varNoInitMatch) {
      const declarationKind = varNoInitMatch[2];
      const varName = varNoInitMatch[3];
      instrumented.push(`${indent}${declarationKind} ${varName} = undefined;`);
      instrumented.push(`${indent}__traceVarDeclare("${varName}", ${varName}, ${originalLine}, ${depth}, "${declarationKind}");`);
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
      instrumented.push(`${indent}__traceVarAssign("${varName}", ${varName}, ${originalLine}, ${depth});`);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (forLoopRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("LOOP_START", null, null, ${originalLine}, ${depth}, { message: "Loop started" });`);
      instrumented.push(`${indent}let __loopIter_${originalLine} = 0;`);
      instrumented.push(line);
      traceLine += 3;
      lineMap.set(traceLine - 2, originalLine);
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (whileLoopRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("LOOP_START", null, null, ${originalLine}, ${depth}, { message: "Loop started" });`);
      instrumented.push(line);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (ifRegex.test(trimmed)) {
      instrumented.push(`${indent}__trace("CONDITION_CHECK", null, null, ${originalLine}, ${depth}, { condition: "${trimmed.replace(/"/g, '\\"')}" });`);
      instrumented.push(line);
      traceLine += 2;
      lineMap.set(traceLine - 1, originalLine);
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (consoleRegex.test(trimmed)) {
      instrumented.push(line);
      traceLine++;
      lineMap.set(traceLine, originalLine);
      continue;
    }

    if (returnRegex.test(trimmed) && !trimmed.includes("=>")) {
      const returnValue = trimmed.replace(/^return\s*/, "").replace(/;$/, "");
      instrumented.push(`${indent}const __retVal_${originalLine} = ${returnValue || "undefined"};`);
      instrumented.push(`${indent}__exitFunction(__callStack[__callStack.length - 1], __retVal_${originalLine}, ${originalLine});`);
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

  // Emit PROGRAM_END at the end of the script
  instrumented.push(`__trace("PROGRAM_END", null, null, ${lines.length || 1}, 0, { message: "Program completed", totalSteps: __traceStep });`);
  traceLine++;
  lineMap.set(traceLine, lines.length || 1);

  return { instrumentedCode: instrumented.join("\n"), lineMap };
}

export function buildTraceWrapper(instrumentedCode: string): string {
  return `
var __traceEvents = [];
var __traceStep = 0;
var __variableSnapshots = {};
var __callStack = [];
var depth = 0;

var console = {
  log: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
    }).join(' ');
    if (typeof __consoleOutputs !== 'undefined') {
      __consoleOutputs.push(formatted);
    }
    __trace("OUTPUT", "console.log", formatted, 1, depth, { message: formatted, stream: "stdout" });
  },
  error: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
    }).join(' ');
    if (typeof __consoleOutputs !== 'undefined') {
      __consoleOutputs.push('[ERROR] ' + formatted);
    }
    __trace("OUTPUT", "console.error", formatted, 1, depth, { message: formatted, stream: "stderr" });
  },
  warn: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
    }).join(' ');
    if (typeof __consoleOutputs !== 'undefined') {
      __consoleOutputs.push('[WARN] ' + formatted);
    }
    __trace("OUTPUT", "console.warn", formatted, 1, depth, { message: formatted, stream: "stdout" });
  },
  info: function() {
    var args = Array.prototype.slice.call(arguments);
    var formatted = args.map(function(a) {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e) { return String(a); }
    }).join(' ');
    if (typeof __consoleOutputs !== 'undefined') {
      __consoleOutputs.push('[INFO] ' + formatted);
    }
    __trace("OUTPUT", "console.info", formatted, 1, depth, { message: formatted, stream: "stdout" });
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

function __snapshotAll() {
  var snapshots = [];
  for (var key in __variableSnapshots) {
    if (__variableSnapshots.hasOwnProperty(key)) {
      snapshots.push(__variableSnapshots[key]);
    }
  }
  return snapshots;
}

function __enterFunction(name, line, args) {
  __callStack.push(name);
  depth = __callStack.length;
  __trace("FUNCTION_CALL", name, args, line, depth, { name: name, args: args });
  __trace("CALLSTACK_PUSH", name, __callStack.slice(), line, depth, { name: name, stack: __callStack.slice(), depth: depth });
}

function __exitFunction(name, value, line) {
  __trace("FUNCTION_RETURN", name, value, line, depth, { name: name, returnValue: value });
  if (__callStack.length > 0) {
    __callStack.pop();
  }
  depth = __callStack.length;
  __trace("CALLSTACK_POP", name, __callStack.slice(), line, depth, { name: name, stack: __callStack.slice(), depth: depth });
}

function __traceVarDeclare(name, value, line, depth, kind) {
  __trace("VARIABLE_DECLARE", name, value, line, depth, { name: name, value: value, kind: kind });
  if (value !== null && typeof value === "object") {
    __trace("OBJECT_CREATE", name, value, line, depth, { name: name, objectType: Array.isArray(value) ? "Array" : "Object", properties: value });
  }
}

function __traceVarAssign(name, value, line, depth) {
  var prev = __variableSnapshots[name] ? __variableSnapshots[name].value : undefined;
  __trace("VARIABLE_ASSIGN", name, value, line, depth, { name: name, value: value, previousValue: prev });
  if (value !== null && typeof value === "object") {
    __trace("OBJECT_UPDATE", name, value, line, depth, { name: name, properties: value });
  }
}

function __trace(type, name, value, line, depth, payload) {
  try {
    var rawPayload = payload || {};
    if (name && rawPayload.name === undefined) rawPayload.name = name;
    if (value !== undefined && rawPayload.value === undefined) rawPayload.value = value;

    if (type === "VARIABLE_DECLARE" || type === "VARIABLE_ASSIGN" || type === "variable_declare" || type === "variable_assign") {
      var serialized = safeSerialize(value);
      var prevSnapshot = __variableSnapshots[name];
      __variableSnapshots[name] = {
        name: name,
        value: value,
        type: typeof value,
        scope: depth > 0 ? "function" : "global",
        changed: prevSnapshot ? prevSnapshot.serialized !== serialized : false,
        previousValue: prevSnapshot ? prevSnapshot.value : undefined,
        serialized: serialized
      };
      if (prevSnapshot && rawPayload.previousValue === undefined) {
        rawPayload.previousValue = prevSnapshot.value;
      }
    }

    var snapshot = {
      id: "evt-" + __traceStep,
      sequence: __traceStep,
      step: __traceStep,
      line: line || 1,
      column: 1,
      depth: depth || 0,
      scope: (depth || 0) > 0 ? "function" : "global",
      type: type,
      name: name,
      value: value,
      description: buildDescription(type, name, value, line),
      payload: rawPayload,
      state: __snapshotAll(),
      callStack: __callStack.slice(),
      heap: {},
      timestamp: Date.now()
    };

    __traceEvents.push(snapshot);
    __traceStep++;
  } catch(e) {}
}

function buildDescription(type, name, value, line) {
  switch(type) {
    case "PROGRAM_START": return "Program started";
    case "PROGRAM_END": return "Program completed";
    case "VARIABLE_DECLARE":
    case "variable_declare": return "Declare '" + name + "' = " + safeSerialize(value);
    case "VARIABLE_ASSIGN":
    case "variable_assign": return "Assign '" + name + "' = " + safeSerialize(value);
    case "FUNCTION_CALL":
    case "function_call": return "Call " + name + "()";
    case "FUNCTION_RETURN":
    case "function_return": return name + "() returns " + safeSerialize(value);
    case "CALLSTACK_PUSH": return "Push '" + name + "' to call stack";
    case "CALLSTACK_POP": return "Pop '" + name + "' from call stack";
    case "OBJECT_CREATE": return "Create object '" + name + "'";
    case "OBJECT_UPDATE": return "Update object '" + name + "'";
    case "LOOP_START":
    case "loop_start": return "Loop starts";
    case "LOOP_ITERATION":
    case "loop_iteration": return "Loop iteration";
    case "LOOP_END":
    case "loop_end": return "Loop ends";
    case "CONDITION_CHECK":
    case "conditional": return "Conditional check";
    case "OUTPUT":
    case "console_output": return "Console output";
    case "ERROR":
    case "error": return "Error: " + (name || "");
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

try {
  ${instrumentedCode}
} catch(__traceErr) {
  __trace("ERROR", __traceErr.name || "Error", __traceErr.message || String(__traceErr), 0, depth, {
    error: __traceErr.message || String(__traceErr),
    stack: __traceErr.stack ? __traceErr.stack.split("\\n") : [],
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

    const t = String(event.type);
    if (t === "FUNCTION_CALL" || t === "function_call") {
      summary.functionCalls++;
    } else if (
      t === "VARIABLE_DECLARE" ||
      t === "VARIABLE_ASSIGN" ||
      t === "variable_declare" ||
      t === "variable_assign" ||
      t === "OBJECT_CREATE" ||
      t === "OBJECT_UPDATE"
    ) {
      summary.variableChanges++;
    } else if (t === "LOOP_START" || t === "LOOP_ITERATION" || t === "loop_start" || t === "loop_iteration") {
      summary.loopIterations++;
    } else if (t === "CONDITION_CHECK" || t === "conditional") {
      summary.conditionals++;
    } else if (t === "ERROR" || t === "error") {
      summary.errors++;
    } else if (t === "OUTPUT" || t === "console_output") {
      summary.consoleOutputs++;
    }
  }

  return { summary, maxDepth };
}