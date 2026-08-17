import { join } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pages = [
  "adaptive",
  "assessments",
  "projects",
  "progress",
] as const;

describe("Wave 1.1 dashboard authentication headers", () => {
  for (const page of pages) {
    it(`${page} page uses the shared authentication header helper`, () => {
      const source = readFileSync(
        join(process.cwd(), "src", "app", "dashboard", page, "page.tsx"),
        "utf8",
      );

      expect(source).toContain("getAuthHeaders");
      expect(source).not.toContain('localStorage.getItem("auth-token")');
    });
  }
});
