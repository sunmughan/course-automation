import { NextRequest, NextResponse } from "next/server";
import { executeJavaScript } from "@/lib/execution/sandbox";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, language = "javascript" } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await executeJavaScript(code, language);

    await prisma.executionRun.create({
      data: {
        code: code.slice(0, 10000),
        language,
        output: (result.output || "").slice(0, 10000),
        error: result.error,
        executionTime: result.executionTime,
        status: result.error ? "error" : "success",
        events: JSON.stringify(result.events),
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: "code_execution",
        data: JSON.stringify({
          language,
          codeLength: code.length,
          duration: result.executionTime,
          hasError: !!result.error,
          outputLength: (result.output || "").length,
        }),
      },
    });

    return NextResponse.json({
      output: result.output,
      events: result.events,
      executionTime: result.executionTime,
      error: result.error,
    });
  } catch (error) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}