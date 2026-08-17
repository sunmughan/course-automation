import { prisma } from "@/lib/db";
import { aiRouter } from "@/lib/ai/router";
import { z } from "zod";

export type MentorAction =
  | "architecture_review"
  | "code_review"
  | "debugging"
  | "testing"
  | "security_review"
  | "performance_review"
  | "milestone_planning"
  | "general_guidance";

export interface ProjectMentorRequest {
  projectId: string;
  userId: string;
  action: MentorAction;
  userPrompt?: string;
  activeFilePath?: string;
  currentMilestone?: string;
}

export interface MentorFinding {
  title: string;
  severity: "info" | "warning" | "critical";
  description: string;
  file?: string;
  lineRange?: string;
  suggestedCodeSnippet?: string;
}

export interface ProjectMentorResponse {
  mode: MentorAction;
  summary: string;
  analysis: {
    strengths: string[];
    findings: MentorFinding[];
    recommendations: string[];
  };
  codeChanges?: Array<{
    file: string;
    originalSnippet?: string;
    modifiedSnippet: string;
    explanation: string;
  }>;
  suggestedTests?: Array<{
    title: string;
    code: string;
    description: string;
  }>;
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    tasks: string[];
  }>;
  suggestedNextAction: string;
}

const MentorOutputSchema = z.object({
  summary: z.string().min(10),
  strengths: z.array(z.string()).default([]),
  findings: z.array(z.object({
    title: z.string(),
    severity: z.enum(["info", "warning", "critical"]).default("info"),
    description: z.string(),
    file: z.string().optional(),
    lineRange: z.string().optional(),
    suggestedCodeSnippet: z.string().optional(),
  })).default([]),
  recommendations: z.array(z.string()).default([]),
  codeChanges: z.array(z.object({
    file: z.string(),
    originalSnippet: z.string().optional(),
    modifiedSnippet: z.string(),
    explanation: z.string(),
  })).optional(),
  suggestedTests: z.array(z.object({
    title: z.string(),
    code: z.string(),
    description: z.string(),
  })).optional(),
  milestones: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    completed: z.boolean(),
    tasks: z.array(z.string()),
  })).optional(),
  suggestedNextAction: z.string().min(5),
});

