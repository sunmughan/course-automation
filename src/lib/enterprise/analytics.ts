import { prisma } from "@/lib/db";

export interface OrgOverviewData {
  members: number;
  instructors: number;
  students: number;
  teams: number;
  departments: number;
  curriculums: number;
  aiModels: number;
  policies: number;
}

export interface OrgAIAnalyticsData {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatency: number;
  fallbackRate: number;
  requestsByProvider: Record<string, number>;
  requestsByMode: Record<string, number>;
}

export interface AnalyticsEventData {
  id: string;
  organizationId: string | null;
  userId: string | null;
  event: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface OrgActivityPoint {
  date: string;
  count: number;
}

function formatAnalyticsEvent(event: {
  id: string;
  organizationId: string | null;
  userId: string | null;
  event: string;
  data: string;
  createdAt: Date;
}): AnalyticsEventData {
  return {
    id: event.id,
    organizationId: event.organizationId,
    userId: event.userId,
    event: event.event,
    data: JSON.parse(event.data),
    createdAt: event.createdAt.toISOString(),
  };
}

async function getMemberUserIds(organizationId: string): Promise<string[]> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  });

  return members.map((m) => m.userId);
}

export async function getOrgOverview(
  organizationId: string
): Promise<OrgOverviewData> {
  const [memberRows, teams, departments, curriculums, aiModels, policies] =
    await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId },
        select: { role: true },
      }),
      prisma.team.count({ where: { organizationId } }),
      prisma.department.count({ where: { organizationId } }),
      prisma.customCurriculum.count({ where: { organizationId } }),
      prisma.customAIModel.count({ where: { organizationId } }),
      prisma.policy.count({ where: { organizationId } }),
    ]);

  const instructors = memberRows.filter(
    (m) => m.role === "admin" || m.role === "instructor"
  ).length;

  return {
    members: memberRows.length,
    instructors,
    students: memberRows.length - instructors,
    teams,
    departments,
    curriculums,
    aiModels,
    policies,
  };
}

export async function getOrgAIAnalytics(
  organizationId: string
): Promise<OrgAIAnalyticsData> {
  const userIds = await getMemberUserIds(organizationId);

  if (userIds.length === 0) {
    return {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      avgLatency: 0,
      fallbackRate: 0,
      requestsByProvider: {},
      requestsByMode: {},
    };
  }

  const requests = await prisma.aIRequest.findMany({
    where: { userId: { in: userIds } },
    select: {
      provider: true,
      mode: true,
      inputTokens: true,
      outputTokens: true,
      latency: true,
      cost: true,
      fallbackUsed: true,
    },
  });

  const total = requests.length;
  const totalInputTokens = requests.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = requests.reduce((s, r) => s + r.outputTokens, 0);
  const totalCost = requests.reduce((s, r) => s + r.cost, 0);
  const totalLatency = requests.reduce((s, r) => s + r.latency, 0);
  const fallbackCount = requests.filter((r) => r.fallbackUsed).length;

  const requestsByProvider: Record<string, number> = {};
  const requestsByMode: Record<string, number> = {};

  for (const r of requests) {
    requestsByProvider[r.provider] = (requestsByProvider[r.provider] || 0) + 1;
    requestsByMode[r.mode] = (requestsByMode[r.mode] || 0) + 1;
  }

  return {
    totalRequests: total,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
    avgLatency: total > 0 ? totalLatency / total : 0,
    fallbackRate: total > 0 ? (fallbackCount / total) * 100 : 0,
    requestsByProvider,
    requestsByMode,
  };
}

export async function recordAnalyticsEvent(data: {
  organizationId?: string;
  userId?: string;
  event: string;
  data?: Record<string, unknown>;
}): Promise<AnalyticsEventData> {
  const event = await prisma.analyticsEvent.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      event: data.event,
      data: data.data !== undefined ? JSON.stringify(data.data) : "{}",
    },
  });

  return formatAnalyticsEvent(event);
}

export async function queryAnalyticsEvents(query: {
  organizationId?: string;
  event?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: AnalyticsEventData[]; total: number }> {
  const where = {
    ...(query.organizationId && { organizationId: query.organizationId }),
    ...(query.event && { event: query.event }),
    ...(query.userId && { userId: query.userId }),
    ...(query.startDate && { createdAt: { gte: new Date(query.startDate) } }),
    ...(query.endDate && { createdAt: { lte: new Date(query.endDate) } }),
  };

  const [events, total] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
      skip: query.offset ?? 0,
    }),
    prisma.analyticsEvent.count({ where }),
  ]);

  return {
    events: events.map(formatAnalyticsEvent),
    total,
  };
}

export async function getOrgActivityTimeline(
  organizationId: string,
  days: number = 30
): Promise<OrgActivityPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      organizationId,
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();

  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }

  return Array.from(buckets.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
