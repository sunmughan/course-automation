import { exec, ExecException } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { randomUUID } from "crypto";
import type { ExecutionResult, ExecutionEvent } from "@/types";
import {
  getLanguageDefinition,
  isExecutableLanguage,
  isDisplayOnlyLanguage,
} from "./languages";

const MAX_EXECUTION_TIME_MS = 5000;
const MAX_OUTPUT_LENGTH = 50000;

interface ExecuteOptions {
  language: string;
  code: string;
  trace?: boolean;
}

interface ExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  executionTime: number;
}

function execWithTimeout(
  command: string,
  timeoutMs: number,
  cwd?: string
): Promise<ExecOutput> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = exec(
      command,
      {
        timeout: timeoutMs,
        maxBuffer: MAX_OUTPUT_LENGTH * 2,
        cwd: cwd || tmpdir(),
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUNBUFFERED: "1",
          LANG: "en_US.UTF-8",
          LC_ALL: "en_US.UTF-8",
        },
      },
      (error: ExecException | null, stdout: string, stderr: string) => {
        const executionTime = Date.now() - startTime;

        if (error) {
          if (error.killed) {
            resolve({
              stdout: stdout || "",
              stderr: "Execution timed out after " + timeoutMs / 1000 + " seconds",
              exitCode: 124,
              signal: error.signal || null,
              executionTime,
            });
            return;
          }

          resolve({
            stdout: stdout || "",
            stderr: stderr || error.message || "Unknown error",
            exitCode: error.code || 1,
            signal: error.signal || null,
            executionTime,
          });
          return;
        }

        resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: 0,
          signal: null,
          executionTime,
        });
      }
    );

    setTimeout(() => {
      proc.kill("SIGTERM");
    }, timeoutMs);
  });
}

async function executeInterpreted(
  languageId: string,
  code: string,
  workDir: string
): Promise<{ output: string; error: string | null; events: ExecutionEvent[]; executionTime: number }> {
  const lang = getLanguageDefinition(languageId);
  if (!lang || !lang.executeCommand) {
    return {
      output: "",
      error: `Language '${languageId}' is not configured for execution`,
      events: [],
      executionTime: 0,
    };
  }

  const sourceFile = join(workDir, `main${lang.extension}`);
  await writeFile(sourceFile, code, "utf-8");

  const command = lang.executeCommand(sourceFile);
  const result = await execWithTimeout(command, MAX_EXECUTION_TIME_MS, workDir);

  const events: ExecutionEvent[] = [];
  if (result.stdout) {
    events.push({
      step: 1,
      type: "output",
      message: result.stdout.slice(0, MAX_OUTPUT_LENGTH),
    });
  }

  if (result.stderr || result.exitCode !== 0) {
    const errorMsg = result.stderr || `Process exited with code ${result.exitCode}`;
    events.push({
      step: 1,
      type: "error",
      message: errorMsg.slice(0, MAX_OUTPUT_LENGTH),
    });
    return {
      output: result.stdout.slice(0, MAX_OUTPUT_LENGTH),
      error: errorMsg.slice(0, MAX_OUTPUT_LENGTH),
      events,
      executionTime: result.executionTime,
    };
  }

  return {
    output: result.stdout.slice(0, MAX_OUTPUT_LENGTH),
    error: null,
    events,
    executionTime: result.executionTime,
  };
}

