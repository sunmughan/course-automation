import { prisma } from "@/lib/db";
import { aiRouter } from "@/lib/ai/router";
import { getBatchAnalytics, detectAtRiskStudents } from "./analytics";
import { z } from "zod";

export interface InstructorAssistantQuery {
  instructorId: string;
  batchId: string;
  query: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface InstructorAssistantResponse {
  answer: string;
  intent: "at_risk_query" | "difficult_topics_query" | "common_mistakes_query" | "teaching_recommendation_query" | "general_analytics_query";
  evidence: {
    atRiskStudents?: Array<{
      studentId: string;
      studentName: string;
      riskScore: number;
      riskLevel: string;
      factors: string[];
    }>;
    difficultTopics?: Array<{
      topicId: string;
      topicName: string;
      failureRate: number;
      avgScore: number;
      mistakeCount: number;
    }>;
    commonErrors?: Array<{
      error: string;
      count: number;
      affectedStudents: number;
      sampleCode?: string;
    }>;
    recommendedLessonPlan?: {
      focusTopic: string;
      suggestedActivities: string[];
      remedialTargetStudents: string[];
      keyMistakesToAddress: string[];
    };
  };
  suggestedNextActions: string[];
}

const AIResponseSchema = z.object({
  answer: z.string().min(10),
  intent: z.enum([
    "at_risk_query",
    "difficult_topics_query",
    "common_mistakes_query",
    "teaching_recommendation_query",
    "general_analytics_query",
  ]).default("general_analytics_query"),
  keyTakeaways: z.array(z.string()).default([]),
  suggestedNextActions: z.array(z.string()).default([]),
});

export class AIInstructorAssistant {
  /**
   * Classifies query intent based on user prompt.
   */
  static classifyIntent(query: string): InstructorAssistantResponse["intent"] {
    const q = query.toLowerCase();
    if (q.includes("teach") || q.includes("tomorrow") || q.includes("lesson plan") || q.includes("revision lesson")) {
      return "teaching_recommendation_query";
    }
    if (q.includes("mistake") || q.includes("error") || q.includes("bug") || q.includes("why are students failing") || q.includes("common mistake")) {
      return "common_mistakes_query";
    }
    if (q.includes("hardest") || q.includes("difficult topic") || q.includes("most difficult") || q.includes("hardest topic") || q.includes("challenging topic")) {
      return "difficult_topics_query";
    }
    if (q.includes("at risk") || q.includes("intervention") || q.includes("struggling") || q.includes("falling behind") || q.includes("need help") || q.includes("at-risk")) {
      return "at_risk_query";
    }
    if (q.includes("difficult") || q.includes("failing") || q.includes("topic")) {
      return "difficult_topics_query";
    }
    return "general_analytics_query";
  }

