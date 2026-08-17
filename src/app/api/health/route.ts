import { HealthMonitor } from "@/lib/infra/health";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await HealthMonitor.getFullHealth();
  const statusCode = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
