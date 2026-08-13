import { prisma } from "@/lib/db";

export interface AuditEntry {
  id: string;
  organizationId: string | null;
  userId: string | null;
  userName?: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditQuery {
  organizationId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function logAudit(data: {
  organizationId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: data.organizationId || null,
      userId: data.userId || null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      details: data.details ? JSON.stringify(data.details) : null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    },
  });
}

export async function queryAuditLogs(
  query: AuditQuery
): Promise<{ entries: AuditEntry[]; total: number }> {
  const where: Record<string, unknown> = {};

  if (query.organizationId) where.organizationId = query.organizationId;
  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = query.action;
  if (query.resource) where.resource = query.resource;

  if (query.startDate || query.endDate) {
    const createdAt: Record<string, Date> = {};
    if (query.startDate) createdAt.gte = new Date(query.startDate);
    if (query.endDate) createdAt.lte = new Date(query.endDate);
    where.createdAt = createdAt;
  }

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: query.limit || 50,
      skip: query.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      organizationId: e.organizationId,
      userId: e.userId,
      userName: e.user?.name || null,
      action: e.action,
      resource: e.resource,
      resourceId: e.resourceId,
      details: e.details,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
  };
}

export async function getRecentActivity(
  organizationId: string,
  limit: number = 20
): Promise<AuditEntry[]> {
  const { entries } = await queryAuditLogs({ organizationId, limit });
  return entries;
}