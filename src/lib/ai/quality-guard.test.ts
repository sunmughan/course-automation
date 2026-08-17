import { describe, it, expect } from "vitest";
import { validateAIQuality } from "@/lib/ai/quality-guard";

describe("AI Response Quality Guard & Safety Validator", () => {
  it("prevents full solution leaks in practice and hint modes", () => {
    const rawContent = `
Here is how to solve it:
// Full Complete Solution
function solve(a, b) {
  return a + b;
}
\`\`\`
`;

    const validation = validateAIQuality({
      content: rawContent,
      mode: "practice",
    });

    expect(validation.remediationApplied).toBe(true);
    expect(validation.sanitizedContent).not.toContain("return a + b;");
    expect(validation.sanitizedContent).toContain("Think about how to structure your function");
  });

  it("permits detailed code examples in explain mode", () => {
    const rawContent = `
In JavaScript, closures retain outer lexical scope:
\`\`\`javascript
function outer() {
  let count = 0;
  return () => ++count;
}
\`\`\`
`;

    const validation = validateAIQuality({
      content: rawContent,
      mode: "explain",
    });

    expect(validation.isValid).toBe(true);
    expect(validation.sanitizedContent).toContain("closures retain outer lexical scope");
  });
});
