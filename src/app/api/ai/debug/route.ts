import { NextRequest, NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { createAIRequestId } from "@/lib/ai/persistence";
import { getAIOrganizationId } from "@/lib/ai/request-context";
import { getModeSystemPrompt } from "@/lib/ai/prompts";

interface DebugRequest {
  code: string;
  error?: string;
  userId?: string;
  topicId?: string;
  lessonId?: string;
}

interface DebugResponse {
  errorAnalysis: string;
  rootCause: string;
  hints: { level: number; text: string }[];
  fixSuggestion: {
    description: string;
    code: string;
    explanation: string;
  } | null;
  preventionTips: string[];
  meta: {
    provider: string;
    model: string;
    latency: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DebugRequest;
    const { code, error, userId } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const activeProviders = aiGateway.getActiveProviders();
    if (activeProviders.length === 0) {
      return NextResponse.json(
        {
          error: "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
        },
        { status: 503 }
      );
    }

    const systemPrompt = `${getModeSystemPrompt("debug")}

## Response Format
You must respond with a JSON object in this exact format:
{
  "errorAnalysis": "Detailed analysis of the error or bug.",
  "rootCause": "The identified root cause of the issue.",
  "hints": [
    { "level": 1, "text": "A subtle hint to guide the student." },
    { "level": 2, "text": "A more specific hint." },
    { "level": 3, "text": "A nearly direct hint, but still not the full solution." }
  ],
  "fix": {
    "description": "Brief description of the fix.",
    "code": "The corrected code.",
    "explanation": "Why this fix works."
  },
  "preventionTips": ["Tip 1 for avoiding this in the future", "Tip 2"]
}

IMPORTANT: Your entire response must be valid JSON. Do not include markdown code fences or any other text.`;

    const userPrompt = `## Code to Debug

\`\`\`
${code}
\`\`\`

${error ? `## Error Message\n${error}\n` : ""}

Help me debug this code. Analyze the error, identify the root cause, provide progressive hints, and suggest a fix.
Respond with the structured JSON format as specified.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const startTime = performance.now();
    const organizationId = userId && userId !== "anonymous"
      ? await getAIOrganizationId(userId)
      : undefined;
    const result = await aiRouter.executeWithFallback(messages, {
      temperature: 0.3,
      maxTokens: 8192,
      userId: userId && userId !== "anonymous" ? userId : undefined,
      organizationId,
      requestId: createAIRequestId(),
      agent: "debugger",
      mode: "debug",
    });
    const latency = performance.now() - startTime;

    let parsed: {
      errorAnalysis: string;
      rootCause: string;
      hints: { level: number; text: string }[];
      fix?: { description: string; code: string; explanation: string };
      preventionTips: string[];
    };

    try {
      const cleaned = result.content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        errorAnalysis: result.content,
        rootCause: "Could not be determined automatically",
        hints: [],
        preventionTips: [],
      };
    }

    const response: DebugResponse = {
      errorAnalysis: parsed.errorAnalysis || result.content,
      rootCause: parsed.rootCause || "See analysis above",
      hints: (parsed.hints || []).map((h) => ({
        level: h.level || 1,
        text: h.text || "",
      })),
      fixSuggestion: parsed.fix
        ? {
            description: parsed.fix.description,
            code: parsed.fix.code,
            explanation: parsed.fix.explanation,
          }
        : null,
      preventionTips: parsed.preventionTips || [],
      meta: {
        provider: result.provider,
        model: result.model,
        latency: Math.round(latency),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}