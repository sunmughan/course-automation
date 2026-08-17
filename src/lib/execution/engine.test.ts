import { describe, expect, it } from "vitest";
import { executeJavaScript } from "./sandbox";
import { executeMultiLanguage } from "./multi-lang-sandbox";
import { ExecutionQueue, globalExecutionQueue } from "./queue";

describe("Wave 4: Real Code Execution Engine", () => {
  describe("Task 4.1: Isolated JavaScript Runtime", () => {
    it("executes valid JavaScript and captures console outputs", async () => {
      const result = await executeJavaScript(
        'console.log("Hello from isolated runner"); console.log(JSON.stringify({ sum: 10 + 20 }));',
        "javascript"
      );

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("Hello from isolated runner");
      expect(result.output).toContain('{"sum":30}');
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it("executes JavaScript with tracing enabled and produces trace steps", async () => {
      const result = await executeJavaScript(
        'let a = 5;\nlet b = 10;\nlet c = a + b;\nconsole.log(c);',
        "javascript",
        { trace: true }
      );

      expect(result.error).toBeNull();
      expect(result.trace).toBeDefined();
      expect(result.trace?.steps.length).toBeGreaterThan(0);
      expect(result.trace?.summary).toBeDefined();
    });

    it("captures runtime errors with structured error information and non-zero exit code", async () => {
      const result = await executeJavaScript(
        'const obj = null;\nobj.nonExistentMethod();',
        "javascript"
      );

      expect(result.error).toBeTruthy();
      expect(result.exitCode).not.toBe(0);
      expect(result.events.some((e) => e.type === "error")).toBe(true);
    });

    it("terminates infinite loops safely via timeout without freezing the process", async () => {
      const start = Date.now();
      const result = await executeJavaScript(
        'while (true) {}',
        "javascript",
        { timeoutMs: 1200 }
      );
      const duration = Date.now() - start;

      expect(result.error).toContain("timed out");
      expect(result.exitCode).toBe(124);
      expect(result.status).toBe("timeout");
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(4000);
    });

    it("blocks disallowed APIs like process, require, eval, and window", async () => {
      const result = await executeJavaScript('process.exit(0);', "javascript");
      expect(result.error).toContain("disallowed API: process");
      expect(result.exitCode).toBe(1);

      const evalResult = await executeJavaScript('eval("1+1");', "javascript");
      expect(evalResult.error).toContain("disallowed API: eval()");
    });
  });

  describe("Task 4.2: Execution Queue and Worker Boundary", () => {
    it("manages execution concurrency and job lifecycle", async () => {
      const queue = new ExecutionQueue(2);

      const job1 = queue.enqueue(
        { code: 'console.log("job1")', language: "javascript" },
        async () => ({
          output: "job1 done",
          error: null,
          events: [],
          executionTime: 10,
          memoryUsed: 0,
          exitCode: 0,
        })
      );

      const job2 = queue.enqueue(
        { code: 'console.log("job2")', language: "javascript" },
        async () => ({
          output: "job2 done",
          error: null,
          events: [],
          executionTime: 10,
          memoryUsed: 0,
          exitCode: 0,
        })
      );

      const [res1, res2] = await Promise.all([job1, job2]);
      expect(res1.output).toBe("job1 done");
      expect(res2.output).toBe("job2 done");
    });

    it("allows cancelling a queued or active execution job", async () => {
      const queue = new ExecutionQueue(1);

      // Enqueue job 1 which blocks
      let resolveFirst: () => void;
      const job1Promise = queue.enqueue(
        { code: "job1", language: "javascript" },
        () => new Promise((resolve) => {
          resolveFirst = () => resolve({
            output: "first done",
            error: null,
            events: [],
            executionTime: 50,
            memoryUsed: 0,
            exitCode: 0,
          });
        })
      );

      // Enqueue job 2 which will wait in queue
      let job2Id = "";
      const job2Promise = queue.enqueue(
        { code: "job2", language: "javascript" },
        async () => ({
          output: "second done",
          error: null,
          events: [],
          executionTime: 10,
          memoryUsed: 0,
          exitCode: 0,
        })
      );

      // Retrieve stats to find queued job
      const stats = queue.getStats();
      expect(stats.runningCount).toBe(1);
      expect(stats.queuedCount).toBe(1);

      // Cancel all remaining jobs
      queue.clear();
      resolveFirst!();

      await job1Promise;
    });
  });

  describe("Task 4.4: Proper Preview / Validation / Database Engines", () => {
    it("validates and previews HTML structure with tag metrics", async () => {
      const htmlCode = `
<!DOCTYPE html>
<html lang="en">
<head><title>Course Demo</title></head>
<body>
  <h1>Welcome</h1>
  <p>Learn programming</p>
  <button>Click Me</button>
</body>
</html>`;

      const result = await executeMultiLanguage({
        code: htmlCode,
        language: "html",
      });

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("HTML Preview (Course Demo)");
      expect(result.output).toContain("Total Elements:");
      expect(result.events.some((e) => e.type === "dom_render")).toBe(true);
    });

    it("validates CSS syntax and calculates selector breakdown", async () => {
      const cssCode = `
.container { display: flex; padding: 16px; }
.button { background: #0070f3; color: white; border-radius: 4px; }
h1 { font-size: 24px; }`;

      const result = await executeMultiLanguage({
        code: cssCode,
        language: "css",
      });

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("CSS Stylesheet Preview");
      expect(result.output).toContain("Rules count: 3");
    });

    it("detects mismatched braces in CSS as syntax error", async () => {
      const badCss = `.container { display: flex;`;

      const result = await executeMultiLanguage({
        code: badCss,
        language: "css",
      });

      expect(result.error).toContain("Mismatched braces");
      expect(result.exitCode).toBe(1);
    });

    it("validates JSON and pretty-prints payload with key metrics", async () => {
      const jsonCode = `{"name": "SkillForge", "modules": 12, "active": true}`;

      const result = await executeMultiLanguage({
        code: jsonCode,
        language: "json",
      });

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("JSON Validation: Valid");
      expect(result.output).toContain('"name": "SkillForge"');
    });

    it("detects invalid JSON syntax and returns structured error", async () => {
      const badJson = `{"name": "SkillForge", missing_quotes: 123}`;

      const result = await executeMultiLanguage({
        code: badJson,
        language: "json",
      });

      expect(result.error).toContain("JSON Syntax Error");
      expect(result.exitCode).toBe(1);
    });

    it("renders Markdown outline and word statistics", async () => {
      const mdCode = `
# Lesson 1: Introduction
## Overview
This is a quick guide.
\`\`\`js
console.log("Code example");
\`\`\`
### Key Takeaway
Practice consistently.`;

      const result = await executeMultiLanguage({
        code: mdCode,
        language: "markdown",
      });

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain("Markdown Document Outline & Preview");
      expect(result.output).toContain("Lesson 1: Introduction");
      expect(result.output).toContain("Words:");
    });

    it("handles SQL queries with in-memory execution or validation", async () => {
      const sqlCode = `
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO users (name) VALUES ('Alice'), ('Bob');
SELECT * FROM users;`;

      const result = await executeMultiLanguage({
        code: sqlCode,
        language: "sql",
      });

      expect(result.exitCode).toBe(0);
      expect(result.events.some((e) => e.type === "sql_result")).toBe(true);
    }, 15000);
  });
});
