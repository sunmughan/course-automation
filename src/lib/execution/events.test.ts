import { describe, expect, it } from "vitest";
import { executeJavaScript } from "./sandbox";
import { normalizeExecutionEvents, createExecutionEventStream } from "./event-normalizer";
import { instrumentCode, buildTraceWrapper } from "./tracer";

describe("Wave 5: Canonical Execution Event Engine", () => {
  describe("Acceptance Test: Canonical Event Sequence", () => {
    it("emits the full canonical event sequence for the add(2, 3) acceptance snippet", async () => {
      const code = `
function add(a, b) {
  return a + b;
}

const result = add(2, 3);
console.log(result);
`;

      const executionResult = await executeJavaScript(code, "javascript", { trace: true });

      expect(executionResult.error).toBeNull();
      expect(executionResult.events.length).toBeGreaterThan(0);

      const eventTypes = executionResult.events.map((e) => e.type);

      // Verify the acceptance requirement sequence:
      // PROGRAM_START -> FUNCTION_CALL -> CALLSTACK_PUSH -> FUNCTION_RETURN -> CALLSTACK_POP -> VARIABLE_DECLARE/ASSIGN -> OUTPUT -> PROGRAM_END
      expect(eventTypes).toContain("PROGRAM_START");
      expect(eventTypes).toContain("FUNCTION_CALL");
      expect(eventTypes).toContain("CALLSTACK_PUSH");
      expect(eventTypes).toContain("FUNCTION_RETURN");
      expect(eventTypes).toContain("CALLSTACK_POP");
      expect(eventTypes.some((t) => t === "VARIABLE_DECLARE" || t === "VARIABLE_ASSIGN")).toBe(true);
      expect(eventTypes).toContain("OUTPUT");
      expect(eventTypes).toContain("PROGRAM_END");

      // Verify relative order of events
      const programStartIndex = eventTypes.indexOf("PROGRAM_START");
      const fnCallIndex = eventTypes.indexOf("FUNCTION_CALL");
      const callStackPushIndex = eventTypes.indexOf("CALLSTACK_PUSH");
      const fnReturnIndex = eventTypes.indexOf("FUNCTION_RETURN");
      const callStackPopIndex = eventTypes.indexOf("CALLSTACK_POP");
      const varDeclareIndex = eventTypes.findIndex((t) => t === "VARIABLE_DECLARE" || t === "VARIABLE_ASSIGN");
      const outputIndex = eventTypes.indexOf("OUTPUT");
      const programEndIndex = eventTypes.indexOf("PROGRAM_END");

      expect(programStartIndex).toBeLessThan(fnCallIndex);
      expect(fnCallIndex).toBeLessThanOrEqual(callStackPushIndex);
      expect(callStackPushIndex).toBeLessThan(fnReturnIndex);
      expect(fnReturnIndex).toBeLessThanOrEqual(callStackPopIndex);
      expect(callStackPopIndex).toBeLessThan(varDeclareIndex);
      expect(varDeclareIndex).toBeLessThan(outputIndex);
      expect(outputIndex).toBeLessThan(programEndIndex);
    });
  });

  describe("Variable and Object Event Lifecycle", () => {
    it("emits VARIABLE_DECLARE and OBJECT_CREATE for object declarations", async () => {
      const code = `
const student = { name: "Alice", score: 95 };
`;

      const result = await executeJavaScript(code, "javascript", { trace: true });
      const types = result.events.map((e) => e.type);

      expect(types).toContain("VARIABLE_DECLARE");
      expect(types).toContain("OBJECT_CREATE");

      const objEvent = result.events.find((e) => e.type === "OBJECT_CREATE");
      expect(objEvent?.payload?.name).toBe("student");
    });

    it("emits VARIABLE_ASSIGN on variable reassignment", async () => {
      const code = `
let counter = 0;
counter = 1;
`;

      const result = await executeJavaScript(code, "javascript", { trace: true });
      const types = result.events.map((e) => e.type);

      expect(types).toContain("VARIABLE_DECLARE");
      expect(types).toContain("VARIABLE_ASSIGN");

      const assignEvent = result.events.find((e) => e.type === "VARIABLE_ASSIGN");
      expect(assignEvent?.payload?.name).toBe("counter");
      expect(assignEvent?.payload?.value).toBe(1);
    });
  });

  describe("Control Flow: Condition and Loop Events", () => {
    it("emits CONDITION_CHECK on conditional branching", async () => {
      const code = `
const age = 20;
if (age >= 18) {
  console.log("Eligible");
}
`;

      const result = await executeJavaScript(code, "javascript", { trace: true });
      const types = result.events.map((e) => e.type);

      expect(types).toContain("CONDITION_CHECK");
      expect(types).toContain("OUTPUT");
    });

    it("emits LOOP_START on loops", async () => {
      const code = `
for (let i = 0; i < 3; i++) {
  console.log(i);
}
`;

      const result = await executeJavaScript(code, "javascript", { trace: true });
      const types = result.events.map((e) => e.type);

      expect(types).toContain("LOOP_START");
      expect(types).toContain("OUTPUT");
    });
  });

  describe("Event Normalization and Stream Generation", () => {
    it("normalizes events with sequence, payload, snapshot and callStack", () => {
      const normalized = normalizeExecutionEvents([
        {
          step: 0,
          type: "PROGRAM_START",
          line: 1,
          state: [],
          callStack: [],
        },
        {
          step: 1,
          type: "VARIABLE_DECLARE",
          variable: "total",
          value: 42,
          line: 2,
          state: [{ name: "total", value: 42, type: "number", scope: "global", changed: true, serialized: "42" }],
          callStack: [],
        },
      ]);

      expect(normalized[0].type).toBe("PROGRAM_START");
      expect(normalized[0].sequence).toBe(0);
      expect(normalized[1].type).toBe("VARIABLE_DECLARE");
      expect(normalized[1].variable).toBe("total");
      expect(normalized[1].value).toBe(42);
      expect(normalized[1].snapshot?.length).toBe(1);
    });

    it("creates an event stream for real-time frontend consumption", () => {
      const events = normalizeExecutionEvents([
        { step: 0, type: "PROGRAM_START", line: 1 },
        { step: 1, type: "OUTPUT", message: "Hello", line: 2 },
        { step: 2, type: "PROGRAM_END", line: 3 },
      ]);

      const stream = createExecutionEventStream(events);
      expect(stream).toHaveLength(3);
      expect(stream[0]).toContain("data: ");
      expect(stream[0]).toContain("PROGRAM_START");
      expect(stream[1]).toContain("OUTPUT");
      expect(stream[2]).toContain("PROGRAM_END");
    });
  });
});