async function executeCompiled(
  languageId: string,
  code: string,
  workDir: string
): Promise<{ output: string; error: string | null; events: ExecutionEvent[]; executionTime: number }> {
  const lang = getLanguageDefinition(languageId);
  if (!lang || !lang.compileCommand || !lang.executeCommand) {
    return {
      output: "",
      error: `Language '${languageId}' is not configured for compilation`,
      events: [],
      executionTime: 0,
    };
  }

  const sourceFile = join(workDir, `main${lang.extension}`);
  await writeFile(sourceFile, code, "utf-8");

  let compileResult: ExecOutput;
  let executeCommand: string;

  if (languageId === "java") {
    const classesDir = join(workDir, "classes");
    await mkdir(classesDir, { recursive: true });
    const compileCmd = lang.compileCommand(sourceFile, classesDir);
    compileResult = await execWithTimeout(compileCmd, MAX_EXECUTION_TIME_MS, workDir);
    executeCommand = lang.executeCommand(classesDir);
  } else if (languageId === "kotlin") {
    const outputJar = join(workDir, "main.jar");
    const compileCmd = lang.compileCommand(sourceFile, outputJar);
    compileResult = await execWithTimeout(compileCmd, MAX_EXECUTION_TIME_MS, workDir);
    executeCommand = lang.executeCommand(outputJar);
  } else {
    const outputFile = join(workDir, languageId === "typescript" ? "main.js" : "main.out");
    const compileCmd = lang.compileCommand(sourceFile, outputFile);
    compileResult = await execWithTimeout(compileCmd, MAX_EXECUTION_TIME_MS, workDir);
    executeCommand = lang.executeCommand(outputFile);
  }

  const events: ExecutionEvent[] = [];

  if (compileResult.stderr || compileResult.exitCode !== 0) {
    const errorMsg = compileResult.stderr || `Compilation failed with exit code ${compileResult.exitCode}`;
    events.push({
      step: 1,
      type: "error",
      message: `Compilation Error:\n${errorMsg}`.slice(0, MAX_OUTPUT_LENGTH),
    });
    return {
      output: "",
      error: `Compilation Error:\n${errorMsg}`.slice(0, MAX_OUTPUT_LENGTH),
      events,
      executionTime: compileResult.executionTime,
    };
  }

  const runResult = await execWithTimeout(executeCommand, MAX_EXECUTION_TIME_MS, workDir);

  if (runResult.stdout) {
    events.push({
      step: 1,
      type: "output",
      message: runResult.stdout.slice(0, MAX_OUTPUT_LENGTH),
    });
  }

  if (runResult.stderr || runResult.exitCode !== 0) {
    const errorMsg = runResult.stderr || `Runtime error (exit code ${runResult.exitCode})`;
    events.push({
      step: 1,
      type: "error",
      message: errorMsg.slice(0, MAX_OUTPUT_LENGTH),
    });
    return {
      output: runResult.stdout.slice(0, MAX_OUTPUT_LENGTH),
      error: errorMsg.slice(0, MAX_OUTPUT_LENGTH),
      events,
      executionTime: compileResult.executionTime + runResult.executionTime,
    };
  }

  return {
    output: runResult.stdout.slice(0, MAX_OUTPUT_LENGTH),
    error: null,
    events,
    executionTime: compileResult.executionTime + runResult.executionTime,
  };
}

export async function executeMultiLanguage(
  options: ExecuteOptions
): Promise<ExecutionResult> {
  const { language, code } = options;
  const startTime = Date.now();

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

  const lang = getLanguageDefinition(language);
  if (!lang) {
    return {
      output: "",
      error: `Unsupported language: '${language}'. Supported languages: ${Object.keys(LANGUAGE_REGISTRY).join(", ")}`,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  if (!isExecutableLanguage(language) && !isDisplayOnlyLanguage(language)) {
    return {
      output: "",
      error: `Language '${lang.name}' is not executable. Use it for display/editing only.`,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  if (isDisplayOnlyLanguage(language)) {
    return {
      output: `[${lang.name} preview]\n\n${trimmedCode.slice(0, 2000)}`,
      error: null,
      events: [],
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  const workDir = join(tmpdir(), `code-exec-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    let result: { output: string; error: string | null; events: ExecutionEvent[]; executionTime: number };

    if (language === "javascript") {
      const { executeJavaScript } = await import("./sandbox");
      const jsResult = await executeJavaScript(trimmedCode, language, { trace: options.trace });
      return {
        ...jsResult,
        executionTime: Date.now() - startTime,
      };
    }

    if (lang.isCompiled) {
      result = await executeCompiled(language, trimmedCode, workDir);
    } else {
      result = await executeInterpreted(language, trimmedCode, workDir);
    }

    return {
      output: result.output,
      error: result.error,
      events: result.events,
      executionTime: result.executionTime,
      memoryUsed: 0,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Execution failed";

    if (errorMsg.includes("command not found") || errorMsg.includes("ENOENT") || errorMsg.includes("not recognized")) {
      const compilerOrInterpreter = lang.isCompiled ? (lang.compiler || "compiler") : (lang.interpreter || "interpreter");
      return {
        output: "",
        error: `${lang.name} ${compilerOrInterpreter} is not installed on this server. Please contact the administrator.`,
        events: [],
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
      };
    }

    return {
      output: "",
      error: errorMsg,
      events: [],
      executionTime: Date.now() - startTime,
      memoryUsed: 0,
    };
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // cleanup failure is non-critical
    }
  }
}

import { LANGUAGE_REGISTRY } from "./languages";