  /**
   * Answers instructor inquiries using real grounded database analytics.
   */
  static async ask(params: InstructorAssistantQuery): Promise<InstructorAssistantResponse> {
    const { instructorId, batchId, query, history = [] } = params;

    // Retrieve real batch ground truth data
    const [analytics, atRisk] = await Promise.all([
      getBatchAnalytics(batchId, instructorId),
      detectAtRiskStudents(batchId, instructorId),
    ]);

    const intent = this.classifyIntent(query);

    // Build rich factual context
    const atRiskSummary = atRisk.length > 0
      ? atRisk.map((s) => `- ${s.studentName} (Risk: ${s.riskLevel}, Score: ${s.riskScore}/100, Mastery: ${s.averageScore}%, Completion: ${s.completionRate}%): Factors: ${s.factors.join("; ")}`).join("\n")
      : "No students currently flagged at high risk.";

    const difficultTopicsSummary = analytics.difficultTopics.length > 0
      ? analytics.difficultTopics.map((t) => `- "${t.topicName}": Failure Rate: ${t.failureRate}%, Average Score: ${t.avgScore}%, Recorded Mistakes: ${t.mistakeCount}`).join("\n")
      : "All topics show solid passing completion rates.";

    const commonErrorsSummary = analytics.commonErrors.length > 0
      ? analytics.commonErrors.map((e) => `- Error: "${e.error}" (occurred ${e.count} times across ${e.affectedStudents} students)${e.sampleCode ? ` in: ${e.sampleCode.slice(0, 100)}` : ""}`).join("\n")
      : "No frequent error patterns detected.";

    const systemPrompt = `You are the SkillForge AI Instructor Assistant.
You have direct access to the live, real database analytics for the batch "${analytics.batchName}".

GROUND TRUTH REAL ANALYTICS:
- Batch Name: "${analytics.batchName}"
- Total Enrolled Students: ${analytics.totalStudents} (Active: ${analytics.activeStudents})
- Overall Lesson Completion: ${analytics.overallCompletion}%
- Batch Average Score: ${analytics.averageScore}%
- Total Coding Time Logged: ${analytics.totalCodingTimeMinutes} minutes
- Total Code Executions: ${analytics.totalCodeExecutions}
- Total AI Tutor Questions Asked by Students: ${analytics.totalAiQuestions}

AT-RISK STUDENTS EVIDENCE:
${atRiskSummary}

DIFFICULT TOPICS EVIDENCE:
${difficultTopicsSummary}

COMMON ERRORS AND CODE PATTERNS:
${commonErrorsSummary}

TOP PERFORMERS:
${analytics.topPerformers.map((p) => `- ${p.studentName} (Avg: ${p.avgScore}%, Comp: ${p.completionRate}%)`).join("\n")}

CRITICAL INSTRUCTIONS:
1. Every statement, metric, name, and recommendation MUST be strictly grounded in the real analytics data above.
2. NEVER fabricate names, fake percentages, or imaginary student records.
3. Return ONLY valid, raw JSON matching this schema:
{
  "answer": "Clear, professional, comprehensive markdown response directly answering the instructor's question with specific student names and data.",
  "intent": "${intent}",
  "keyTakeaways": ["Key bullet point 1", "Key bullet point 2"],
  "suggestedNextActions": ["Concrete action 1", "Concrete action 2"]
}`;

    const userPrompt = `Instructor Question: "${query}"

Provide an actionable, data-backed answer based on the real analytics above.`;

    try {
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.slice(-4),
        { role: "user" as const, content: userPrompt },
      ];

      const response = await aiRouter.executeWithFallback(messages, {
        userId: instructorId,
        complexity: "medium",
        temperature: 0.2,
      });

      const raw = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(raw);
      const validated = AIResponseSchema.parse(parsed);

      return {
        answer: validated.answer,
        intent,
        evidence: {
          atRiskStudents: atRisk.slice(0, 5).map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            riskScore: s.riskScore,
            riskLevel: s.riskLevel,
            factors: s.factors,
          })),
          difficultTopics: analytics.difficultTopics.slice(0, 5),
          commonErrors: analytics.commonErrors.slice(0, 5),
          recommendedLessonPlan: analytics.difficultTopics.length > 0
            ? {
                focusTopic: analytics.difficultTopics[0].topicName,
                suggestedActivities: [
                  `Live interactive coding workshop on ${analytics.difficultTopics[0].topicName}`,
                  `Review common error pattern: ${analytics.commonErrors[0]?.error || 'Syntax and boundary handling'}`,
                  `Assign targeted remediation exercises to struggling students`,
                ],
                remedialTargetStudents: atRisk.slice(0, 4).map((s) => s.studentName),
                keyMistakesToAddress: analytics.commonErrors.slice(0, 3).map((e) => e.error),
              }
            : undefined,
        },
        suggestedNextActions: validated.suggestedNextActions.length > 0
          ? validated.suggestedNextActions
          : [
              "Schedule 1:1 check-in with high-risk students",
              "Review common errors during tomorrow's lecture",
              "Assign targeted practice exercises",
            ],
      };
    } catch (err) {
      console.warn("[AIInstructorAssistant] Falling back to deterministic analytics summary:", err);
      return this.createDeterministicResponse(query, intent, analytics, atRisk);
    }
  }

  private static createDeterministicResponse(
    query: string,
    intent: InstructorAssistantResponse["intent"],
    analytics: any,
    atRisk: any[]
  ): InstructorAssistantResponse {
    let answer = "";
    const highRisk = atRisk.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high");

    switch (intent) {
      case "at_risk_query":
        answer = highRisk.length > 0
          ? `### At-Risk Students Summary\n\nThere are **${highRisk.length}** students currently needing attention in **${analytics.batchName}**:\n\n` +
            highRisk.map((s) => `- **${s.studentName}** (Risk Score: ${s.riskScore}/100, Avg Score: ${s.averageScore}%)\n  - Factors: ${s.factors.join("; ")}`).join("\n")
          : `### Student Health Status\n\nGreat news! None of the enrolled students in **${analytics.batchName}** are currently flagged at critical or high risk. Average batch mastery is **${analytics.averageScore}%**.`;
        break;

      case "difficult_topics_query":
        answer = analytics.difficultTopics.length > 0
          ? `### Hardest Curriculum Topics\n\nBased on student attempt data, the most challenging topics are:\n\n` +
            analytics.difficultTopics.map((t: any) => `- **${t.topicName}**: **${t.failureRate}%** failure rate, Average Score: **${t.avgScore}%** (${t.mistakeCount} recorded mistakes)`).join("\n")
          : `### Curriculum Performance\n\nAll current topics show strong mastery rates with an overall completion average of **${analytics.overallCompletion}%**.`;
        break;

      case "common_mistakes_query":
        answer = analytics.commonErrors.length > 0
          ? `### Most Common Errors\n\nHere are the top error patterns students are hitting during code execution:\n\n` +
            analytics.commonErrors.map((e: any) => `- \`${e.error}\` (Encountered **${e.count}** times across **${e.affectedStudents}** students)`).join("\n")
          : `### Error Diagnostics\n\nNo clustered error patterns detected. Code execution success rate is high.`;
        break;

      case "teaching_recommendation_query":
        const topDifficult = analytics.difficultTopics[0]?.topicName || "Core Frontend Concepts";
        answer = `### Recommended Teaching Plan\n\nBased on live student metrics for **${analytics.batchName}**:\n\n` +
          `1. **Focus Area for Next Lecture**: **${topDifficult}** (currently has the highest difficulty indicator).\n` +
          `2. **Key Error to Walk Through**: \`${analytics.commonErrors[0]?.error || 'Null pointer & type coercion'}\`\n` +
          `3. **Students to Support**: ${highRisk.slice(0, 3).map((s) => s.studentName).join(", ") || 'General class support'}.\n` +
          `4. **Suggested Action**: Assign interactive remedial exercises and host a 15-minute live debugging demo.`;
        break;

      default:
        answer = `### Batch Overview for ${analytics.batchName}\n\n` +
          `- **Enrolled Students**: ${analytics.totalStudents} (${analytics.activeStudents} active)\n` +
          `- **Overall Completion**: ${analytics.overallCompletion}%\n` +
          `- **Average Score**: ${analytics.averageScore}%\n` +
          `- **Total Coding Time**: ${analytics.totalCodingTimeMinutes} minutes\n` +
          `- **At-Risk Count**: ${highRisk.length}\n\n` +
          `Feel free to ask for specific student breakdowns, error diagnostics, or custom lesson plans!`;
    }

    return {
      answer,
      intent,
      evidence: {
        atRiskStudents: atRisk.slice(0, 5),
        difficultTopics: analytics.difficultTopics.slice(0, 5),
        commonErrors: analytics.commonErrors.slice(0, 5),
      },
      suggestedNextActions: [
        "Review difficult topics in next session",
        "Send check-in message to at-risk students",
        "Assign targeted remediation practice",
      ],
    };
  }
}
