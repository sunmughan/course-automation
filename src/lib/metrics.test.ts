import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { count: vi.fn() },
    organization: { count: vi.fn() },
    subscription: { count: vi.fn() },
    auditLog: { count: vi.fn(), findMany: vi.fn() },
    batch: { count: vi.fn(), findMany: vi.fn() },
    studentProgress: { findMany: vi.fn() },
    intervention: { count: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getAdminMetrics, getInstructorMetrics } from "@/lib/metrics";

describe("admin metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts distinct populated user IDs from recent audit activity", async () => {
    prismaMock.organization.count.mockResolvedValue(2);
    prismaMock.user.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    prismaMock.subscription.count.mockResolvedValue(3);
    prismaMock.auditLog.findMany.mockResolvedValue([
      { userId: "student-1" },
      { userId: "student-2" },
      { userId: "student-1" },
      { userId: null },
    ]);
    prismaMock.auditLog.count.mockResolvedValue(4);

    await expect(getAdminMetrics()).resolves.toMatchObject({
      activeUsers: 2,
      recentAuditCount: 4,
    });
  });

  it("calculates user, activity, and subscription metrics from Prisma data", async () => {
    prismaMock.organization.count.mockResolvedValue(2);
    prismaMock.user.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    prismaMock.auditLog.findMany.mockResolvedValue([
      { userId: "student-1" },
      { userId: "student-2" },
      { userId: "student-3" },
      { userId: "student-4" },
      { userId: "student-1" },
    ]);
    prismaMock.subscription.count.mockResolvedValue(3);
    prismaMock.auditLog.count.mockResolvedValue(6);

    await expect(getAdminMetrics()).resolves.toEqual({
      totalOrganizations: 2,
      totalUsers: 7,
      activeUsers: 4,
      students: 4,
      instructors: 2,
      activeSubscriptions: 3,
      recentAuditCount: 6,
    });
  });
});

describe("instructor metrics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses students rather than progress rows as the completion denominator", async () => {
    prismaMock.batch.count.mockResolvedValue(1);
    prismaMock.batch.findMany.mockResolvedValue([
      {
        isActive: true,
        students: [
          { studentId: "student-1", status: "active" },
          { studentId: "student-2", status: "active" },
          { studentId: "student-3", status: "active" },
        ],
      },
    ]);
    prismaMock.studentProgress.findMany.mockResolvedValue([
      { userId: "student-1", status: "completed", score: 80 },
      { userId: "student-1", status: "completed", score: 90 },
      { userId: "student-2", status: "in_progress", score: 40 },
    ]);
    prismaMock.intervention.count.mockResolvedValue(0);

    await expect(getInstructorMetrics("instructor-1")).resolves.toMatchObject({
      completionRate: 33,
    });
  });

  it("calculates completion, average completion, active interventions, and not-started students", async () => {
    prismaMock.batch.count.mockResolvedValue(2);
    prismaMock.batch.findMany.mockResolvedValue([
      {
        isActive: true,
        students: [
          { studentId: "student-1", status: "active" },
          { studentId: "student-2", status: "active" },
          { studentId: "student-3", status: "active" },
        ],
      },
      {
        isActive: false,
        students: [
          { studentId: "student-4", status: "active" },
          { studentId: "student-5", status: "inactive" },
        ],
      },
    ]);
    prismaMock.studentProgress.findMany.mockResolvedValue([
      { userId: "student-1", status: "completed", score: 80 },
      { userId: "student-1", status: "completed", score: 60 },
      { userId: "student-2", status: "in_progress", score: 40 },
      { userId: "student-4", status: "not_started", score: null },
    ]);
    prismaMock.intervention.count.mockResolvedValue(1);

    await expect(getInstructorMetrics("instructor-1")).resolves.toEqual({
      totalBatches: 2,
      totalStudents: 5,
      activeStudents: 4,
      completionRate: 20,
      averageCompletion: 20,
      activeInterventions: 1,
      notStartedStudents: 3,
    });
  });
});
