import { NextRequest, NextResponse } from "next/server";
import type { TutorMode } from "@/types";
import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { getModeSystemPrompt, getModeTaskInstruction } from "@/lib/ai/prompts";

interface ExplainRequest {
  code: string;
  mode?: "explain" | "code-breakdown";
  userId?: string;
  topicId?: string;
  lessonId?: string;
}

interface ExplainResponse {
  explanation: string;
  steps: { title: string; description: string; code?: string }[];
  diagramData: {
    type: string;
    mermaid: string;
  } | null;
  meta: {
    provider: string;
    model: string;
    latency: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExplainRequest;
    const { code, mode = "explain", userId } = body;

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

    const tutorMode: TutorMode = mode === "code-breakdown" ? "code-breakdown" : "explain";

    const systemPrompt = `${getModeSystemPrompt(tutorMode)}

## Response Format
You must respond with a JSON object in this exact format:
{
  "explanation": "A clear, detailed explanation of what the code does.",
  "steps": [
    { "title": "Step title", "description": "What happens in this step", "code": "relevant code snippet (optional)" }
  ],
  "diagram": "Optional mermaid.js diagram describing the code flow (omit if not applicable)"
}

IMPORTANT: Your entire response must be valid JSON. Do not include markdown code fences or any other text.`;

    const userPrompt = `## Code to ${tutorMode === "code-breakdown" ? "Break Down" : "Explain"}

\`\`\`
${code}
\`\`\`

${getModeTaskInstruction(tutorMode)}

Respond with the structured JSON format as specified.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const startTime = performance.now();
    const result = await aiRouter.executeWithFallback(messages, {
      temperature: 0.3,
      maxTokens: 8192,
    });
    const latency = performance.now() - startTime;

    let parsed: {
      explanation: string;
      steps: { title: string; description: string; code?: string }[];
      diagram?: string;
    };

    try {
      const cleaned = result.content
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        explanation: result.content,
        steps: [],
      };
    }

    if (userId && userId !== "anonymous") {
      await prisma.aIRequest.create({
        data: {
          userId,
          provider: result.provider,
          model: result.model,
          mode: tutorMode,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latency,
          cost: result.cost,
          status: "success",
          fallbackUsed: false,
        },
      });
    }

    const response: ExplainResponse = {
      explanation: parsed.explanation || result.content,
      steps: parsed.steps || [],
      diagramData: parsed.diagram
        ? { type: "mermaid", mermaid: parsed.diagram }
        : null,
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