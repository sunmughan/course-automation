import { describe, expect, it } from "vitest";
import { executeJavaScript } from "@/lib/execution/sandbox";

describe("JavaScript tracing integration", () => {
  it("returns normalized variable events with real values", async () => {
    const result = await executeJavaScript(
      "let count = 1;\ncount = 2;",
      "javascript",
      { trace: true }
    );

    expect(result.error).toBeNull();
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "VARIABLE_DECLARE",
        variable: "count",
        value: 1,
      })
    );
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "VARIABLE_ASSIGN",
        variable: "count",
        value: 2,
      })
    );
  });

  it("traces function invocation rather than function declaration", async () => {
    const result = await executeJavaScript(
      [
        "function add(a, b) {",
        "  const result = a + b;",
        "  return result;",
        "}",
        "const total = add(1, 2);",
      ].join("\n"),
      "javascript",
      { trace: true }
    );

    expect(result.error).toBeNull();
    expect(result.events.filter((event) => event.type === "FUNCTION_CALL")).toEqual([
      expect.objectContaining({
        variable: "add",
        line: 1,
        callStack: ["add"],
      }),
    ]);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "VARIABLE_DECLARE",
        variable: "result",
        value: 3,
        callStack: ["add"],
      })
    );
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "FUNCTION_RETURN",
        variable: "add",
        value: 3,
      })
    );
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "VARIABLE_DECLARE",
        variable: "total",
        value: 3,
      })
    );
  });
});