export class ProjectMentor {
  /**
   * Evaluates project with holistic context and returns structured guidance.
   */
  static async reviewProject(params: ProjectMentorRequest): Promise<ProjectMentorResponse> {
    const { projectId, userId, action, userPrompt, activeFilePath, currentMilestone } = params;

    // Load full project context
    const [project, studentSkills] = await Promise.all([
      prisma.playgroundProject.findUnique({
        where: { id: projectId },
        include: {
          files: { where: { isFolder: false }, orderBy: { path: "asc" } },
          sessions: { where: { userId }, take: 1 },
          executions: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      }),
      prisma.studentSkill.findMany({
        where: { userId },
        include: { topic: { select: { title: true } } },
      }),
    ]);

    if (!project || project.userId !== userId) {
      throw new Error("Project not found or unauthorized");
    }

    // Build project context payload
    const filesSummary = project.files.map((f) => `### File: \`${f.path}\` (${f.language})\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join("\n\n");

    const recentExecutions = project.executions.length > 0
      ? project.executions.map((e, idx) => `Execution #${idx + 1} (${e.language}) Status: ${e.status}, Exit: ${e.exitCode}\nOutput:\n${e.output}\n${e.error ? `Error: ${e.error}` : ''}`).join("\n---\n")
      : "No recent execution runs recorded.";

    const skillSummary = studentSkills.length > 0
      ? studentSkills.map((s) => `${s.topic.title}: ${s.score}% (${s.status})`).join(", ")
      : "Student skill profile initialized.";

    const systemPrompt = `You are a Principal Software Architect & Project Mentor mentoring a student developer.
You have full visibility into the student's multi-file codebase, runtime outputs, and mastery level.

REVIEW MODE: "${action}"

STUDENT PROFILE:
- Mastery: ${skillSummary}
- Active File: ${activeFilePath || project.sessions[0]?.activeFileId || "src/main.js"}
- Current Milestone: ${currentMilestone || "Initial Implementation"}

PROJECT FILES:
${filesSummary}

RECENT EXECUTION RUNS & ERRORS:
${recentExecutions}

CRITICAL REQUIREMENTS:
1. Return ONLY valid, raw JSON matching this exact schema:
{
  "summary": "High-level summary of review (2-3 sentences)",
  "strengths": ["Clear strength 1", "Clear strength 2"],
  "findings": [
    {
      "title": "Finding headline",
      "severity": "info" | "warning" | "critical",
      "description": "Detailed explanation with line-level context",
      "file": "path/to/file.js",
      "lineRange": "e.g. lines 12-18",
      "suggestedCodeSnippet": "Optimized replacement code"
    }
  ],
  "recommendations": ["Actionable step 1", "Actionable step 2"],
  "codeChanges": [
    {
      "file": "src/main.js",
      "originalSnippet": "...",
      "modifiedSnippet": "...",
      "explanation": "..."
    }
  ],
  "suggestedTests": [
    {
      "title": "Test case description",
      "code": "test(...) { ... }",
      "description": "Why this test matters"
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "title": "Milestone Title",
      "description": "Scope",
      "completed": false,
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "suggestedNextAction": "The single most impactful immediate action for the student"
}

2. Do not wrap JSON in markdown ticks.
3. Be deeply technical, educational, and constructive.`;

    const promptText = userPrompt
      ? `User Request: "${userPrompt}"\nReview Mode: ${action}`
      : `Perform a comprehensive ${action.replace("_", " ")} on the project files.`;

    try {
      const response = await aiRouter.executeWithFallback([
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText },
      ], {
        userId,
        complexity: "high",
        temperature: 0.2,
      });

      const raw = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(raw);
      const validated = MentorOutputSchema.parse(parsed);

      return {
        mode: action,
        summary: validated.summary,
        analysis: {
          strengths: validated.strengths,
          findings: validated.findings,
          recommendations: validated.recommendations,
        },
        codeChanges: validated.codeChanges,
        suggestedTests: validated.suggestedTests,
        milestones: validated.milestones,
        suggestedNextAction: validated.suggestedNextAction,
      };
    } catch (err) {
      console.warn("[ProjectMentor] Falling back to heuristic analysis:", err);
      return this.createFallbackAnalysis(action, project);
    }
  }

  // ── Deterministic Heuristic Fallback Analysis ─────────────────────────────

  private static createFallbackAnalysis(action: MentorAction, project: any): ProjectMentorResponse {
    const findings: MentorFinding[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = ["Modular file organization", "Clean project scaffold"];

    for (const file of project.files) {
      if (file.content.includes("console.log")) {
        findings.push({
          title: "Debug logs in production code",
          severity: "info",
          description: `File \`${file.path}\` contains \`console.log\` statements that should be cleaned up before release.`,
          file: file.path,
        });
      }
      if (file.content.includes("var ")) {
        findings.push({
          title: "Legacy \`var\` keyword used",
          severity: "warning",
          description: `Replace legacy \`var\` with \`const\` or \`let\` in \`${file.path}\` to avoid scope hoisting bugs.`,
          file: file.path,
        });
      }
      if (file.content.includes("eval(") || file.content.includes("innerHTML")) {
        findings.push({
          title: "Potential security vulnerability (XSS / Code Injection)",
          severity: "critical",
          description: `Dangerous API pattern detected in \`${file.path}\`. Avoid \`eval\` or unescaped \`innerHTML\`.`,
          file: file.path,
        });
      }
    }

    if (action === "debugging") {
      const lastErr = project.executions?.[0]?.error;
      return {
        mode: action,
        summary: lastErr
          ? `Diagnosed recent execution runtime error: "${lastErr}".`
          : "No active runtime errors found in recent executions.",
        analysis: {
          strengths,
          findings: lastErr
            ? [{
                title: "Runtime Execution Failure",
                severity: "critical",
                description: lastErr,
                suggestedCodeSnippet: "// Verify null checks and function arguments before invocation.",
              }]
            : findings,
          recommendations: [
            "Check null / undefined guards on imported modules",
            "Ensure all required function arguments are provided",
          ],
        },
        suggestedNextAction: "Run tests on modified entry file to verify runtime stability",
      };
    }

    if (action === "testing") {
      return {
        mode: action,
        summary: "Testing suggestions generated for core utility functions.",
        analysis: {
          strengths,
          findings,
          recommendations: [
            "Add boundary tests for empty arrays and null inputs",
            "Verify mathematical calculations with floating point edge cases",
          ],
        },
        suggestedTests: [
          {
            title: "CalculateStats Boundary Test",
            code: `import { calculateStats } from "./src/utils.js";\n\nconst res = calculateStats([10, 20]);\nif (res.sum !== 30) throw new Error("Sum failed");`,
            description: "Verifies correct sum and average calculations",
          },
        ],
        suggestedNextAction: "Add assertions to verify edge cases for empty datasets",
      };
    }

    if (action === "milestone_planning") {
      return {
        mode: action,
        summary: "Project roadmap structured into 3 iterative milestones.",
        analysis: { strengths, findings, recommendations },
        milestones: [
          {
            id: "m1",
            title: "Milestone 1: Core Domain Logic",
            description: "Implement data structures, utility helpers, and state calculation.",
            completed: true,
            tasks: ["Create utils module", "Implement calculation formulas", "Verify outputs"],
          },
          {
            id: "m2",
            title: "Milestone 2: UI & Interactivity",
            description: "Connect styling, event handlers, and data visualization.",
            completed: false,
            tasks: ["Bind DOM elements", "Implement theme styling", "Add responsive layouts"],
          },
          {
            id: "m3",
            title: "Milestone 3: Testing & Hardening",
            description: "Edge case validation, security review, and performance optimization.",
            completed: false,
            tasks: ["Add unit test suite", "Profile memory usage", "Sanitize all user inputs"],
          },
        ],
        suggestedNextAction: "Begin Milestone 2 by connecting UI event listeners",
      };
    }

    return {
      mode: action,
      summary: `Completed ${action.replace("_", " ")}. The project demonstrates good modularity with key opportunities for enhancement.`,
      analysis: {
        strengths,
        findings,
        recommendations: [
          "Maintain strict separation between data calculations and UI rendering",
          "Ensure consistent error handling across async boundaries",
        ],
      },
      suggestedNextAction: "Review findings and apply recommended code improvements",
    };
  }
}
