import type { DiagramConfig } from "@/types";

export interface GenerateDiagramInput {
  code: string;
  type: "flowchart" | "sequence" | "class" | "state" | "er";
  title?: string;
  context?: string;
}

export function generateFlowchartFromCode(code: string): DiagramConfig {
  const lines = code.split("\n").filter((l) => l.trim());
  const nodes: string[] = [];
  const edges: string[] = [];
  const nodeIds = new Set<string>();
  let nodeCounter = 0;

  const fnDefRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const fnCallRegex = /(\w+)\s*\(([^)]*)\)/g;
  const ifRegex = /if\s*\(([^)]*)\)/;
  const forRegex = /for\s*\(([^)]*)\)/;
  const whileRegex = /while\s*\(([^)]*)\)/;
  const returnRegex = /return\s+(.+)/;
  const varRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(.+)/;

  nodes.push(`  Start["Start"]`);
  nodeIds.add("Start");

  let currentNode = "Start";
  let insideFunction: string | null = null;
  let insideLoop = false;
  let loopStartNode = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("//")) continue;

    const fnDefMatch = line.match(fnDefRegex);
    if (fnDefMatch) {
      const fnName = fnDefMatch[1];
      const fnNode = `  F_${fnName}["${fnName}(${fnDefMatch[2]})"]`;
      if (!nodeIds.has(fnNode)) {
        nodes.push(fnNode);
        nodeIds.add(fnNode);
      }
      edges.push(`  ${currentNode} --> F_${fnName}`);
      currentNode = `F_${fnName}`;
      insideFunction = fnName;
      continue;
    }

    const ifMatch = line.match(ifRegex);
    if (ifMatch) {
      const condNode = `  C${++nodeCounter}{"${ifMatch[1].substring(0, 30)}"}`;
      nodes.push(condNode);
      edges.push(`  ${currentNode} --> C${nodeCounter}`);
      currentNode = `C${nodeCounter}`;
      continue;
    }

    const forMatch = line.match(forRegex);
    const whileMatch = line.match(whileRegex);
    if (forMatch || whileMatch) {
      const loopNode = `  L${++nodeCounter}{"Loop: ${(forMatch || whileMatch)![1].substring(0, 25)}"}`;
      nodes.push(loopNode);
      edges.push(`  ${currentNode} --> L${nodeCounter}`);
      currentNode = `L${nodeCounter}`;
      insideLoop = true;
      loopStartNode = currentNode;
      continue;
    }

    if (line === "}" && insideLoop) {
      edges.push(`  ${currentNode} --> ${loopStartNode}`);
      insideLoop = false;
      continue;
    }

    if (line === "}" && insideFunction) {
      const endNode = `  E_${insideFunction}["End ${insideFunction}"]`;
      nodes.push(endNode);
      edges.push(`  ${currentNode} --> E_${insideFunction}`);
      currentNode = `E_${insideFunction}`;
      insideFunction = null;
      continue;
    }

    const varMatch = line.match(varRegex);
    if (varMatch) {
      const opNode = `  V${++nodeCounter}["${varMatch[1]} = ..."]`;
      nodes.push(opNode);
      edges.push(`  ${currentNode} --> V${nodeCounter}`);
      currentNode = `V${nodeCounter}`;
      continue;
    }

    if (line.includes("console.log")) {
      const logNode = `  O${++nodeCounter}["console.log"]`;
      nodes.push(logNode);
      edges.push(`  ${currentNode} --> O${nodeCounter}`);
      currentNode = `O${nodeCounter}`;
      continue;
    }

    const returnMatch = line.match(returnRegex);
    if (returnMatch) {
      const retNode = `  R${++nodeCounter}["return ${returnMatch[1].substring(0, 25)}"]`;
      nodes.push(retNode);
      edges.push(`  ${currentNode} --> R${nodeCounter}`);
      currentNode = `R${nodeCounter}`;
      continue;
    }
  }

  nodes.push(`  End["End"]`);
  edges.push(`  ${currentNode} --> End`);

  return {
    type: "flowchart",
    content: `flowchart TD\n${nodes.join("\n")}\n${edges.join("\n")}`,
    caption: "Code Execution Flow",
    theme: "default",
  };
}

