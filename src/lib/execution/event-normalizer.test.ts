import { describe, expect, it } from "vitest";
import { normalizeExecutionEvents } from "@/lib/execution/event-normalizer";

describe("normalizeExecutionEvents", () => {
  it("normalizes tracer variable event names into visualization events", () => {
    const events = normalizeExecutionEvents([
      {
        step: 0,
        type: "variable_declare",
        name: "count",
        value: 1,
        line: 1,
        depth: 0,
        description: "Declare 'count' = 1",
        state: [],
        callStack: [],
        heap: {},
        timestamp: 10,
      },
      {
        step: 1,
        type: "variable_assign",
        name: "count",
        value: 2,
        line: 2,
        depth: 0,
        description: "Assign 'count' = 2",
        state: [],
        callStack: [],
        heap: {},
        timestamp: 20,
      },
    ]);

    expect(events).toEqual([
      expect.objectContaining({
        step: 0,
        type: "VARIABLE_DECLARE",
        variable: "count",
        value: 1,
        line: 1,
        message: "Declare 'count' = 1",
      }),
      expect.objectContaining({
        step: 1,
        type: "VARIABLE_ASSIGN",
        variable: "count",
        value: 2,
        line: 2,
        message: "Assign 'count' = 2",
      }),
    ]);
  });

  it("preserves canonical event names", () => {
    const events = normalizeExecutionEvents([
      {
        step: 3,
        type: "FUNCTION_CALL",
        variable: "sum",
        line: 4,
        callStack: ["sum"],
      },
    ]);

    expect(events).toEqual([
      expect.objectContaining({
        step: 3,
        type: "FUNCTION_CALL",
        variable: "sum",
        callStack: ["sum"],
      }),
    ]);
  });
});