export function generateSequenceFromCode(code: string): DiagramConfig {
  const lines = code.split("\n").filter((l) => l.trim());
  const participants = new Set<string>();
  const messages: string[] = [];
  let stepCounter = 0;

  const fnDefRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/;
  const fnCallRegex = /(\w+)\s*\(([^)]*)\)/g;

  participants.add("Main");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;

    const fnDefMatch = trimmed.match(fnDefRegex);
    if (fnDefMatch) {
      participants.add(fnDefMatch[1]);
      messages.push(`  Main->>+${fnDefMatch[1]}: call ${fnDefMatch[1]}(${fnDefMatch[2]})`);
      continue;
    }

    if (trimmed.includes("return")) {
      const activeFns = Array.from(participants).filter((p) => p !== "Main");
      if (activeFns.length > 0) {
        messages.push(`  ${activeFns[activeFns.length - 1]}-->>-Main: return`);
      }
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = fnCallRegex.exec(trimmed)) !== null) {
      const calledFn = match[1];
      if (calledFn !== "function" && calledFn !== "if" && calledFn !== "for" && calledFn !== "while" && calledFn !== "console") {
        participants.add(calledFn);
        messages.push(`  Main->>${calledFn}: ${match[1]}(${match[2]})`);
        messages.push(`  ${calledFn}-->>Main: result`);
      }
    }
    fnCallRegex.lastIndex = 0;

    stepCounter++;
  }

  const participantList = Array.from(participants).map((p) => `  participant ${p}`).join("\n");

  return {
    type: "sequence",
    content: `sequenceDiagram\n${participantList}\n${messages.join("\n")}`,
    caption: "Function Call Sequence",
    theme: "default",
  };
}

export function generateClassFromCode(code: string): DiagramConfig {
  const lines = code.split("\n").filter((l) => l.trim());
  const classes = new Map<string, { methods: string[]; properties: string[] }>();

  const classRegex = /class\s+(\w+)/;
  const methodRegex = /(\w+)\s*\(([^)]*)\)\s*\{/;
  const propRegex = /this\.(\w+)\s*=\s*(.+)/;

  let currentClass = "";

  for (const line of lines) {
    const trimmed = line.trim();

    const classMatch = trimmed.match(classRegex);
    if (classMatch) {
      currentClass = classMatch[1];
      if (!classes.has(currentClass)) {
        classes.set(currentClass, { methods: [], properties: [] });
      }
      continue;
    }

    if (currentClass) {
      const methodMatch = trimmed.match(methodRegex);
      if (methodMatch && !["if", "for", "while"].includes(methodMatch[1])) {
        const params = methodMatch[2].split(",").map((p) => p.trim()).filter(Boolean);
        const returnType = methodMatch[1] === "constructor" ? "" : " unknown";
        const methodName = methodMatch[1] === "constructor" ? methodMatch[1] : methodMatch[1];
        classes.get(currentClass)!.methods.push(
          `    +${methodName}(${params.join(", ")})${returnType}`
        );
        continue;
      }

      const propMatch = trimmed.match(propRegex);
      if (propMatch) {
        classes.get(currentClass)!.properties.push(`    +${propMatch[1]}: unknown`);
        continue;
      }
    }
  }

  const classDefs: string[] = [];
  for (const [name, def] of classes) {
    const parts = [`  class ${name} {`];
    if (def.properties.length > 0) parts.push(...def.properties);
    if (def.methods.length > 0) parts.push(...def.methods);
    parts.push("  }");
    classDefs.push(parts.join("\n"));
  }

  return {
    type: "class",
    content: `classDiagram\n${classDefs.join("\n")}`,
    caption: "Class Structure",
    theme: "default",
  };
}

export function generateStateDiagram(code: string): DiagramConfig {
  const states = new Set<string>();
  const transitions: string[] = [];

  const ifRegex = /if\s*\(([^)]*)\)/;
  const elseRegex = /else\s*\{/;
  const returnRegex = /return\s+(.+)/;

  states.add("[*]");
  states.add("Start");

  let currentState = "Start";
  let stateCounter = 0;

  const lines = code.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    const ifMatch = trimmed.match(ifRegex);
    if (ifMatch) {
      const trueState = `State${++stateCounter}`;
      states.add(trueState);
      transitions.push(`  ${currentState} --> ${trueState}: ${ifMatch[1].substring(0, 20)}`);
      currentState = trueState;
      continue;
    }

    if (elseRegex.test(trimmed)) {
      const elseState = `State${++stateCounter}`;
      states.add(elseState);
      transitions.push(`  ${currentState} --> ${elseState}: else`);
      currentState = elseState;
      continue;
    }

    const returnMatch = trimmed.match(returnRegex);
    if (returnMatch) {
      transitions.push(`  ${currentState} --> [*]: return`);
      currentState = "[*]";
      continue;
    }
  }

  transitions.push(`  ${currentState} --> [*]`);

  return {
    type: "state",
    content: `stateDiagram-v2\n${transitions.join("\n")}`,
    caption: "State Flow",
    theme: "default",
  };
}

export function generateDiagram(
  input: GenerateDiagramInput
): DiagramConfig {
  switch (input.type) {
    case "flowchart":
      return generateFlowchartFromCode(input.code);
    case "sequence":
      return generateSequenceFromCode(input.code);
    case "class":
      return generateClassFromCode(input.code);
    case "state":
      return generateStateDiagram(input.code);
    case "er":
      return generateClassFromCode(input.code);
    default:
      return generateFlowchartFromCode(input.code);
  }
}